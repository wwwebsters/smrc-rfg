import { describe, it, expect, beforeAll } from 'vitest';
import {
  loginSite, loginAdmin, submitRace, approveSubmission, rejectSubmission,
  deleteResult, editResult, getRunnerDetail, getLeaderboard,
  getPendingSubmissions, getApprovedResults, addRunner, deleteRunner,
  getRunnerByNickname, api, resetRunnerPRs,
} from './helpers';

// These tests run against a live dev server. Start it first: npm run dev
// Run with: npx vitest run tests/api.test.ts

const TEST_RUNNER = '__TestRunner__';
const TEST_RUNNER_FULL = 'Test McRunner';
const TEST_RUNNER_BDAY = '1990-05-15';
let testRunnerId: number;

async function cleanupTestRunner() {
  const existing = await getRunnerByNickname(TEST_RUNNER);
  if (existing) {
    // Delete all race results for this runner
    const results = await getApprovedResults();
    if (results.ok) {
      for (const r of results.body) {
        if (r.nickname === TEST_RUNNER) {
          await deleteResult(r.id);
        }
      }
    }
    // Reject any pending submissions
    const pending = await getPendingSubmissions();
    if (pending.ok) {
      for (const s of pending.body) {
        if (s.runner_nickname === TEST_RUNNER) {
          await rejectSubmission(s.id);
        }
      }
    }
    await deleteRunner(existing);
  }
}

async function cleanupTestResults() {
  const results = await getApprovedResults();
  if (results.ok) {
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) {
        await deleteResult(r.id);
      }
    }
  }
  // Also reset any PRs created by approvals
  if (testRunnerId) {
    await resetRunnerPRs(testRunnerId);
  }
}

beforeAll(async () => {
  const siteOk = await loginSite();
  expect(siteOk).toBe(true);
  const adminOk = await loginAdmin();
  expect(adminOk).toBe(true);

  await cleanupTestRunner();

  const res = await addRunner(TEST_RUNNER, TEST_RUNNER_FULL, TEST_RUNNER_BDAY);
  expect(res.ok).toBe(true);
  testRunnerId = res.body.id;
}, 30000);

// ========== AUTH TESTS ==========

describe('Authentication', () => {
  it('rejects wrong site password', async () => {
    const res = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects wrong admin password', async () => {
    const res = await api('/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrongpassword' }),
    });
    expect(res.status).toBe(401);
  });

  it('admin endpoints require admin auth', async () => {
    // Hit admin endpoint without admin cookie
    const res = await fetch('http://localhost:3000/api/admin/results', {
      headers: { Cookie: 'site-auth=authenticated' },
    });
    expect(res.status).toBe(401);
  });
});

// ========== DATA VALIDATION TESTS ==========

describe('Submission Validation', () => {
  it('rejects missing required fields', async () => {
    const res = await submitRace('', 'Test Race', '2026-03-01', '5k', 1200);
    expect(res.status).toBe(400);
  });

  it('rejects future race dates', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const futureDate = future.toISOString().split('T')[0];
    const res = await submitRace(TEST_RUNNER, 'Future Race', futureDate, '5k', 1200);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('future');
  });

  it('accepts valid submission', async () => {
    const res = await submitRace(TEST_RUNNER, 'Valid Race', '2026-01-15', '5k', 1200);
    expect(res.ok).toBe(true);
    expect(res.body.id).toBeDefined();
    // Clean up — reject it
    await rejectSubmission(res.body.id);
  });
});

// ========== SCORING TESTS ==========

