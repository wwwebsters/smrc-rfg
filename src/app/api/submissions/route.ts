import { NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';
import { formatTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function notifyDiscord(runnerNickname: string, raceName: string, raceDate: string, distance: string, finishTime: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const time = formatTime(finishTime);

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'New Race Submission',
          color: 0xF59E0B, // amber
          fields: [
            { name: 'Runner', value: runnerNickname, inline: true },
            { name: 'Race', value: raceName, inline: true },
            { name: 'Date', value: raceDate, inline: true },
            { name: 'Distance', value: distance, inline: true },
            { name: 'Finish Time', value: time, inline: true },
          ],
          footer: { text: 'Pending admin review' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (err) {
    console.error('Discord webhook error:', err);
  }
}

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

    const today = new Date().toISOString().split('T')[0];
    if (raceDate > today) {
      return NextResponse.json(
        { error: 'Race date cannot be in the future' },
        { status: 400 }
      );
    }

    const result = await dbRun(
      `INSERT INTO pending_submissions (runner_nickname, race_name, race_date, distance, finish_time_seconds, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [runnerNickname, raceName, raceDate, distance, Number(finishTime)]
    );

    // Notify admins via Discord (fire and forget)
    notifyDiscord(runnerNickname, raceName, raceDate, distance, Number(finishTime));

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), message: 'Submission received and pending review' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submissions POST error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
