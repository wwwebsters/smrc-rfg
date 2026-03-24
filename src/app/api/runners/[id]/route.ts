import { NextResponse } from 'next/server';
import { dbAll, dbGet } from '@/lib/db';

export const dynamic = 'force-dynamic';

function calculateAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface RunnerRow {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
}

interface PRRow {
  id: number;
  distance: string;
  pr_time_seconds: number | null;
  ag_pr_time_seconds: number | null;
  ag_pr_date: string | null;
  age_at_ag_pr: number | null;
  factor_at_race: number | null;
  ag_time_seconds: number | null;
  todays_factor: number | null;
  target_seconds: number | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const runner = await dbGet<RunnerRow>(
      `SELECT id, nickname, full_name, birthday, age FROM runners WHERE id = ?`,
      [Number(id)]
    );

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    const currentAge = runner.birthday ? calculateAge(runner.birthday) : runner.age;

    const prs = await dbAll<PRRow>(
      `SELECT id, distance, pr_time_seconds, ag_pr_time_seconds, ag_pr_date,
              age_at_ag_pr, factor_at_race, ag_time_seconds, todays_factor, target_seconds
       FROM runner_prs
       WHERE runner_id = ?
       ORDER BY distance ASC`,
      [Number(id)]
    );

    // Dynamically recalculate todays_factor and target based on current age
    const updatedPRs = await Promise.all(
      prs.map(async (pr) => {
        if (!currentAge || !pr.ag_time_seconds) return pr;

        const factorRow = await dbGet<{ factor: number }>(
          `SELECT factor FROM age_grading_factors WHERE age = ? AND distance = ?`,
          [currentAge, pr.distance]
        );

        if (factorRow) {
          const dynamicFactor = factorRow.factor;
          const dynamicTarget = pr.ag_time_seconds / dynamicFactor;
          return {
            ...pr,
            todays_factor: dynamicFactor,
            target_seconds: dynamicTarget,
          };
        }
        return pr;
      })
    );

    return NextResponse.json({ ...runner, age: currentAge, prs: updatedPRs });
  } catch (error) {
    console.error('Runner detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch runner' }, { status: 500 });
  }
}
