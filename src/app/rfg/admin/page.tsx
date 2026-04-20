'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatTime } from '@/lib/format';
import { useAdminAuth, formatRunnerName } from '@/components/AdminAuth';

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

export default function PendingSubmissionsPage() {
  const { runnersMap } = useAdminAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

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

  return (
    <section className="card overflow-hidden">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: 'var(--nav-bg)' }}>
        <h2 className="text-white font-semibold text-base sm:text-lg">Pending Submissions</h2>
        <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.2)', color: 'var(--accent-gold)' }}>
          {submissions.length} pending
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No pending submissions to review.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
          {submissions.map((sub) => (
            <div key={sub.id} className="p-3 sm:p-5 hover:bg-blue-50/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatRunnerName(sub.runner_nickname, runnersMap)}</span>
                    <span style={{ color: 'var(--card-border)' }}>|</span>
                    <span style={{ color: 'var(--text-primary)' }}>{sub.race_name}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>{sub.race_date}</span>
                    <span className="px-2 py-0.5 rounded" style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>{sub.distance}</span>
                    <span className="font-mono">{formatTime(sub.finish_time_seconds)}</span>
                    <span>submitted {new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(sub.id, 'approve')}
                    disabled={processing === sub.id}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                    style={{ background: '#00854D' }}
                  >
                    {processing === sub.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview(sub.id, 'reject')}
                    disabled={processing === sub.id}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                    style={{ background: '#D83A52' }}
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
  );
}
