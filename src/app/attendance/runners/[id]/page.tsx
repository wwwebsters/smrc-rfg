'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';

interface RunnerDetail {
  id: number;
  nickname: string;
  full_name: string | null;
  email: string | null;
  rfg_runner_id: number | null;
}

interface AttendanceHistory {
  week_date: string;
  timmy_year: number;
  week_number: number;
  present: number;
}

interface RunnerData {
  runner: RunnerDetail;
  history: AttendanceHistory[];
  stats: Record<number, { total: number; attended: number; pct: number }>;
}

function formatDate(dateStr: string): string {
  // Parse as local date to avoid timezone issues (UTC conversion shifts to previous day)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AttendanceRunnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RunnerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attendance/runners/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading runner...</div>;
  }

  if (!data || !data.runner) {
    return <div className="text-center py-12 text-red-500">Runner not found</div>;
  }

  const { runner, history, stats } = data;
  const years = Object.keys(stats).map(Number).sort((a, b) => b - a);

  // Group history by year
  const historyByYear: Record<number, AttendanceHistory[]> = {};
  for (const record of history) {
    if (!historyByYear[record.timmy_year]) {
      historyByYear[record.timmy_year] = [];
    }
    historyByYear[record.timmy_year].push(record);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {runner.nickname}
        </h1>
        {runner.full_name && (
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
            {runner.full_name}
          </p>
        )}
        {runner.rfg_runner_id && (
          <Link
            href={`/rfg/runners/${runner.rfg_runner_id}`}
            className="inline-block mt-2 text-sm px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' }}
          >
            View RFG Profile →
          </Link>
        )}
      </div>

      {/* Year stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {years.map((year) => (
          <div key={year} className="card p-4 text-center">
            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{year}</div>
            <div className="text-2xl font-bold" style={{ color: year === 2026 ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
              {stats[year].attended}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              of {stats[year].total} ({stats[year].pct}%)
            </div>
          </div>
        ))}
      </div>

      {/* Attendance history by year */}
      {years.map((year) => (
        <div key={year} className="card overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-3" style={{ background: 'var(--nav-bg)' }}>
            <h2 className="text-white font-semibold text-base sm:text-lg">
              {year} Attendance ({stats[year]?.attended || 0}/{stats[year]?.total || 0})
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {historyByYear[year]?.map((record) => (
                <div
                  key={record.week_date}
                  className="px-2 py-1.5 flex items-center justify-center rounded-lg text-xs font-medium whitespace-nowrap"
                  style={{
                    background: record.present ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    color: record.present ? '#22c55e' : '#ef4444',
                    border: `1px solid ${record.present ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                    minWidth: '52px',
                  }}
                  title={`Week ${record.week_number}: ${record.week_date}`}
                >
                  {formatDate(record.week_date)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
