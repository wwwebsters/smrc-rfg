import { NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await dbAll(
      `SELECT rr.id, rr.runner_id, r.nickname, r.full_name, rr.race_name, rr.race_date,
              rr.distance, rr.finish_time_seconds, rr.points_earned, rr.points_type, rr.race_number
       FROM race_results rr
       JOIN runners r ON rr.runner_id = r.id
       WHERE rr.status = 'approved'
       ORDER BY rr.race_date DESC, rr.id DESC`
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
