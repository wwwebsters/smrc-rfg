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

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubmissions = useCallback(() => {
    fetch('/api/submissions')
      .then((r) => r.json())
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSubmissions();
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Excel Upload Section */}
      <section className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Excel Data</h2>
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
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Pending Submissions</h2>
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
              <div key={sub.id} className="p-5 hover:bg-yellow-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{sub.runner_nickname}</span>
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
    </div>
  );
}
