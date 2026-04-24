'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  runner_id: number;
  nickname: string;
  full_name: string | null;
  total_2026: number;
  attendance_pct: number;
  current_streak: number;
  total_2025_same_weeks: number;
  total_2025: number;
  total_2024: number;
  total_2023: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  totalWeeks: number;
  year: number;
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, { bg: string; color: string }> = {
    1: { bg: 'var(--accent-gold)', color: '#7C4D00' },
    2: { bg: '#C5C7D0', color: '#323338' },
    3: { bg: '#CD7F32', color: 'white' },
  };
  const s = styles[rank];
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
      style={s ? { background: s.bg, color: s.color } : { color: 'var(--text-muted)' }}
    >
      {rank}
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

  const color = streak >= 10 ? 'var(--accent-gold)' : streak >= 5 ? 'var(--accent-blue)' : 'var(--text-secondary)';
  return (
    <span className="inline-flex items-center gap-1" style={{ color }}>
      <span className="text-sm">🔥</span>
      <span className="font-semibold">{streak}</span>
    </span>
  );
}

function YoYChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

  const diff = current - previous;
  if (diff === 0) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

  const color = diff > 0 ? '#22c55e' : '#ef4444';
  const arrow = diff > 0 ? '↑' : '↓';

  return (
    <span style={{ color }} className="font-medium">
      {arrow}{Math.abs(diff)}
    </span>
  );
}

export default function AttendanceLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attendance/leaderboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading attendance...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">Failed to load attendance data</div>;
  }

  return (
    <div>
      <div className="mb-6 -mx-4 sm:-mx-6 -mt-4 px-4 sm:px-6 py-4" style={{ background: 'var(--nav-bg)' }}>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'white' }}>
          2026 Attendance Leaderboard
        </h1>
        <p className="text-sm sm:text-base mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Saturday runs this season ({data.totalWeeks} weeks so far)
        </p>
      </div>

      {/* Mobile leaderboard - card layout */}
      <div className="sm:hidden space-y-2">
        {data.leaderboard.map((entry, idx) => (
          <Link
            key={entry.runner_id}
            href={`/attendance/runners/${entry.runner_id}`}
            className={`block card p-3 ${idx < 3 ? 'border-l-4' : ''}`}
            style={{
              borderLeftColor: idx === 0 ? 'var(--accent-gold)' : idx === 1 ? '#C5C7D0' : idx === 2 ? '#CD7F32' : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankBadge rank={idx + 1} />
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--accent-blue)' }}>
                    {entry.nickname}
                  </div>
                  <div className="text-xs flex gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span>{entry.attendance_pct}%</span>
                    <StreakBadge streak={entry.current_streak} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>{entry.total_2026}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  vs &apos;25: <YoYChange current={entry.total_2026} previous={entry.total_2025_same_weeks} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop leaderboard - table layout */}
      <div className="hidden sm:block overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--nav-bg)' }}>
              <th className="px-3 py-3 text-left font-semibold text-white">Rank</th>
              <th className="px-3 py-3 text-left font-semibold text-white">Runner</th>
              <th className="px-3 py-3 text-center font-semibold text-white">2026</th>
              <th className="px-3 py-3 text-center font-semibold text-white">%</th>
              <th className="px-3 py-3 text-center font-semibold text-white">Streak</th>
              <th className="px-3 py-3 text-center font-semibold text-white" title="Same number of weeks as current year">&#39;25 (wk 1-19)</th>
              <th className="px-3 py-3 text-center font-semibold text-white">YoY</th>
              <th className="px-3 py-3 text-center font-semibold text-white" title="Full year">&#39;24</th>
              <th className="px-3 py-3 text-center font-semibold text-white" title="Full year">&#39;23</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((entry, idx) => (
              <tr
                key={entry.runner_id}
                className="transition-colors hover:bg-blue-50/40"
                style={{ borderBottom: '1px solid var(--card-border)' }}
              >
                <td className="px-3 py-2.5">
                  <RankBadge rank={idx + 1} />
                </td>
                <td className="px-3 py-2.5 font-medium">
                  <Link
                    href={`/attendance/runners/${entry.runner_id}`}
                    className="hover:underline"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    {entry.nickname}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-center text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {entry.total_2026}
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-secondary)' }}>
                  {entry.attendance_pct}%
                </td>
                <td className="px-3 py-2.5 text-center">
                  <StreakBadge streak={entry.current_streak} />
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  {entry.total_2025_same_weeks}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <YoYChange current={entry.total_2026} previous={entry.total_2025_same_weeks} />
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  {entry.total_2024}
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  {entry.total_2023}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
            {data.leaderboard.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Runners</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
            {data.totalWeeks}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Weeks This Season</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data.leaderboard.reduce((sum, e) => sum + e.total_2026, 0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Attendances</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {Math.round(data.leaderboard.reduce((sum, e) => sum + e.total_2026, 0) / data.totalWeeks)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg per Week</div>
        </div>
      </div>
    </div>
  );
}
