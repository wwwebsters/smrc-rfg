import { NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await dbAll(
      `SELECT rr.id, rr.runner_id, r.nickname, r.full_name, rr.race_name, rr.race_date,
              rr.distance, rr.finish_time_seconds, rr.points_earned, rr.points_type, rr.race_number,
              (SELECT ps.submitted_at FROM pending_submissions ps
               WHERE ps.runner_nickname = r.nickname AND ps.race_name = rr.race_name
               AND ps.race_date = rr.race_date AND ps.status = 'approved'
               ORDER BY ps.id DESC LIMIT 1) as submitted_at
       FROM race_results rr
       JOIN runners r ON rr.runner_id = r.id
       WHERE rr.status = 'approved'
       ORDER BY rr.race_date ASC, rr.id ASC`
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Admin results GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, race_name, race_date, distance, finish_time_seconds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing result id' }, { status: 400 });
    }

    const existing = await dbGet<{ id: number; runner_id: number; distance: string }>(
      `SELECT id, runner_id, distance FROM race_results WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Recalculate scoring based on the (possibly updated) time and distance
    const distMap: Record<string, string> = {
      '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
      '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
      '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
      'Full Marathon': 'Marathon', '50k': '50 km',
      '50 Mile': '50 Mile', '100 Mile': '100 Mile',
    };
    const distKey = distMap[distance] || distance;

    const distanceOrder = ['5 km', '4 Mile', '5 Mile', '10 km', '8 km', '15 km',
      '10 Mile', 'H. Mar', 'Marathon', '50 km', '50 Mile', '100 Mile'];
    const PR_POINTS =    [8, 8, 9, 9, 11, 11, 12, 13, 16, 17, 18, 19];
    const AG_PR_POINTS = [6, 6, 7, 7,  8,  8,  9, 10, 12, 13, 14, 15];
    const distIdx = distanceOrder.indexOf(distKey);

    function getPartPoints(dist: string): number {
      const short = ['5 km', '4 Mile', '5 Mile'];
      const mid = ['10 km', '8 km'];
      const half = ['15 km', '10 Mile', 'H. Mar'];
      if (short.includes(dist)) return 1;
      if (mid.includes(dist)) return 2;
      if (half.includes(dist)) return 3;
      return 4;
    }

    // Look up the runner's original PR data (from previous_* columns on this result)
    const prevData = await dbGet<{
      previous_pr_time_seconds: number | null;
      previous_ag_pr_time_seconds: number | null;
    }>(
      `SELECT previous_pr_time_seconds, previous_ag_pr_time_seconds FROM race_results WHERE id = ?`,
      [id]
    );

    // Also get the current runner_prs target for AG PR check
    const pr = await dbGet<{
      pr_time_seconds: number | null;
      target_seconds: number | null;
    }>(
      `SELECT pr_time_seconds, target_seconds FROM runner_prs WHERE runner_id = ? AND distance = ?`,
      [existing.runner_id, distKey]
    );

    // Use the original PR time (before this result was approved) to determine if the new time is still a PR
    // If previous_pr_time is available, compare against that (the pre-approval baseline)
    const baselinePR = prevData?.previous_pr_time_seconds ?? pr?.pr_time_seconds;
    const baselineTarget = pr?.target_seconds;

    let pointsEarned: number;
    let pointsType: string;

    const isPR = baselinePR && finish_time_seconds < baselinePR;
    const isAGPR = baselineTarget && finish_time_seconds < baselineTarget;
    const isFirstTime = !pr;

    if (isPR && distIdx >= 0) {
      pointsEarned = PR_POINTS[distIdx];
      pointsType = 'PR';
    } else if ((isAGPR || isFirstTime) && distIdx >= 0) {
      pointsEarned = AG_PR_POINTS[distIdx];
      pointsType = isFirstTime ? 'FIRST_TIME' : 'AG_PR';
    } else {
      pointsEarned = getPartPoints(distKey);
      pointsType = 'PARTICIPATION';
    }

    // Update the result with recalculated scoring
    await dbRun(
      `UPDATE race_results
       SET race_name = ?, race_date = ?, distance = ?,
           finish_time_seconds = ?, points_earned = ?, points_type = ?
       WHERE id = ?`,
      [race_name, race_date, distance, finish_time_seconds, pointsEarned, pointsType, id]
    );

    // If the result was previously a PR but no longer is, restore the runner's PR data
    const oldResult = await dbGet<{ points_type: string }>(
      `SELECT points_type FROM race_results WHERE id = ?`,
      [id]
    );

    // Update runner_prs if classification changed
    if (pointsType === 'PR') {
      // Still/now a PR — update runner's pr_time
      await dbRun(
        `UPDATE runner_prs SET pr_time_seconds = ?, ag_pr_time_seconds = ? WHERE runner_id = ? AND distance = ?`,
        [finish_time_seconds, finish_time_seconds, existing.runner_id, distKey]
      );
    } else if (prevData?.previous_pr_time_seconds !== null && oldResult?.points_type !== pointsType) {
      // Was a PR, no longer is — restore previous PR
      await dbRun(
        `UPDATE runner_prs SET pr_time_seconds = ?, ag_pr_time_seconds = ? WHERE runner_id = ? AND distance = ?`,
        [prevData?.previous_pr_time_seconds, prevData?.previous_ag_pr_time_seconds, existing.runner_id, distKey]
      );
    }

    return NextResponse.json({ message: 'Result updated', pointsEarned, pointsType });
  } catch (error) {
    console.error('Admin results PUT error:', error);
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing result id' }, { status: 400 });
    }

    const existing = await dbGet<{
      id: number;
      runner_id: number;
      distance: string;
      points_type: string;
      previous_pr_time_seconds: number | null;
      previous_ag_pr_time_seconds: number | null;
      previous_ag_pr_date: string | null;
      previous_age_at_ag_pr: number | null;
      previous_factor_at_race: number | null;
    }>(
      `SELECT id, runner_id, distance, points_type,
              previous_pr_time_seconds, previous_ag_pr_time_seconds,
              previous_ag_pr_date, previous_age_at_ag_pr, previous_factor_at_race
       FROM race_results WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Map display distance to DB key for runner_prs lookup
    const distMap: Record<string, string> = {
      '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
      '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
      '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
      'Full Marathon': 'Marathon', '50k': '50 km',
      '50 Mile': '50 Mile', '100 Mile': '100 Mile',
    };
    const distKey = distMap[existing.distance] || existing.distance;

    // If this was a PR or AG PR, restore the previous runner_prs state
    if (existing.points_type === 'PR' || existing.points_type === 'AG_PR') {
      if (existing.points_type === 'PR') {
        await dbRun(
          `UPDATE runner_prs
           SET pr_time_seconds = ?, ag_pr_time_seconds = ?, ag_pr_date = ?,
               age_at_ag_pr = ?, factor_at_race = ?
           WHERE runner_id = ? AND distance = ?`,
          [existing.previous_pr_time_seconds, existing.previous_ag_pr_time_seconds,
           existing.previous_ag_pr_date, existing.previous_age_at_ag_pr,
           existing.previous_factor_at_race, existing.runner_id, distKey]
        );
      } else {
        // AG PR — restore only AG PR fields
        await dbRun(
          `UPDATE runner_prs
           SET ag_pr_time_seconds = ?, ag_pr_date = ?,
               age_at_ag_pr = ?, factor_at_race = ?
           WHERE runner_id = ? AND distance = ?`,
          [existing.previous_ag_pr_time_seconds, existing.previous_ag_pr_date,
           existing.previous_age_at_ag_pr, existing.previous_factor_at_race,
           existing.runner_id, distKey]
        );
      }
    }

    await dbRun(`DELETE FROM race_results WHERE id = ?`, [id]);

    return NextResponse.json({
      message: 'Result deleted',
      restored: existing.points_type === 'PR' || existing.points_type === 'AG_PR',
    });
  } catch (error) {
    console.error('Admin results DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
