'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Runner {
  id: number;
  nickname: string;
  full_name: string | null;
  email: string | null;
  rfg_runner_id: number | null;
}

export default function AttendanceRunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attendance/runners')
      .then((r) => r.json())
      .then(setRunners)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading runners...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Runners
        </h1>
        <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
          {runners.length} runners tracked
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {runners.map((runner) => (
          <Link
            key={runner.id}
            href={`/attendance/runners/${runner.id}`}
            className="card p-4 text-center hover:shadow-lg transition-all"
          >
            <div className="font-medium" style={{ color: 'var(--accent-blue)' }}>
              {runner.nickname}
            </div>
            {runner.full_name && (
              <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                {runner.full_name}
              </div>
            )}
            {runner.rfg_runner_id && (
              <div className="mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' }}>
                  RFG
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
