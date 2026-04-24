import { NextResponse } from 'next/server';
import { dbAll } from '@/lib/db';

interface LeaderboardEntry {
  runner_id: number;
  nickname: string;
  full_name: string | null;
  total_2026: number;
  attendance_pct: number;
  current_streak: number;
  total_2025_same_weeks: number;
  total_2025: number;
  total_2024: number;
  total_2023: number;
}

export async function GET() {
  try {
    // Get current Timmy Year (2026) weeks count for percentage calculation
    const weeksResult = await dbAll<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM attendance_weeks WHERE timmy_year = 2026 AND status = 'approved'`
    );
    const totalWeeks2026 = weeksResult[0]?.cnt || 1;

    // Get leaderboard with totals per year, attendance %, and streaks
    // For YoY comparison, compare against same number of weeks in previous year
    const leaderboard = await dbAll<LeaderboardEntry>(`
      SELECT
        ar.id as runner_id,
        ar.nickname,
        ar.full_name,
        COALESCE(SUM(CASE WHEN aw.timmy_year = 2026 AND rec.present = 1 THEN 1 ELSE 0 END), 0) as total_2026,
        ROUND(COALESCE(SUM(CASE WHEN aw.timmy_year = 2026 AND rec.present = 1 THEN 1 ELSE 0 END), 0) * 100.0 / ?, 1) as attendance_pct,
        0 as current_streak,
        COALESCE(SUM(CASE WHEN aw.timmy_year = 2025 AND aw.week_number <= ? AND rec.present = 1 THEN 1 ELSE 0 END), 0) as total_2025_same_weeks,
        COALESCE(SUM(CASE WHEN aw.timmy_year = 2025 AND rec.present = 1 THEN 1 ELSE 0 END), 0) as total_2025,
        COALESCE(SUM(CASE WHEN aw.timmy_year = 2024 AND rec.present = 1 THEN 1 ELSE 0 END), 0) as total_2024,
        COALESCE(SUM(CASE WHEN aw.timmy_year = 2023 AND rec.present = 1 THEN 1 ELSE 0 END), 0) as total_2023
      FROM attendance_runners ar
      LEFT JOIN attendance_records rec ON ar.id = rec.runner_id
      LEFT JOIN attendance_weeks aw ON rec.week_id = aw.id
      GROUP BY ar.id, ar.nickname, ar.full_name
      HAVING total_2026 > 0
      ORDER BY total_2026 DESC, ar.nickname ASC
    `, [totalWeeks2026, totalWeeks2026]);

    // Calculate streaks for each runner
    for (const runner of leaderboard) {
      const streakResult = await dbAll<{ present: number; week_date: string }>(
        `SELECT rec.present, aw.week_date
         FROM attendance_records rec
         JOIN attendance_weeks aw ON rec.week_id = aw.id
         WHERE rec.runner_id = ? AND aw.timmy_year = 2026
         ORDER BY aw.week_date DESC`,
        [runner.runner_id]
      );

      let streak = 0;
      for (const week of streakResult) {
        if (week.present === 1) {
          streak++;
        } else {
          break;
        }
      }
      runner.current_streak = streak;
    }

    return NextResponse.json({
      leaderboard,
      totalWeeks: totalWeeks2026,
      year: 2026,
    });
  } catch (error) {
    console.error('Attendance leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance leaderboard' }, { status: 500 });
  }
}
