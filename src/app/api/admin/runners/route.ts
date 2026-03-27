import { NextResponse } from 'next/server';
import { dbRun, dbGet, dbAll, getDb } from '@/lib/db';
import { parseTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Scoring constants
const DISTANCE_ORDER = ['5 km', '4 Mile', '5 Mile', '10 km', '8 km', '15 km',
  '10 Mile', 'H. Mar', 'Marathon', '50 km', '50 Mile', '100 Mile'];
const PR_POINTS =    [8, 8, 9, 9, 11, 11, 12, 13, 16, 17, 18, 19];
const AG_PR_POINTS = [6, 6, 7, 7,  8,  8,  9, 10, 12, 13, 14, 15];

function getPartPoints(dist: string): number {
  const short = ['5 km', '4 Mile', '5 Mile'];
  const mid = ['10 km', '8 km'];
  const half = ['15 km', '10 Mile', 'H. Mar'];
  if (short.includes(dist)) return 1;
  if (mid.includes(dist)) return 2;
  if (half.includes(dist)) return 3;
  return 4;
}

// Display distance to DB key mapping (used for race_results -> runner_prs lookup)
const DISPLAY_TO_DB: Record<string, string> = {
  '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
  '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
  '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
  'Full Marathon': 'Marathon', '50k': '50 km',
  '50 Mile': '50 Mile', '100 Mile': '100 Mile',
};

async function rescoreRunnerResults(runnerId: number): Promise<number> {
  // Get all approved race results for this runner, ordered chronologically
  const results = await dbAll<{
    id: number; distance: string; finish_time_seconds: number;
    points_earned: number; points_type: string;
  }>(
    `SELECT id, distance, finish_time_seconds, points_earned, points_type
     FROM race_results WHERE runner_id = ? AND status = 'approved'
     ORDER BY race_date ASC, race_number ASC`,
    [runnerId]
  );

  let rescored = 0;

  for (const result of results) {
    const distKey = DISPLAY_TO_DB[result.distance] || result.distance;
    const distIdx = DISTANCE_ORDER.indexOf(distKey);

    // Get current PR and target for this distance
    const pr = await dbGet<{
      pr_time_seconds: number | null;
      target_seconds: number | null;
    }>(
      `SELECT pr_time_seconds, target_seconds FROM runner_prs WHERE runner_id = ? AND distance = ?`,
      [runnerId, distKey]
    );

    // Also check the previous baseline stored on the result
    const prev = await dbGet<{ previous_pr_time_seconds: number | null }>(
      `SELECT previous_pr_time_seconds FROM race_results WHERE id = ?`,
      [result.id]
    );

    // Use the previous PR as the baseline (what the PR was before this race)
    // If not available, use the current PR from runner_prs
    const baselinePR = prev?.previous_pr_time_seconds ?? pr?.pr_time_seconds;
    const baselineTarget = pr?.target_seconds;

    const isPR = baselinePR && result.finish_time_seconds < baselinePR;
    const isAGPR = baselineTarget && result.finish_time_seconds < baselineTarget;
    const isFirstTime = !pr;

    let newPoints: number;
    let newType: string;

    if (isPR && distIdx >= 0) {
      newPoints = PR_POINTS[distIdx];
      newType = 'PR';
    } else if ((isAGPR || isFirstTime) && distIdx >= 0) {
      newPoints = AG_PR_POINTS[distIdx];
      newType = isFirstTime ? 'FIRST_TIME' : 'AG_PR';
    } else {
      newPoints = getPartPoints(distKey);
      newType = 'PARTICIPATION';
    }

    // Update if scoring changed
    if (newPoints !== result.points_earned || newType !== result.points_type) {
      await dbRun(
        `UPDATE race_results SET points_earned = ?, points_type = ? WHERE id = ?`,
        [newPoints, newType, result.id]
      );
      rescored++;
    }
  }

  return rescored;
}

// Distance display names to DB keys (for add/edit runner form)
const DIST_TO_DB: Record<string, string> = {
  '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
  '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
  '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
  'Full Marathon': 'Marathon', '50k': '50 km',
  '50 Mile': '50 Mile', '100 Mile': '100 Mile',
};

export async function POST(request: Request) {
  try {
    const { nickname, fullName, birthday, prs } = await request.json();

    if (!nickname || !fullName) {
      return NextResponse.json(
        { error: 'Nickname and full name are required' },
        { status: 400 }
      );
    }

    const existing = await dbGet<{ id: number }>(
      `SELECT id FROM runners WHERE nickname = ?`,
      [nickname]
    );

    if (existing) {
      return NextResponse.json(
        { error: `Runner with nickname "${nickname}" already exists` },
        { status: 409 }
      );
    }

    let age: number | null = null;
    if (birthday) {
      const birth = new Date(birthday);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    const result = await dbRun(
      `INSERT INTO runners (nickname, full_name, birthday, age) VALUES (?, ?, ?, ?)`,
      [nickname.trim(), fullName.trim(), birthday || null, age]
    );

    const runnerId = Number(result.lastInsertRowid);

    if (prs && typeof prs === 'object') {
      const statements: { sql: string; args: (string | number | null)[] }[] = [];

      for (const [dist, prData] of Object.entries(prs)) {
        const d = prData as Record<string, string>;
        const hasData = d.pr || d.agPr || d.agPrDate || d.ageAtAgPr || d.factorAtRace || d.agTime || d.todaysFactor || d.target;
        if (!hasData) continue;

        const dbDist = DIST_TO_DB[dist] || dist;
        const prTime = parseTime(d.pr);
        const agPrTime = parseTime(d.agPr);
        const agTime = parseTime(d.agTime);
        const targetTime = parseTime(d.target);
        const factorAtRace = d.factorAtRace ? parseFloat(d.factorAtRace) : null;
        const todaysFactor = d.todaysFactor ? parseFloat(d.todaysFactor) : null;
        const ageAtAgPr = d.ageAtAgPr ? parseInt(d.ageAtAgPr) : null;

        statements.push({
          sql: `INSERT INTO runner_prs (runner_id, distance, pr_time_seconds, ag_pr_time_seconds, ag_pr_date,
                age_at_ag_pr, factor_at_race, ag_time_seconds, todays_factor, target_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            runnerId, dbDist, prTime, agPrTime, d.agPrDate || null,
            ageAtAgPr, isNaN(factorAtRace as number) ? null : factorAtRace,
            agTime, isNaN(todaysFactor as number) ? null : todaysFactor, targetTime
          ],
        });
      }

      if (statements.length > 0) {
        const db = getDb();
        await db.batch(statements, 'write');
      }
    }

    return NextResponse.json(
      { id: runnerId, message: `Runner "${nickname}" added successfully` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add runner error:', error);
    return NextResponse.json({ error: 'Failed to add runner' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const runners = await dbAll(
      `SELECT r.id, r.nickname, r.full_name, r.birthday, r.age,
              (SELECT COUNT(*) FROM race_results rr WHERE rr.runner_id = r.id AND rr.status = 'approved') as race_count
       FROM runners r ORDER BY r.full_name ASC`
    );
    return NextResponse.json(runners);
  } catch (error) {
    console.error('Admin runners GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nickname, fullName, birthday, prs } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing runner id' }, { status: 400 });
    }

    const existing = await dbGet<{ id: number; nickname: string }>(
      `SELECT id, nickname FROM runners WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    // Check nickname uniqueness if changed
    if (nickname && nickname !== existing.nickname) {
      const dup = await dbGet<{ id: number }>(
        `SELECT id FROM runners WHERE nickname = ? AND id != ?`,
        [nickname, id]
      );
      if (dup) {
        return NextResponse.json({ error: `Nickname "${nickname}" is already taken` }, { status: 409 });
      }
    }

    let age: number | null = null;
    if (birthday) {
      const birth = new Date(birthday);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    await dbRun(
      `UPDATE runners SET nickname = ?, full_name = ?, birthday = ?, age = ? WHERE id = ?`,
      [nickname?.trim() || existing.nickname, fullName?.trim(), birthday || null, age, id]
    );

    // Update PRs if provided
    if (prs && typeof prs === 'object') {
      // Delete existing PRs and re-insert
      await dbRun('DELETE FROM runner_prs WHERE runner_id = ?', [id]);

      const statements: { sql: string; args: (string | number | null)[] }[] = [];
      for (const [dist, prData] of Object.entries(prs)) {
        const d = prData as Record<string, string>;
        const hasData = d.pr || d.agPr || d.agPrDate || d.ageAtAgPr || d.factorAtRace || d.agTime || d.todaysFactor || d.target;
        if (!hasData) continue;

        const dbDist = DIST_TO_DB[dist] || dist;
        const prTime = parseTime(d.pr);
        const agPrTime = parseTime(d.agPr);
        const agTime = parseTime(d.agTime);
        const targetTime = parseTime(d.target);
        const factorAtRace = d.factorAtRace ? parseFloat(d.factorAtRace) : null;
        const todaysFactor = d.todaysFactor ? parseFloat(d.todaysFactor) : null;
        const ageAtAgPr = d.ageAtAgPr ? parseInt(d.ageAtAgPr) : null;

        statements.push({
          sql: `INSERT INTO runner_prs (runner_id, distance, pr_time_seconds, ag_pr_time_seconds, ag_pr_date,
                age_at_ag_pr, factor_at_race, ag_time_seconds, todays_factor, target_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id, dbDist, prTime, agPrTime, d.agPrDate || null,
            ageAtAgPr, isNaN(factorAtRace as number) ? null : factorAtRace,
            agTime, isNaN(todaysFactor as number) ? null : todaysFactor, targetTime
          ],
        });
      }

      if (statements.length > 0) {
        const db = getDb();
        await db.batch(statements, 'write');
      }

      // Rescore all approved race results for this runner
      const rescored = await rescoreRunnerResults(id);
      if (rescored > 0) {
        return NextResponse.json({ message: `Runner updated. ${rescored} race result(s) rescored.` });
      }
    }

    return NextResponse.json({ message: 'Runner updated' });
  } catch (error) {
    console.error('Update runner error:', error);
    return NextResponse.json({ error: 'Failed to update runner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing runner id' }, { status: 400 });
    }

    const runner = await dbGet<{ id: number; nickname: string }>(
      `SELECT id, nickname FROM runners WHERE id = ?`,
      [id]
    );

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    // Check for approved race results
    const results = await dbAll(
      `SELECT id FROM race_results WHERE runner_id = ? AND status = 'approved'`,
      [id]
    );

    if (results.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${runner.nickname}" — they have ${results.length} approved race result(s). Delete those first.` },
        { status: 409 }
      );
    }

    // Delete PRs, pending submissions, then runner
    const db = getDb();
    await db.batch([
      { sql: 'DELETE FROM runner_prs WHERE runner_id = ?', args: [id] },
      { sql: 'DELETE FROM pending_submissions WHERE runner_nickname = ?', args: [runner.nickname] },
      { sql: 'DELETE FROM runners WHERE id = ?', args: [id] },
    ], 'write');

    return NextResponse.json({ message: `Runner "${runner.nickname}" deleted` });
  } catch (error) {
    console.error('Delete runner error:', error);
    return NextResponse.json({ error: 'Failed to delete runner' }, { status: 500 });
  }
}
