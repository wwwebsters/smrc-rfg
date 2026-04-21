import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet } from '@/lib/db';

interface RunnerDetail {
  id: number;
  nickname: string;
  full_name: string | null;
  email: string | null;
  rfg_runner_id: number | null;
}

interface AttendanceHistory {
  week_date: string;
  timmy_year: number;
  week_number: number;
  present: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const runnerId = parseInt(id, 10);

    const runner = await dbGet<RunnerDetail>(
      `SELECT id, nickname, full_name, email, rfg_runner_id FROM attendance_runners WHERE id = ?`,
      [runnerId]
    );

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    // Get attendance history
    const history = await dbAll<AttendanceHistory>(`
      SELECT
        aw.week_date,
        aw.timmy_year,
        aw.week_number,
        rec.present
      FROM attendance_records rec
      JOIN attendance_weeks aw ON rec.week_id = aw.id
      WHERE rec.runner_id = ?
      ORDER BY aw.week_date DESC
    `, [runnerId]);

    // Calculate stats per year
    const stats: Record<number, { total: number; attended: number; pct: number }> = {};
    for (const record of history) {
      if (!stats[record.timmy_year]) {
        stats[record.timmy_year] = { total: 0, attended: 0, pct: 0 };
      }
      stats[record.timmy_year].total++;
      if (record.present) stats[record.timmy_year].attended++;
    }
    for (const year of Object.keys(stats)) {
      const y = parseInt(year, 10);
      stats[y].pct = Math.round((stats[y].attended / stats[y].total) * 100);
    }

    return NextResponse.json({ runner, history, stats });
  } catch (error) {
    console.error('Attendance runner detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance runner' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const runnerId = parseInt(id, 10);
    const body = await request.json();
    const { full_name, email } = body;

    await dbRun(
      `UPDATE attendance_runners SET full_name = ?, email = ? WHERE id = ?`,
      [full_name || null, email || null, runnerId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update attendance runner error:', error);
    return NextResponse.json({ error: 'Failed to update attendance runner' }, { status: 500 });
  }
}
