'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/format';
import { useAdminAuth, formatRunnerName } from '@/components/AdminAuth';

interface RunnerRow {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  race_count: number;
}

interface PRData {
  pr: string; agPr: string; agPrDate: string; ageAtAgPr: string;
  factorAtRace: string; agTime: string; todaysFactor: string; target: string;
}

type RunnerForm = {
  nickname: string; fullName: string; birthday: string;
  prs: Record<string, PRData>;
};

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

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

function emptyForm(): RunnerForm {
  return { nickname: '', fullName: '', birthday: '', prs: {} };
}

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

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RunnerForm>(emptyForm());
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Add state
  const [addForm, setAddForm] = useState<RunnerForm>(emptyForm());
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

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
    // Fetch full runner data with PRs
    const res = await fetch(`/api/runners/${runner.id}`);
    const data = await res.json();
    const prs: Record<string, PRData> = {};
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
    setEditForm({
      nickname: data.nickname,
      fullName: data.full_name,
      birthday: data.birthday || '',
      prs,
    });
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    setAdding(true);
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok) {
        setAddMsg({ type: 'success', text: data.message });
        setAddForm(emptyForm());
        fetchRunners();
        refreshRunners();
      } else {
        setAddMsg({ type: 'error', text: data.error || 'Failed to add runner' });
      }
    } catch {
      setAddMsg({ type: 'error', text: 'Network error' });
    } finally {
      setAdding(false);
    }
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
                        <button
                          onClick={() => handleEdit(runner)}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg"
                          style={{ background: 'var(--accent-blue)' }}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(runner)}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg"
                          style={{ background: '#D83A52' }}
                        >Delete</button>
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
            <h2 className="text-white font-semibold text-base sm:text-lg">
              Edit Runner: {editForm.nickname}
            </h2>
            <button onClick={() => { setEditingId(null); setEditMsg(null); }} className="text-white/70 hover:text-white text-sm">Cancel</button>
          </div>
          <div className="p-4 sm:p-6">
            <RunnerFormFields form={editForm} setForm={setEditForm} />
            <div className="mt-6 flex items-center gap-4">
              <button onClick={handleSaveEdit} disabled={saving} className="btn-primary sm:w-auto px-8">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditingId(null); setEditMsg(null); }} className="px-6 py-3 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                Cancel
              </button>
            </div>
            {editMsg && <StatusMessage msg={editMsg} />}
          </div>
        </section>
      )}

      {/* Add Runner */}
      <section className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3" style={{ background: 'var(--nav-bg)' }}>
          <h2 className="text-white font-semibold text-base sm:text-lg">Add Runner</h2>
        </div>
        <form onSubmit={handleAdd} className="p-4 sm:p-6">
          <RunnerFormFields form={addForm} setForm={setAddForm} />
          <div className="mt-6">
            <button type="submit" disabled={adding} className="btn-primary sm:w-auto px-8">
              {adding ? 'Adding...' : 'Add Runner'}
            </button>
          </div>
          {addMsg && <StatusMessage msg={addMsg} />}
        </form>
      </section>
    </div>
  );
}

function RunnerFormFields({ form, setForm }: { form: RunnerForm; setForm: (f: RunnerForm) => void }) {
  const updatePR = (dist: string, field: string, value: string) => {
    const current = form.prs[dist] || { pr: '', agPr: '', agPrDate: '', ageAtAgPr: '', factorAtRace: '', agTime: '', todaysFactor: '', target: '' };
    setForm({ ...form, prs: { ...form.prs, [dist]: { ...current, [field]: value } } });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nickname *</label>
          <input type="text" required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="e.g., Speedy" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
          <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g., John Smith" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Birthday</label>
          <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="input" />
        </div>
      </div>

      <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Personal Records & Targets</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Leave blank for distances not yet raced. Times in H:MM:SS or MM:SS format.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Distance</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>PR</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>AG PR</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>AG PR Date</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Age @ PR</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Factor</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>AG Time</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Today&apos;s Factor</th>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--accent-gold)' }}>Target</th>
            </tr>
          </thead>
          <tbody>
            {DISTANCES.map((dist) => {
              const prData = form.prs[dist] || { pr: '', agPr: '', agPrDate: '', ageAtAgPr: '', factorAtRace: '', agTime: '', todaysFactor: '', target: '' };
              return (
                <tr key={dist} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{dist}</td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.pr} onChange={(e) => updatePR(dist, 'pr', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.agPr} onChange={(e) => updatePR(dist, 'agPr', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                  <td className="px-3 py-1.5"><input type="date" value={prData.agPrDate} onChange={(e) => updatePR(dist, 'agPrDate', e.target.value)} className="input py-1.5 text-xs" style={{ minWidth: '120px' }} /></td>
                  <td className="px-3 py-1.5"><input type="number" value={prData.ageAtAgPr} onChange={(e) => updatePR(dist, 'ageAtAgPr', e.target.value)} placeholder="Age" className="input py-1.5 text-xs" style={{ minWidth: '55px' }} /></td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.factorAtRace} onChange={(e) => updatePR(dist, 'factorAtRace', e.target.value)} placeholder="0.0000" className="input py-1.5 text-xs" style={{ minWidth: '70px' }} /></td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.agTime} onChange={(e) => updatePR(dist, 'agTime', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.todaysFactor} onChange={(e) => updatePR(dist, 'todaysFactor', e.target.value)} placeholder="0.0000" className="input py-1.5 text-xs" style={{ minWidth: '70px' }} /></td>
                  <td className="px-3 py-1.5"><input type="text" value={prData.target} onChange={(e) => updatePR(dist, 'target', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusMessage({ msg }: { msg: { type: 'success' | 'error'; text: string } }) {
  return (
    <div className="mt-4 p-3 rounded-lg text-sm" style={{
      background: msg.type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(226,68,92,0.08)',
      color: msg.type === 'success' ? '#00854D' : '#D83A52',
      border: `1px solid ${msg.type === 'success' ? 'rgba(0,200,117,0.25)' : 'rgba(226,68,92,0.25)'}`,
    }}>
      {msg.text}
    </div>
  );
}
