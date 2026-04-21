import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun, dbGet } from '@/lib/db';

interface AttendanceRecord {
  runner_id: number;
  nickname: string;
  full_name: string | null;
  present: number;
  source: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const weekId = parseInt(id, 10);

    // Get week info
    const week = await dbGet<{ id: number; week_date: string; timmy_year: number; week_number: number; status: string }>(
      `SELECT id, week_date, timmy_year, week_number, status FROM attendance_weeks WHERE id = ?`,
      [weekId]
    );

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Get all runners with their attendance for this week
    const records = await dbAll<AttendanceRecord>(`
      SELECT
        ar.id as runner_id,
        ar.nickname,
        ar.full_name,
        COALESCE(rec.present, 0) as present,
        COALESCE(rec.source, 'none') as source
      FROM attendance_runners ar
      LEFT JOIN attendance_records rec ON ar.id = rec.runner_id AND rec.week_id = ?
      ORDER BY ar.nickname ASC
    `, [weekId]);

    return NextResponse.json({ week, records });
  } catch (error) {
    console.error('Attendance week detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance week' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const weekId = parseInt(id, 10);
    const body = await request.json();
    const { records, status } = body;

    // Update attendance records
    if (records && Array.isArray(records)) {
      for (const record of records) {
        await dbRun(
          `INSERT OR REPLACE INTO attendance_records (runner_id, week_id, present, source)
           VALUES (?, ?, ?, 'manual')`,
          [record.runner_id, weekId, record.present ? 1 : 0]
        );
      }
    }

    // Update week status if provided
    if (status) {
      const approvedAt = status === 'approved' ? new Date().toISOString() : null;
      await dbRun(
        `UPDATE attendance_weeks SET status = ?, approved_at = ? WHERE id = ?`,
        [status, approvedAt, weekId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update attendance week error:', error);
    return NextResponse.json({ error: 'Failed to update attendance week' }, { status: 500 });
  }
}
