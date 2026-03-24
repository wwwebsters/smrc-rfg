import { NextResponse } from 'next/server';
import { dbGet, dbRun, getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SubmissionRow {
  id: number;
  runner_nickname: string;
  race_name: string;
  race_date: string;
  distance: string;
  finish_time_seconds: number;
}

interface PRRow {
  pr_time_seconds: number | null;
  ag_pr_time_seconds: number | null;
  target_seconds: number | null;
  todays_factor: number | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId, action } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const submission = await dbGet<SubmissionRow>(
      `SELECT id, runner_nickname, race_name, race_date, distance, finish_time_seconds
       FROM pending_submissions
       WHERE id = ? AND status = 'pending'`,
      [Number(submissionId)]
    );

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or already reviewed' },
        { status: 404 }
      );
    }

    if (action === 'reject') {
      await dbRun(`UPDATE pending_submissions SET status = 'rejected' WHERE id = ?`, [submissionId]);
      return NextResponse.json({ message: 'Submission rejected' });
    }

    // Approve flow
    const runner = await dbGet<{ id: number }>(
      `SELECT id FROM runners WHERE nickname = ?`,
      [submission.runner_nickname]
    );

    if (!runner) {
      return NextResponse.json(
        { error: `Runner with nickname "${submission.runner_nickname}" not found` },
        { status: 404 }
      );
    }

    const lastRace = await dbGet<{ max_num: number | null }>(
      `SELECT MAX(race_number) as max_num FROM race_results WHERE runner_id = ?`,
      [runner.id]
    );
    const nextRaceNumber = (lastRace?.max_num ?? 0) + 1;

    // Scoring constants
    const distanceOrder = ['5 km', '4 Mile', '5 Mile', '10 km', '8 km', '15 km',
      '10 Mile', 'H. Mar', 'Marathon', '50 km', '50 Mile', '100 Mile'];
    const PR_POINTS =    [8, 8, 9, 9, 11, 11, 12, 13, 16, 17, 18, 19];
    const AG_PR_POINTS = [6, 6, 7, 7,  8,  8,  9, 10, 12, 13, 14, 15];

    const distMap: Record<string, string> = {
      '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
      '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
      '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
      'Full Marathon': 'Marathon', '50k': '50 km',
      '50 Mile': '50 Mile', '100 Mile': '100 Mile',
    };
    const distKey = distMap[submission.distance] || submission.distance;
    const distIdx = distanceOrder.indexOf(distKey);

    function getPartPoints(dist: string): number {
      const short = ['5 km', '4 Mile', '5 Mile'];
      const mid = ['10 km', '8 km'];
      const half = ['15 km', '10 Mile', 'H. Mar'];
      if (short.includes(dist)) return 1;
      if (mid.includes(dist)) return 2;
      if (half.includes(dist)) return 3;
      return 4;
    }

    const pr = await dbGet<PRRow>(
      `SELECT pr_time_seconds, ag_pr_time_seconds, target_seconds, todays_factor
       FROM runner_prs
       WHERE runner_id = ? AND distance = ?`,
      [runner.id, distKey]
    );

    let pointsEarned: number;
    let pointsType: string;

    const isFirstTimeDistance = !pr || (!pr.pr_time_seconds && !pr.ag_pr_time_seconds);
    const isPR = pr?.pr_time_seconds && submission.finish_time_seconds < pr.pr_time_seconds;
    const isAGPR = pr?.target_seconds && submission.finish_time_seconds < pr.target_seconds;

    if (isPR && distIdx >= 0) {
      pointsEarned = PR_POINTS[distIdx];
      pointsType = 'PR';
    } else if ((isAGPR || isFirstTimeDistance) && distIdx >= 0) {
      pointsEarned = AG_PR_POINTS[distIdx];
      pointsType = isFirstTimeDistance ? 'FIRST_TIME' : 'AG_PR';
    } else {
      pointsEarned = getPartPoints(distKey);
      pointsType = 'PARTICIPATION';
    }

    // Build all the SQL statements for the transaction
    const statements: { sql: string; args: (string | number | null)[] }[] = [];

    // Insert race result
    statements.push({
      sql: `INSERT INTO race_results (runner_id, race_name, race_date, distance, finish_time_seconds, points_earned, points_type, race_number, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      args: [runner.id, submission.race_name, submission.race_date, submission.distance,
             submission.finish_time_seconds, pointsEarned, pointsType, nextRaceNumber],
    });

    // Get runner age data for PR updates
    const runnerData = await dbGet<{ birthday: string | null; age: number | null }>(
      `SELECT birthday, age FROM runners WHERE id = ?`,
      [runner.id]
    );

    // Calculate current age dynamically
    let currentAge = runnerData?.age ?? null;
    if (runnerData?.birthday) {
      const birth = new Date(runnerData.birthday);
      const raceDate = new Date(submission.race_date);
      currentAge = raceDate.getFullYear() - birth.getFullYear();
      const monthDiff = raceDate.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && raceDate.getDate() < birth.getDate())) {
        currentAge--;
      }
    }

    const currentFactor = currentAge ? (await dbGet<{ factor: number }>(
      `SELECT factor FROM age_grading_factors WHERE age = ? AND distance = ?`,
      [currentAge, distKey]
    ))?.factor ?? null : null;

    const todaysFactor = pr?.todays_factor ?? currentFactor;

    if (isPR || (isAGPR && pr)) {
      const finishTime = submission.finish_time_seconds;
      const factorAtRace = currentFactor;
      const newAgTime = factorAtRace ? finishTime * factorAtRace : null;
      const newTarget = (newAgTime && todaysFactor) ? newAgTime / todaysFactor : null;

      if (isPR) {
        statements.push({
          sql: `UPDATE runner_prs
                SET pr_time_seconds = ?, ag_pr_time_seconds = ?, ag_pr_date = ?,
                    age_at_ag_pr = ?, factor_at_race = ?, ag_time_seconds = ?, target_seconds = ?
                WHERE runner_id = ? AND distance = ?`,
          args: [finishTime, finishTime, submission.race_date, currentAge, factorAtRace, newAgTime, newTarget, runner.id, distKey],
        });
      } else {
        statements.push({
          sql: `UPDATE runner_prs
                SET ag_pr_time_seconds = ?, ag_pr_date = ?,
                    age_at_ag_pr = ?, factor_at_race = ?, ag_time_seconds = ?, target_seconds = ?
                WHERE runner_id = ? AND distance = ?`,
          args: [finishTime, submission.race_date, currentAge, factorAtRace, newAgTime, newTarget, runner.id, distKey],
        });
      }
    } else if (!pr) {
      const finishTime = submission.finish_time_seconds;
      const factorAtRaceNew = currentFactor;
      const newAgTime = factorAtRaceNew ? finishTime * factorAtRaceNew : null;
      const newTarget = (newAgTime && todaysFactor) ? newAgTime / todaysFactor : null;

      statements.push({
        sql: `INSERT INTO runner_prs (runner_id, distance, pr_time_seconds, ag_pr_time_seconds, ag_pr_date,
                                      age_at_ag_pr, factor_at_race, ag_time_seconds, todays_factor, target_seconds)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [runner.id, distKey, finishTime, finishTime, submission.race_date, currentAge, factorAtRaceNew, newAgTime, todaysFactor, newTarget],
      });
    }

    // Mark submission as approved
    statements.push({
      sql: `UPDATE pending_submissions SET status = 'approved' WHERE id = ?`,
      args: [submissionId],
    });

    // Execute all as a batch transaction
    const db = getDb();
    await db.batch(statements, 'write');

    return NextResponse.json({
      message: 'Submission approved',
      pointsEarned,
      pointsType,
      raceNumber: nextRaceNumber,
    });
  } catch (error) {
    console.error('Admin review error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
