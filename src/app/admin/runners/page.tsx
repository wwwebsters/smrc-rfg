'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAdminAuth, formatRunnerName } from '@/components/AdminAuth';

interface RunnerRow {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  race_count: number;
}

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

export default function ManageRunnersPage() {
  const { runnersMap, refreshRunners } = useAdminAuth();
  const [runners, setRunners] = useState<RunnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRunner, setNewRunner] = useState<{
    nickname: string; fullName: string; birthday: string;
    prs: Record<string, { pr: string; agPr: string; agPrDate: string; ageAtAgPr: string; factorAtRace: string; agTime: string; todaysFactor: string; target: string }>;
  }>({ nickname: '', fullName: '', birthday: '', prs: {} });
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nickname: '', fullName: '', birthday: '' });
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

  const handleDelete = async (runner: RunnerRow) => {
    if (!confirm(`Delete ${formatRunnerName(runner.nickname, runnersMap)}? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: runner.id }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchRunners();
        refreshRunners();
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    setAdding(true);
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRunner),
      });
      const data = await res.json();
      if (res.ok) {
        setAddMsg({ type: 'success', text: data.message });
        setNewRunner({ nickname: '', fullName: '', birthday: '', prs: {} });
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
      {/* Runner List with Delete */}
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
                {runners.map((runner) => {
                  const isEditing = editingId === runner.id;

                  if (isEditing) {
                    return (
                      <tr key={runner.id} style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(0,115,234,0.04)' }}>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <input type="text" value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} placeholder="Nickname" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} />
                            <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} placeholder="Full Name" className="input py-1.5 text-xs" style={{ minWidth: '120px' }} />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input type="date" value={editForm.birthday} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} className="input py-1.5 text-xs" />
                        </td>
                        <td className="px-4 py-2 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>Auto</td>
                        <td className="px-4 py-2 text-center" style={{ color: 'var(--text-primary)' }}>{runner.race_count}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              disabled={saving}
                              onClick={async () => {
                                setSaving(true);
                                try {
                                  const res = await fetch('/api/admin/runners', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: runner.id, nickname: editForm.nickname, fullName: editForm.fullName, birthday: editForm.birthday }),
                                  });
                                  if (res.ok) {
                                    setEditingId(null);
                                    fetchRunners();
                                    refreshRunners();
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || 'Save failed');
                                  }
                                } catch { alert('Network error'); }
                                finally { setSaving(false); }
                              }}
                              className="px-2 py-1 text-white text-xs font-medium rounded" style={{ background: '#00854D' }}
                            >Save</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 text-white text-xs font-medium rounded" style={{ background: 'var(--text-muted)' }}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
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
                          onClick={() => {
                            setEditingId(runner.id);
                            setEditForm({ nickname: runner.nickname, fullName: runner.full_name, birthday: runner.birthday || '' });
                          }}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg transition-colors"
                          style={{ background: 'var(--accent-blue)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(runner)}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg transition-colors"
                          style={{ background: '#D83A52' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Runner */}
      <section className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3" style={{ background: 'var(--nav-bg)' }}>
          <h2 className="text-white font-semibold text-base sm:text-lg">Add Runner</h2>
        </div>
        <form onSubmit={handleAdd} className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nickname *</label>
              <input type="text" required value={newRunner.nickname} onChange={(e) => setNewRunner({ ...newRunner, nickname: e.target.value })} placeholder="e.g., Speedy" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
              <input type="text" required value={newRunner.fullName} onChange={(e) => setNewRunner({ ...newRunner, fullName: e.target.value })} placeholder="e.g., John Smith" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Birthday</label>
              <input type="date" value={newRunner.birthday} onChange={(e) => setNewRunner({ ...newRunner, birthday: e.target.value })} className="input" />
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
                  const prData = newRunner.prs[dist] || { pr: '', agPr: '', agPrDate: '', ageAtAgPr: '', factorAtRace: '', agTime: '', todaysFactor: '', target: '' };
                  const updatePR = (field: string, value: string) => {
                    setNewRunner({ ...newRunner, prs: { ...newRunner.prs, [dist]: { ...prData, [field]: value } } });
                  };
                  return (
                    <tr key={dist} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{dist}</td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.pr} onChange={(e) => updatePR('pr', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.agPr} onChange={(e) => updatePR('agPr', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                      <td className="px-3 py-1.5"><input type="date" value={prData.agPrDate} onChange={(e) => updatePR('agPrDate', e.target.value)} className="input py-1.5 text-xs" style={{ minWidth: '120px' }} /></td>
                      <td className="px-3 py-1.5"><input type="number" value={prData.ageAtAgPr} onChange={(e) => updatePR('ageAtAgPr', e.target.value)} placeholder="Age" className="input py-1.5 text-xs" style={{ minWidth: '55px' }} /></td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.factorAtRace} onChange={(e) => updatePR('factorAtRace', e.target.value)} placeholder="0.0000" className="input py-1.5 text-xs" style={{ minWidth: '70px' }} /></td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.agTime} onChange={(e) => updatePR('agTime', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.todaysFactor} onChange={(e) => updatePR('todaysFactor', e.target.value)} placeholder="0.0000" className="input py-1.5 text-xs" style={{ minWidth: '70px' }} /></td>
                      <td className="px-3 py-1.5"><input type="text" value={prData.target} onChange={(e) => updatePR('target', e.target.value)} placeholder="MM:SS" className="input py-1.5 text-xs" style={{ minWidth: '80px' }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <button type="submit" disabled={adding} className="btn-primary sm:w-auto px-8">
              {adding ? 'Adding...' : 'Add Runner'}
            </button>
          </div>

          {addMsg && (
            <div className="mt-4 p-3 rounded-lg text-sm" style={{
              background: addMsg.type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(226,68,92,0.08)',
              color: addMsg.type === 'success' ? '#00854D' : '#D83A52',
              border: `1px solid ${addMsg.type === 'success' ? 'rgba(0,200,117,0.25)' : 'rgba(226,68,92,0.25)'}`,
            }}>
              {addMsg.text}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