describe('Scoring - Participation', () => {
  it('scores participation for 5k (1 pt)', async () => {
    await cleanupTestResults();
    // Submit a slow 5k that won't be a PR (test runner has no PRs)
    // First time distance should be AG_PR/FIRST_TIME, not participation
    // So we need to first set a PR, then submit a slower time
    const sub1 = await submitRace(TEST_RUNNER, 'First 5K', '2026-01-10', '5k', 1100);
    expect(sub1.ok).toBe(true);
    const app1 = await approveSubmission(sub1.body.id);
    expect(app1.ok).toBe(true);

    // Now submit a slower 5k — should be participation
    const sub2 = await submitRace(TEST_RUNNER, 'Slow 5K', '2026-01-20', '5k', 1500);
    expect(sub2.ok).toBe(true);
    const app2 = await approveSubmission(sub2.body.id);
    expect(app2.ok).toBe(true);
    expect(app2.body.pointsType).toBe('PARTICIPATION');
    expect(app2.body.pointsEarned).toBe(1); // 5k participation = 1 pt

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });

  it('scores participation correctly by distance category', async () => {
    await cleanupTestResults();
    // Set up a baseline PR first, then submit slower times
    const distances = [
      { dist: '10k', expected: 2 },
      { dist: '15k', expected: 3 },
      { dist: 'Full Marathon', expected: 4 },
    ];

    for (const { dist, expected } of distances) {
      // First race = first time distance
      const sub1 = await submitRace(TEST_RUNNER, `First ${dist}`, '2026-02-01', dist, 1000);
      const app1 = await approveSubmission(sub1.body.id);

      // Second race = participation (slower)
      const sub2 = await submitRace(TEST_RUNNER, `Slow ${dist}`, '2026-02-15', dist, 99999);
      const app2 = await approveSubmission(sub2.body.id);
      expect(app2.body.pointsType).toBe('PARTICIPATION');
      expect(app2.body.pointsEarned).toBe(expected);
    }

    // Clean up all test results
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

describe('Scoring - First Time Distance', () => {
  it('scores first-time 5k as FIRST_TIME (6 pts)', async () => {
    await cleanupTestResults();
    const sub = await submitRace(TEST_RUNNER, 'My First 5K', '2026-01-10', '5k', 1300);
    expect(sub.ok).toBe(true);
    const app = await approveSubmission(sub.body.id);
    expect(app.ok).toBe(true);
    expect(app.body.pointsType).toBe('FIRST_TIME');
    expect(app.body.pointsEarned).toBe(6); // 5k first time = 6 pts

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });

  it('scores first-time Half Marathon as FIRST_TIME (10 pts)', async () => {
    await cleanupTestResults();
    const sub = await submitRace(TEST_RUNNER, 'My First Half', '2026-01-10', 'Half Marathon', 7200);
    const app = await approveSubmission(sub.body.id);
    expect(app.body.pointsType).toBe('FIRST_TIME');
    expect(app.body.pointsEarned).toBe(10);

    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

describe('Scoring - PR', () => {
  it('scores a PR correctly on second race at same distance', async () => {
    await cleanupTestResults();
    // First race sets baseline
    const sub1 = await submitRace(TEST_RUNNER, 'Baseline 10k', '2026-01-10', '10k', 3000);
    await approveSubmission(sub1.body.id);

    // Faster race = PR
    const sub2 = await submitRace(TEST_RUNNER, 'PR 10k', '2026-02-10', '10k', 2800);
    const app2 = await approveSubmission(sub2.body.id);
    expect(app2.body.pointsType).toBe('PR');
    expect(app2.body.pointsEarned).toBe(9); // 10k PR = 9 pts

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

describe('Scoring - No Stacking', () => {
  it('gives highest applicable score only (PR over participation)', async () => {
    await cleanupTestResults();
    // First time = 6 pts (first time), then PR = 8 pts (not 8+1)
    const sub1 = await submitRace(TEST_RUNNER, 'First 5K', '2026-01-10', '5k', 1300);
    const app1 = await approveSubmission(sub1.body.id);
    expect(app1.body.pointsEarned).toBe(6); // FIRST_TIME

    const sub2 = await submitRace(TEST_RUNNER, 'PR 5K', '2026-02-10', '5k', 1200);
    const app2 = await approveSubmission(sub2.body.id);
    expect(app2.body.pointsEarned).toBe(8); // PR, not PR + participation
    expect(app2.body.pointsType).toBe('PR');

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

// ========== DELETE / RESTORE TESTS ==========

describe('Delete and Restore', () => {
  it('restores runner PR data when a PR result is deleted', async () => {
    await cleanupTestResults();
    // Set a baseline with first race
    const sub1 = await submitRace(TEST_RUNNER, 'Baseline', '2026-01-10', '5k', 1300);
    const app1 = await approveSubmission(sub1.body.id);
    expect(app1.body.pointsType).toBe('FIRST_TIME');

    // Get runner state after first race
    const detail1 = await getRunnerDetail(testRunnerId);
    const pr5k1 = detail1.body.prs.find((p: { distance: string }) => p.distance === '5 km');

    // Set a PR
    const sub2 = await submitRace(TEST_RUNNER, 'PR Race', '2026-02-10', '5k', 1200);
    const app2 = await approveSubmission(sub2.body.id);
    expect(app2.body.pointsType).toBe('PR');

    // Verify PR was updated
    const detail2 = await getRunnerDetail(testRunnerId);
    const pr5k2 = detail2.body.prs.find((p: { distance: string }) => p.distance === '5 km');
    expect(pr5k2.pr_time_seconds).toBe(1200);

    // Find and delete the PR result
    const results = await getApprovedResults();
    const prResult = results.body.find((r: { nickname: string; race_name: string }) =>
      r.nickname === TEST_RUNNER && r.race_name === 'PR Race'
    );
    expect(prResult).toBeDefined();
    await deleteResult(prResult.id);

    // Verify PR was restored to baseline
    const detail3 = await getRunnerDetail(testRunnerId);
    const pr5k3 = detail3.body.prs.find((p: { distance: string }) => p.distance === '5 km');
    expect(pr5k3.pr_time_seconds).toBe(1300); // Restored to first race time

    // Clean up remaining
    const remaining = await getApprovedResults();
    for (const r of remaining.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });

  it('removes result from leaderboard when deleted', async () => {
    await cleanupTestResults();
    const sub = await submitRace(TEST_RUNNER, 'Leaderboard Test', '2026-01-10', '5k', 1300);
    await approveSubmission(sub.body.id);

    // Should be on leaderboard
    const lb1 = await getLeaderboard();
    const entry1 = lb1.body.find((e: { nickname: string }) => e.nickname === TEST_RUNNER);
    expect(entry1).toBeDefined();

    // Delete it
    const results = await getApprovedResults();
    const result = results.body.find((r: { nickname: string }) => r.nickname === TEST_RUNNER);
    await deleteResult(result.id);

    // Should be gone from leaderboard
    const lb2 = await getLeaderboard();
    const entry2 = lb2.body.find((e: { nickname: string }) => e.nickname === TEST_RUNNER);
    expect(entry2).toBeUndefined();
  });
});

// ========== EDIT RESULT RESCORING TESTS ==========

describe('Edit Result Rescoring', () => {
  it('downgrades PR to participation when time is changed to slower', async () => {
    await cleanupTestResults();
    // First race sets baseline
    const sub1 = await submitRace(TEST_RUNNER, 'Baseline', '2026-01-10', '5k', 1300);
    await approveSubmission(sub1.body.id);

    // PR
    const sub2 = await submitRace(TEST_RUNNER, 'Was PR', '2026-02-10', '5k', 1200);
    const app2 = await approveSubmission(sub2.body.id);
    expect(app2.body.pointsType).toBe('PR');
    expect(app2.body.pointsEarned).toBe(8);

    // Find the PR result and edit it to a slower time
    const results = await getApprovedResults();
    const prResult = results.body.find((r: { nickname: string; race_name: string }) =>
      r.nickname === TEST_RUNNER && r.race_name === 'Was PR'
    );

    const edited = await editResult(prResult.id, {
      race_name: 'Was PR',
      race_date: '2026-02-10',
      distance: '5k',
      finish_time_seconds: 1500, // Slower than baseline 1300
    });
    expect(edited.ok).toBe(true);
    expect(edited.body.pointsType).toBe('PARTICIPATION');
    expect(edited.body.pointsEarned).toBe(1);

    // Clean up
    const remaining = await getApprovedResults();
    for (const r of remaining.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

// ========== RUNNER MANAGEMENT TESTS ==========

describe('Runner Management', () => {
  it('prevents duplicate nicknames', async () => {
    const res = await addRunner(TEST_RUNNER, 'Duplicate', '2000-01-01');
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('prevents deleting runner with race results', async () => {
    // Add a race result first
    const sub = await submitRace(TEST_RUNNER, 'Block Delete', '2026-01-10', '5k', 1300);
    await approveSubmission(sub.body.id);

    const res = await deleteRunner(testRunnerId);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('approved race result');

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

// ========== LEADERBOARD TESTS ==========

describe('Leaderboard', () => {
  it('shows runners sorted by total points descending', async () => {
    const lb = await getLeaderboard();
    expect(lb.ok).toBe(true);
    for (let i = 1; i < lb.body.length; i++) {
      expect(lb.body[i - 1].total_points).toBeGreaterThanOrEqual(lb.body[i].total_points);
    }
  });

  it('calculates efficiency correctly', async () => {
    // Submit two races
    const sub1 = await submitRace(TEST_RUNNER, 'Eff Test 1', '2026-01-10', '5k', 1300);
    await approveSubmission(sub1.body.id);
    const sub2 = await submitRace(TEST_RUNNER, 'Eff Test 2', '2026-01-20', '10k', 5000);
    await approveSubmission(sub2.body.id);

    const lb = await getLeaderboard();
    const entry = lb.body.find((e: { nickname: string }) => e.nickname === TEST_RUNNER);
    expect(entry).toBeDefined();
    expect(entry.race_count).toBe(2);
    const expectedEff = Math.round((entry.total_points / entry.race_count) * 100) / 100;
    expect(entry.efficiency).toBe(expectedEff);

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

// ========== RUNNER DETAIL / AGE TESTS ==========

describe('Runner Detail', () => {
  it('calculates age dynamically from birthday', async () => {
    const detail = await getRunnerDetail(testRunnerId);
    expect(detail.ok).toBe(true);
    // Born 1990-05-15, should be 35 or 36 depending on current date
    const birth = new Date('1990-05-15');
    const today = new Date();
    let expectedAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) expectedAge--;
    expect(detail.body.age).toBe(expectedAge);
  });

  it('returns PR data for runner', async () => {
    const detail = await getRunnerDetail(testRunnerId);
    expect(detail.ok).toBe(true);
    expect(Array.isArray(detail.body.prs)).toBe(true);
  });

  it('returns race history for runner', async () => {
    // Add a race
    const sub = await submitRace(TEST_RUNNER, 'History Test', '2026-01-10', '5k', 1300);
    await approveSubmission(sub.body.id);

    const detail = await getRunnerDetail(testRunnerId);
    expect(detail.body.races.length).toBeGreaterThan(0);
    expect(detail.body.races[0].race_name).toBe('History Test');

    // Clean up
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }
  });
});

// ========== CLEANUP ==========

describe('Cleanup', () => {
  it('deletes test runner', async () => {
    // Make sure no results remain
    const results = await getApprovedResults();
    for (const r of results.body) {
      if (r.nickname === TEST_RUNNER) await deleteResult(r.id);
    }

    const res = await deleteRunner(testRunnerId);
    expect(res.ok).toBe(true);

    // Verify gone
    const detail = await getRunnerDetail(testRunnerId);
    expect(detail.status).toBe(404);
  });
});
