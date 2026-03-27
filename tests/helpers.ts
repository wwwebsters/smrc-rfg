/**
 * Test helpers — spins up the dev server and provides API call utilities.
 * Tests run against the LIVE Turso database, so we create/cleanup test data carefully.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SITE_PASSWORD = process.env.SITE_PASSWORD || 'beer';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'morebeer';

let siteCookie = '';
let adminCookie = '';

export async function loginSite() {
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: SITE_PASSWORD }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/site-auth=([^;]+)/);
    if (match) siteCookie = `site-auth=${match[1]}`;
  }
  return res.ok;
}

export async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: siteCookie },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/admin-auth=([^;]+)/);
    if (match) adminCookie = `admin-auth=${match[1]}`;
  }
  return res.ok;
}

function cookies() {
  return [siteCookie, adminCookie].filter(Boolean).join('; ');
}

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies(),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, ok: res.ok };
}

export async function submitRace(runnerNickname: string, raceName: string, raceDate: string, distance: string, finishTime: number) {
  return api('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({ runnerNickname, raceName, raceDate, distance, finishTime }),
  });
}

export async function approveSubmission(submissionId: number) {
  return api('/api/admin/review', {
    method: 'POST',
    body: JSON.stringify({ submissionId, action: 'approve' }),
  });
}

export async function rejectSubmission(submissionId: number) {
  return api('/api/admin/review', {
    method: 'POST',
    body: JSON.stringify({ submissionId, action: 'reject' }),
  });
}

export async function deleteResult(resultId: number) {
  return api('/api/admin/results', {
    method: 'DELETE',
    body: JSON.stringify({ id: resultId }),
  });
}

export async function editResult(id: number, data: Record<string, unknown>) {
  return api('/api/admin/results', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  });
}

export async function getRunnerDetail(runnerId: number) {
  return api(`/api/runners/${runnerId}`);
}

export async function getLeaderboard() {
  return api('/api/leaderboard');
}

export async function getPendingSubmissions() {
  return api('/api/submissions');
}

export async function getApprovedResults() {
  return api('/api/admin/results');
}

export async function addRunner(nickname: string, fullName: string, birthday?: string) {
  return api('/api/admin/runners', {
    method: 'POST',
    body: JSON.stringify({ nickname, fullName, birthday: birthday || '' }),
  });
}

export async function deleteRunner(id: number) {
  return api('/api/admin/runners', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// Delete runner_prs rows created by race approvals (for test cleanup)
export async function resetRunnerPRs(runnerId: number) {
  // Get current runner info first
  const detail = await getRunnerDetail(runnerId);
  if (!detail.ok) return detail;
  return api('/api/admin/runners', {
    method: 'PUT',
    body: JSON.stringify({
      id: runnerId,
      nickname: detail.body.nickname,
      fullName: detail.body.full_name,
      birthday: detail.body.birthday || '',
      prs: {},
    }),
  });
}

// Get a runner ID by nickname
export async function getRunnerByNickname(nickname: string): Promise<number | null> {
  const res = await api('/api/runners');
  if (!res.ok) return null;
  const runner = res.body.find((r: { nickname: string; id: number }) => r.nickname === nickname);
  return runner?.id ?? null;
}
