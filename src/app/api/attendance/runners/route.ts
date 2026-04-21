import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';

interface AttendanceRunner {
  id: number;
  nickname: string;
  full_name: string | null;
  email: string | null;
  rfg_runner_id: number | null;
}

export async function GET() {
  try {
    const runners = await dbAll<AttendanceRunner>(`
      SELECT id, nickname, full_name, email, rfg_runner_id
      FROM attendance_runners
      ORDER BY nickname ASC
    `);

    return NextResponse.json(runners);
  } catch (error) {
    console.error('Attendance runners error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance runners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, full_name, email } = body;

    if (!nickname) {
      return NextResponse.json({ error: 'nickname required' }, { status: 400 });
    }

    // Check for existing runner
    const existing = await dbAll<{ id: number }>(
      `SELECT id FROM attendance_runners WHERE nickname = ?`,
      [nickname]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Runner with this nickname already exists' }, { status: 409 });
    }

    const result = await dbRun(
      `INSERT INTO attendance_runners (nickname, full_name, email) VALUES (?, ?, ?)`,
      [nickname, full_name || null, email || null]
    );

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create attendance runner error:', error);
    return NextResponse.json({ error: 'Failed to create attendance runner' }, { status: 500 });
  }
}
