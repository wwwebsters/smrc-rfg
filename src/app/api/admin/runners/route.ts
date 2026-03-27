import { NextResponse } from 'next/server';
import { dbRun, dbGet, getDb } from '@/lib/db';
import { parseTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Distance display names to DB keys
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

    // Insert runner
    const result = await dbRun(
      `INSERT INTO runners (nickname, full_name, birthday, age) VALUES (?, ?, ?, ?)`,
      [nickname.trim(), fullName.trim(), birthday || null, age]
    );

    const runnerId = Number(result.lastInsertRowid);

    // Insert PR data for each distance that has any data
    if (prs && typeof prs === 'object') {
      const statements: { sql: string; args: (string | number | null)[] }[] = [];

      for (const [dist, prData] of Object.entries(prs)) {
        const d = prData as Record<string, string>;
        // Skip if no data entered for this distance
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
