import { NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await dbAll(
      `SELECT rr.id, rr.runner_id, r.nickname, r.full_name, rr.race_name, rr.race_date,
              rr.distance, rr.finish_time_seconds, rr.points_earned, rr.points_type, rr.race_number,
              ps.submitted_at
       FROM race_results rr
       JOIN runners r ON rr.runner_id = r.id
       LEFT JOIN pending_submissions ps ON ps.runner_nickname = r.nickname
         AND ps.race_name = rr.race_name AND ps.race_date = rr.race_date AND ps.status = 'approved'
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
    const { id, race_name, race_date, distance, finish_time_seconds, points_earned, points_type } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing result id' }, { status: 400 });
    }

    // Verify the result exists
    const existing = await dbGet<{ id: number }>(
      `SELECT id FROM race_results WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    await dbRun(
      `UPDATE race_results
       SET race_name = ?, race_date = ?, distance = ?,
           finish_time_seconds = ?, points_earned = ?, points_type = ?
       WHERE id = ?`,
      [race_name, race_date, distance, finish_time_seconds, points_earned, points_type, id]
    );

    return NextResponse.json({ message: 'Result updated' });
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
