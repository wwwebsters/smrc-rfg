import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';

interface WeekWithAttendance {
  id: number;
  week_date: string;
  timmy_year: number;
  week_number: number;
  status: string;
  attendance_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const weeks = await dbAll<WeekWithAttendance>(`
      SELECT
        aw.id,
        aw.week_date,
        aw.timmy_year,
        aw.week_number,
        aw.status,
        COALESCE(SUM(rec.present), 0) as attendance_count
      FROM attendance_weeks aw
      LEFT JOIN attendance_records rec ON aw.id = rec.week_id
      WHERE aw.timmy_year = ?
      GROUP BY aw.id
      ORDER BY aw.week_date DESC
    `, [year]);

    return NextResponse.json(weeks);
  } catch (error) {
    console.error('Attendance weeks error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance weeks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { week_date, timmy_year } = body;

    if (!week_date || !timmy_year) {
      return NextResponse.json({ error: 'week_date and timmy_year required' }, { status: 400 });
    }

    // Calculate week number
    const existingWeeks = await dbAll<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM attendance_weeks WHERE timmy_year = ?`,
      [timmy_year]
    );
    const weekNumber = (existingWeeks[0]?.cnt || 0) + 1;

    const result = await dbRun(
      `INSERT INTO attendance_weeks (week_date, timmy_year, week_number, status) VALUES (?, ?, ?, 'draft')`,
      [week_date, timmy_year, weekNumber]
    );

    return NextResponse.json({ id: result.lastInsertRowid, week_number: weekNumber });
  } catch (error) {
    console.error('Create attendance week error:', error);
    return NextResponse.json({ error: 'Failed to create attendance week' }, { status: 500 });
  }
}
