import { NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const submissions = await dbAll(
      `SELECT id, runner_nickname, race_name, race_date, distance,
              finish_time_seconds, submitted_at, status
       FROM pending_submissions
       WHERE status = 'pending'
       ORDER BY submitted_at DESC`
    );
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Submissions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { runnerNickname, raceName, raceDate, distance, finishTime } = body;

    if (!runnerNickname || !raceName || !raceDate || !distance || finishTime == null) {
      return NextResponse.json(
        { error: 'Missing required fields: runnerNickname, raceName, raceDate, distance, finishTime' },
        { status: 400 }
      );
    }

    const result = await dbRun(
      `INSERT INTO pending_submissions (runner_nickname, race_name, race_date, distance, finish_time_seconds, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [runnerNickname, raceName, raceDate, distance, Number(finishTime)]
    );

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), message: 'Submission received and pending review' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submissions POST error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
