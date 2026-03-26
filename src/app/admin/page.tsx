'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatTime } from '@/lib/format';

interface Submission {
  id: number;
  runner_nickname: string;
  race_name: string;
  race_date: string;
  distance: string;
  finish_time_seconds: number;
  submitted_at: string;
  status: string;
}

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
}

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

const POINTS_TYPES = ['PR', 'AG_PR', 'FIRST_TIME', 'PARTICIPATION'];

function formatRunnerName(nickname: string, runnersMap: Record<string, string>): string {
  const fullName = runnersMap[nickname];
  if (!fullName) return nickname;
  const parts = fullName.split(' ');
  const last = parts.slice(-1)[0];
  const first = parts.slice(0, -1).join(' ');
  return first ? `${last}, ${first} (${nickname})` : `${last} (${nickname})`;
}

export default function AdminPage() {
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [runnersMap, setRunnersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvedResults, setApprovedResults] = useState<ApprovedResult[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ApprovedResult>>({});
  const [saving, setSaving] = useState(false);

  const fetchApprovedResults = useCallback(() => {
    fetch('/api/admin/results')
      .then((r) => r.json())
      .then(setApprovedResults)
      .catch(() => {});
  }, []);

  const fetchSubmissions = useCallback(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  // Check admin auth by hitting a protected endpoint
  useEffect(() => {
    fetch('/api/admin/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => {
        if (r.status === 401) {
          setAdminAuthed(false);
        } else {
          setAdminAuthed(true);
          fetchSubmissions();
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminAuthed !== true) return;
    fetchSubmissions();
    fetchApprovedResults();
    fetch('/api/runners')
      .then((r) => r.json())
      .then((data: { nickname: string; full_name: string }[]) => {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.nickname] = r.full_name; });
        setRunnersMap(map);
      });
  }, [fetchSubmissions]);

  const handleReview = async (submissionId: number, action: 'approve' | 'reject') => {
    setProcessing(submissionId);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action }),
      });

      if (res.ok) {
        fetchSubmissions();
        fetchApprovedResults();
      } else {
        const data = await res.json();
        alert(data.error || 'Review failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadMessage({
          type: 'success',
          text: `Uploaded "${data.fileName}" - ${data.sheetCount} sheets, ${data.sheets.map((s: { sheetName: string; rowCount: number }) => `${s.sheetName}: ${s.rowCount} rows`).join(', ')}`,
        });
      } else {
        setUploadMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'Network error' });
    }

    // Reset file input
    e.target.value = '';
  };

  if (adminAuthed === false) {
    const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminError('');
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPassword }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          setAdminError('Wrong password');
        }
      } catch {
        setAdminError('Something went wrong');
      }
    };

    return (
      <div className="max-w-sm mx-auto mt-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 mt-1">Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleAdminLogin} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              autoFocus
            />
          </div>
          {adminError && <div className="text-red-600 text-sm">{adminError}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold py-2.5 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Admin Dashboard</h1>

      {/* Excel Upload Section */}
      <section className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Upload Excel Data</h2>
        <p className="text-gray-600 mb-4">
          Upload an SMRC Excel spreadsheet to import updated race data.
        </p>

        <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold rounded-lg cursor-pointer hover:from-yellow-600 hover:to-amber-600 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Choose File
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        {uploadMessage && (
          <div className={`mt-4 p-4 rounded-lg ${
            uploadMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {uploadMessage.text}
          </div>
        )}
      </section>

      {/* Review Queue */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 sm:px-6 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base sm:text-lg">Pending Submissions</h2>
          <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
            {submissions.length} pending
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending submissions to review.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-3 sm:p-5 hover:bg-yellow-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{formatRunnerName(sub.runner_nickname, runnersMap)}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700">{sub.race_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span>{sub.race_date}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{sub.distance}</span>
                      <span className="font-mono">{formatTime(sub.finish_time_seconds)}</span>
                      <span className="text-gray-400">submitted {new Date(sub.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(sub.id, 'approve')}
                      disabled={processing === sub.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processing === sub.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReview(sub.id, 'reject')}
                      disabled={processing === sub.id}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved Results */}
      <section className="bg-white rounded-xl shadow overflow-hidden mt-6 sm:mt-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base sm:text-lg">Approved Results</h2>
          <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
            {approvedResults.length} races
          </span>
        </div>

        {approvedResults.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No approved results yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Runner</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Race</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Distance</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-700">Time</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-700">Pts</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-700">Type</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedResults.map((result) => {
                  const isEditing = editingId === result.id;

                  if (isEditing) {
                    const hours = Math.floor((editForm.finish_time_seconds || 0) / 3600);
                    const mins = Math.floor(((editForm.finish_time_seconds || 0) % 3600) / 60);
                    const secs = Math.round((editForm.finish_time_seconds || 0) % 60);

                    return (
                      <tr key={result.id} className="border-b border-gray-50 bg-yellow-50">
                        <td className="px-3 py-2 font-medium text-gray-700">
                          {formatRunnerName(result.nickname, runnersMap)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editForm.race_name || ''}
                            onChange={(e) => setEditForm({ ...editForm, race_name: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={editForm.race_date || ''}
                            onChange={(e) => setEditForm({ ...editForm, race_date: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={editForm.distance || ''}
                            onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {DISTANCES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 items-center">
                            <input
                              type="number" min="0" max="99"
                              value={hours}
                              onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: Number(e.target.value) * 3600 + mins * 60 + secs })}
                              className="w-12 border border-gray-300 rounded px-1 py-1 text-sm text-center"
                            />
                            <span>:</span>
                            <input
                              type="number" min="0" max="59"
                              value={mins}
                              onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: hours * 3600 + Number(e.target.value) * 60 + secs })}
                              className="w-12 border border-gray-300 rounded px-1 py-1 text-sm text-center"
                            />
                            <span>:</span>
                            <input
                              type="number" min="0" max="59"
                              value={secs}
                              onChange={(e) => setEditForm({ ...editForm, finish_time_seconds: hours * 3600 + mins * 60 + Number(e.target.value) })}
                              className="w-12 border border-gray-300 rounded px-1 py-1 text-sm text-center"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0"
                            value={editForm.points_earned || 0}
                            onChange={(e) => setEditForm({ ...editForm, points_earned: Number(e.target.value) })}
                            className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={editForm.points_type || ''}
                            onChange={(e) => setEditForm({ ...editForm, points_type: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {POINTS_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
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
                                      points_earned: editForm.points_earned,
                                      points_type: editForm.points_type,
                                    }),
                                  });
                                  if (res.ok) {
                                    setEditingId(null);
                                    fetchApprovedResults();
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || 'Save failed');
                                  }
                                } catch {
                                  alert('Network error');
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-gray-400 text-white text-xs font-medium rounded hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const typeLabel: Record<string, string> = {
                    PR: 'PR', AG_PR: 'AG PR', FIRST_TIME: '1st Time', PARTICIPATION: 'Participation',
                  };
                  const typeColor: Record<string, string> = {
                    PR: 'bg-yellow-200 text-yellow-800', AG_PR: 'bg-blue-100 text-blue-700',
                    FIRST_TIME: 'bg-blue-100 text-blue-700', PARTICIPATION: 'bg-gray-100 text-gray-600',
                  };

                  return (
                    <tr key={result.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium">{formatRunnerName(result.nickname, runnersMap)}</td>
                      <td className="px-3 py-2.5">{result.race_name}</td>
                      <td className="px-3 py-2.5 text-gray-500">{result.race_date}</td>
                      <td className="px-3 py-2.5 text-gray-500">{result.distance}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{formatTime(result.finish_time_seconds)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-700">{result.points_earned}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${typeColor[result.points_type] || 'bg-gray-100 text-gray-600'}`}>
                          {typeLabel[result.points_type] || result.points_type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => {
                            setEditingId(result.id);
                            setEditForm({
                              race_name: result.race_name,
                              race_date: result.race_date,
                              distance: result.distance,
                              finish_time_seconds: result.finish_time_seconds,
                              points_earned: result.points_earned,
                              points_type: result.points_type,
                            });
                          }}
                          className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${formatRunnerName(result.nickname, runnersMap)}'s ${result.race_name} result?`)) return;
                            try {
                              const res = await fetch('/api/admin/results', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: result.id }),
                              });
                              if (res.ok) {
                                fetchApprovedResults();
                              } else {
                                const data = await res.json();
                                alert(data.error || 'Delete failed');
                              }
                            } catch {
                              alert('Network error');
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
