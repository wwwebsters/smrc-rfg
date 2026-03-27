'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAdminAuth, formatRunnerName } from '@/components/AdminAuth';
import { RunnerFormFields, StatusMessage, emptyForm } from '@/components/RunnerForm';
import type { RunnerForm } from '@/components/RunnerForm';

interface RunnerRow {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  race_count: number;
}

const DIST_DISPLAY_TO_DB: Record<string, string> = {
  '5k': '5 km', '4 mile': '4 Mile', '5 mile': '5 Mile',
  '10k': '10 km', '8 mile': '8 km', '15k': '15 km',
  '10 mile': '10 Mile', 'Half Marathon': 'H. Mar',
  'Full Marathon': 'Marathon', '50k': '50 km',
  '50 Mile': '50 Mile', '100 Mile': '100 Mile',
};

const DB_TO_DIST_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.entries(DIST_DISPLAY_TO_DB).map(([k, v]) => [v, k])
);

function fmtSec(s: number | null): string {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function ManageRunnersPage() {
  const { runnersMap, refreshRunners } = useAdminAuth();
  const [runners, setRunners] = useState<RunnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RunnerForm>(emptyForm());
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRunners = useCallback(() => {
    fetch('/api/admin/runners')
      .then((r) => r.json())
      .then((data) => {
        const sorted = data.sort((a: RunnerRow, b: RunnerRow) => {
          const aLast = a.full_name.split(' ').slice(-1)[0];
          const bLast = b.full_name.split(' ').slice(-1)[0];
          return aLast.localeCompare(bLast);
        });
        setRunners(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRunners(); }, [fetchRunners]);

  const handleEdit = async (runner: RunnerRow) => {
    setEditingId(runner.id);
    setEditMsg(null);
    const res = await fetch(`/api/runners/${runner.id}`);
    const data = await res.json();
    const prs: RunnerForm['prs'] = {};
    if (data.prs) {
      for (const pr of data.prs) {
        const displayDist = DB_TO_DIST_DISPLAY[pr.distance];
        if (!displayDist) continue;
        prs[displayDist] = {
          pr: fmtSec(pr.pr_time_seconds),
          agPr: fmtSec(pr.ag_pr_time_seconds),
          agPrDate: pr.ag_pr_date || '',
          ageAtAgPr: pr.age_at_ag_pr?.toString() || '',
          factorAtRace: pr.factor_at_race?.toFixed(4) || '',
          agTime: fmtSec(pr.ag_time_seconds),
          todaysFactor: pr.todays_factor?.toFixed(4) || '',
          target: fmtSec(pr.target_seconds),
        };
      }
    }
    setEditForm({ nickname: data.nickname, fullName: data.full_name, birthday: data.birthday || '', prs });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setEditMsg(null);
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg({ type: 'success', text: data.message });
        setEditingId(null);
        fetchRunners();
        refreshRunners();
      } else {
        setEditMsg({ type: 'error', text: data.error || 'Save failed' });
      }
    } catch {
      setEditMsg({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (runner: RunnerRow) => {
    if (!confirm(`Delete ${formatRunnerName(runner.nickname, runnersMap)}? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: runner.id }),
      });
      const data = await res.json();
      if (res.ok) { fetchRunners(); refreshRunners(); }
      else { alert(data.error || 'Delete failed'); }
    } catch { alert('Network error'); }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Runner List */}
      <section className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: 'var(--nav-bg)' }}>
          <h2 className="text-white font-semibold text-base sm:text-lg">Current Runners</h2>
          <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(0,115,234,0.15)', color: 'var(--accent-blue)' }}>
            {runners.length} runners
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
                  <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Runner</th>
                  <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Birthday</th>
                  <th className="px-4 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Age</th>
                  <th className="px-4 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Races</th>
                  <th className="px-4 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runners.map((runner) => (
                  <tr key={runner.id} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`/runners/${runner.id}`} className="hover:underline" style={{ color: 'var(--accent-blue)' }}>
                        {formatRunnerName(runner.nickname, runnersMap)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{runner.birthday || '--'}</td>
                    <td className="px-4 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>{runner.age ?? '--'}</td>
                    <td className="px-4 py-2.5 text-center" style={{ color: 'var(--text-primary)' }}>{runner.race_count}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEdit(runner)} className="px-3 py-1 text-white text-xs font-medium rounded-lg" style={{ background: 'var(--accent-blue)' }}>Edit</button>
                        <button onClick={() => handleDelete(runner)} className="px-3 py-1 text-white text-xs font-medium rounded-lg" style={{ background: '#D83A52' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Runner */}
      {editingId && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: 'var(--accent-blue)' }}>
            <h2 className="text-white font-semibold text-base sm:text-lg">Edit Runner: {editForm.nickname}</h2>
            <button onClick={() => { setEditingId(null); setEditMsg(null); }} className="text-white/70 hover:text-white text-sm">Cancel</button>
          </div>
          <div className="p-4 sm:p-6">
            <RunnerFormFields form={editForm} setForm={setEditForm} />
            <div className="mt-6 flex items-center gap-4">
              <button onClick={handleSaveEdit} disabled={saving} className="btn-primary sm:w-auto px-8">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditingId(null); setEditMsg(null); }} className="px-6 py-3 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>Cancel</button>
            </div>
            {editMsg && <StatusMessage msg={editMsg} />}
          </div>
        </section>
      )}
    </div>
  );
}
