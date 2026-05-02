import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET() {
  try {
    // Get pending RSVPs (not yet approved)
    const result = await db.execute(`
      SELECT
        q.id,
        q.runner_id,
        q.nickname,
        q.week_date,
        q.status,
        q.raw_text,
        q.parsed_at,
        q.approved
      FROM attendance_rsvp_queue q
      WHERE q.approved = 0
      ORDER BY q.week_date DESC, q.nickname ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching RSVP queue:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVP queue' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, rsvpIds, weekDate } = await request.json();

    if (action === 'approve') {
      // First, collect the week dates from RSVPs we're about to process
      const weekDates = new Set<string>();

      // Approve selected RSVPs and create attendance records
      for (const id of rsvpIds) {
        // Get the RSVP
        const rsvp = await db.execute({
          sql: 'SELECT * FROM attendance_rsvp_queue WHERE id = ?',
          args: [id]
        });

        if (rsvp.rows.length === 0) continue;

        const r = rsvp.rows[0];
        weekDates.add(r.week_date as string);

        // Find or create the week
        let week = await db.execute({
          sql: 'SELECT id FROM attendance_weeks WHERE week_date = ?',
          args: [r.week_date]
        });

        let weekId: number;
        if (week.rows.length === 0) {
          // Create the week
          const weekDate = new Date(r.week_date as string);
          const timmyYear = weekDate.getMonth() === 11 && weekDate.getDate() >= 7
            ? weekDate.getFullYear() + 1
            : weekDate.getFullYear();

          // Get next week number
          const lastWeek = await db.execute({
            sql: 'SELECT MAX(week_number) as max_num FROM attendance_weeks WHERE timmy_year = ?',
            args: [timmyYear]
          });
          const weekNum = ((lastWeek.rows[0]?.max_num as number) || 0) + 1;

          const insert = await db.execute({
            sql: `INSERT INTO attendance_weeks (week_date, timmy_year, week_number, status)
                  VALUES (?, ?, ?, 'draft')`,
            args: [r.week_date, timmyYear, weekNum]
          });
          weekId = Number(insert.lastInsertRowid);
        } else {
          weekId = week.rows[0].id as number;
        }

        // Create attendance record if status is 'in'
        if (r.status === 'in') {
          await db.execute({
            sql: `INSERT OR REPLACE INTO attendance_records (week_id, runner_id, present)
                  VALUES (?, ?, 1)`,
            args: [weekId, r.runner_id]
          });
        }

        // Delete the processed RSVP
        await db.execute({
          sql: 'DELETE FROM attendance_rsvp_queue WHERE id = ?',
          args: [id]
        });
      }

      // Clear any remaining RSVPs for all weeks that were approved
      // This ensures the queue is clean for the next week
      for (const wd of weekDates) {
        await db.execute({
          sql: 'DELETE FROM attendance_rsvp_queue WHERE week_date = ?',
          args: [wd]
        });
      }

      return NextResponse.json({ success: true, approved: rsvpIds.length, clearedWeeks: Array.from(weekDates) });
    }

    if (action === 'dismiss') {
      // Delete dismissed RSVPs without creating attendance
      for (const id of rsvpIds) {
        await db.execute({
          sql: 'DELETE FROM attendance_rsvp_queue WHERE id = ?',
          args: [id]
        });
      }
      return NextResponse.json({ success: true, dismissed: rsvpIds.length });
    }

    if (action === 'clear_week') {
      // Clear all RSVPs for a specific week
      await db.execute({
        sql: 'DELETE FROM attendance_rsvp_queue WHERE week_date = ?',
        args: [weekDate]
      });
      return NextResponse.json({ success: true, cleared: weekDate });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing RSVP action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
