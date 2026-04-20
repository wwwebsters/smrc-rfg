'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/format';
import { useAdminAuth, formatRunnerName } from '@/components/AdminAuth';

interface ApprovedResult {
  id: number;
  runner_id: number;
  nickname: string;
  full_name: string;
  race_name: string;
  race_date: string;
  distance: string;
  finish_time_seconds: number;
  points_earned: number;
  points_type: string;
  race_number: number;
  submitted_at: string | null;
}

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

export default function ApprovedResultsPage() {
  const { runnersMap } = useAdminAuth();
  const [results, setResults] = useState<ApprovedResult[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ApprovedResult>>({});
  const [saving, setSaving] = useState(false);

  const fetchResults = useCallback(() => {
    fetch('/api/admin/results')
      .then((r) => r.json())
      .then(setResults)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const typeLabel: Record<string, string> = {
    PR: 'PR', AG_PR: 'AG PR', FIRST_TIME: '1st Time', PARTICIPATION: 'Participation',
  };
  const typeStyle: Record<string, { bg: string; color: string }> = {
    PR: { bg: 'rgba(245,166,35,0.15)', color: '#B07800' },
    AG_PR: { bg: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' },
    FIRST_TIME: { bg: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' },
    PARTICIPATION: { bg: 'var(--card-border)', color: 'var(--text-secondary)' },
  };

  return (
    <section className="card overflow-hidden">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: 'var(--nav-bg)' }}>
        <h2 className="text-white font-semibold text-base sm:text-lg">Approved Results</h2>
        <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(0,200,117,0.15)', color: '#00854D' }}>
          {results.length} races
        </span>
      </div>

      {results.length === 0 ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No approved results yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Runner</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Race</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Distance</th>
                <th className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Time</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Pts</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Submitted</th>
                <th className="px-3 py-2.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const isEditing = editingId === result.id;

                if (isEditing) {
                  const hours = Math.floor((editForm.finish_time_seconds || 0) / 3600);
                  const mins = Math.floor(((editForm.finish_time_seconds || 0) % 3600) / 60);
                  const secs = Math.round((editForm.finish_time_seconds || 0) % 60);

                  return (
                    <tr key={result.id} style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(0,115,234,0.04)' }}>
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatRunnerName(result.nickname, runnersMap)}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={editForm.race_name || ''} onChange={(e) => setEditForm({ ...editForm, race_name: e.target.value })} className="input py-1.5 text-xs" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" value={editForm.race_date || ''} onChange={(e) => setEditForm({ ...editForm, race_date: e.target.value })} className="input py-1.5 text-xs" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={editForm.distance || ''} onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })} className="input py-1.5 text-xs">
                          {DISTANCES.map((d) => (<option key={d} value={d}>{d}</option>))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 items-center">
                          <input type="number" min="0" max="99" value={hours} onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: Number(e.target.value) * 3600 + mins * 60 + secs })} className="w-10 input py-1.5 text-xs text-center" />
                          <span>:</span>
                          <input type="number" min="0" max="59" value={mins} onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: hours * 3600 + Number(e.target.value) * 60 + secs })} className="w-10 input py-1.5 text-xs text-center" />
                          <span>:</span>
                          <input type="number" min="0" max="59" value={secs} onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: hours * 3600 + mins * 60 + Number(e.target.value) })} className="w-10 input py-1.5 text-xs text-center" />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>Auto</td>
                      <td className="px-3 py-2 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>Auto</td>
                      <td className="px-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : '--'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            disabled={saving}
                            onClick={async () => {
                              setSaving(true);
                              try {
                                const res = await fetch('/api/admin/results', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: result.id,
                                    race_name: editForm.race_name,
                                    race_date: editForm.race_date,
                                    distance: editForm.distance,
                                    finish_time_seconds: editForm.finish_time_seconds,
                                  }),
                                });
                                if (res.ok) {
                                  setEditingId(null);
                                  fetchResults();
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

                const ts = typeStyle[result.points_type] || typeStyle.PARTICIPATION;

                return (
                  <tr key={result.id} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td className="px-3 py-2.5 font-medium">
                      <Link href={`/rfg/runners/${result.runner_id}`} className="hover:underline" style={{ color: 'var(--accent-blue)' }}>
                        {formatRunnerName(result.nickname, runnersMap)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-primary)' }}>{result.race_name}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{result.race_date}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{result.distance}</td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{formatTime(result.finish_time_seconds)}</td>
                    <td className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--accent-gold)' }}>{result.points_earned}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: ts.bg, color: ts.color }}>
                        {typeLabel[result.points_type] || result.points_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : '--'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setEditingId(result.id);
                            setEditForm({
                              race_name: result.race_name, race_date: result.race_date,
                              distance: result.distance, finish_time_seconds: result.finish_time_seconds,
                            });
                          }}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg" style={{ background: 'var(--accent-blue)' }}
                        >Edit</button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${formatRunnerName(result.nickname, runnersMap)}'s ${result.race_name} result?`)) return;
                            try {
                              const res = await fetch('/api/admin/results', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: result.id }),
                              });
                              if (res.ok) { fetchResults(); }
                              else { const data = await res.json(); alert(data.error || 'Delete failed'); }
                            } catch { alert('Network error'); }
                          }}
                          className="px-3 py-1 text-white text-xs font-medium rounded-lg" style={{ background: '#D83A52' }}
                        >Delete</button>
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
  );
}
