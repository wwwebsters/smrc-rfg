import { NextResponse } from 'next/server';
import { dbAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RunnerRow {
  id: number;
  nickname: string;
  full_name: string;
}

interface RaceScore {
  race_number: number;
  points_earned: number;
}

export async function GET() {
  try {
    const runners = await dbAll<RunnerRow>(`
      SELECT DISTINCT r.id, r.nickname, r.full_name
      FROM runners r
      INNER JOIN race_results rr ON r.id = rr.runner_id
      WHERE rr.status = 'approved'
    `);

    const leaderboard = await Promise.all(
      runners.map(async (runner) => {
        const raceScores = await dbAll<RaceScore>(
          `SELECT race_number, points_earned
           FROM race_results
           WHERE runner_id = ? AND status = 'approved'
           ORDER BY race_number ASC`,
          [runner.id]
        );

        const totalPoints = raceScores.reduce((sum, s) => sum + s.points_earned, 0);
        const raceCount = raceScores.length;
        const efficiency = raceCount > 0 ? Math.round((totalPoints / raceCount) * 100) / 100 : 0;

        return {
          runner_id: runner.id,
          nickname: runner.nickname,
          full_name: runner.full_name,
          total_points: totalPoints,
          race_count: raceCount,
          efficiency,
          race_scores: raceScores,
        };
      })
    );

    // Sort by points, then efficiency as secondary tiebreaker for display order
    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.efficiency - a.efficiency;
    });

    // Assign ranks - tied runners get the same rank, next rank skips
    let currentRank = 1;
    const rankedLeaderboard = leaderboard.map((entry, idx) => {
      if (idx > 0) {
        const prev = leaderboard[idx - 1];
        // Tie if same points AND same efficiency
        if (entry.total_points === prev.total_points && entry.efficiency === prev.efficiency) {
          // Keep same rank as previous
        } else {
          currentRank = idx + 1;
        }
      }
      return { ...entry, rank: currentRank };
    });

    return NextResponse.json(rankedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
