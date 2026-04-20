'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  runner_id: number;
  nickname: string;
  full_name: string;
  total_points: number;
  race_count: number;
  efficiency: number;
  race_scores: { race_number: number; points_earned: number }[];
}

function displayName(full_name: string, nickname: string) {
  const parts = full_name.split(' ');
  const last = parts.slice(-1)[0];
  const first = parts.slice(0, -1).join(' ');
  return first ? `${last}, ${first} (${nickname})` : `${last} (${nickname})`;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading leaderboard...</div>;
  }

  const maxRaces = Math.max(...data.map((d) => d.race_scores.length), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          2026 Race for Gold Leaderboard
        </h1>
        <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
          Points earned across all races this season
        </p>
      </div>

      {/* Mobile leaderboard - card layout */}
      <div className="sm:hidden space-y-2">
        {data.map((entry, idx) => (
          <Link
            key={entry.runner_id}
            href={`/rfg/runners/${entry.runner_id}`}
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
                    {displayName(entry.full_name, entry.nickname)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {entry.race_count} races | Eff: {entry.efficiency?.toFixed(1) ?? '-'}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>{entry.total_points}</div>
            </div>
            {entry.race_scores.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.race_scores.map((score, i) => (
                  <ScoreBadge key={i} points={score.points_earned} />
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop leaderboard - table layout */}
      <div className="hidden sm:block overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--nav-bg)' }}>
              <th className="px-3 py-3 text-left font-semibold text-white sticky left-0 z-10" style={{ background: 'var(--nav-bg)' }}>Rank</th>
              <th className="px-3 py-3 text-left font-semibold text-white sticky left-12 z-10" style={{ background: 'var(--nav-bg)' }}>Runner</th>
              {Array.from({ length: maxRaces }, (_, i) => (
                <th key={i} className="px-2 py-3 text-center font-semibold text-white min-w-[40px]">
                  #{i + 1}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold text-white">Total</th>
              <th className="px-3 py-3 text-center font-semibold text-white">Eff</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, idx) => (
              <tr
                key={entry.runner_id}
                className="transition-colors hover:bg-blue-50/40"
                style={{ borderBottom: '1px solid var(--card-border)' }}
              >
                <td className="px-3 py-2.5 sticky left-0 bg-white z-10">
                  <RankBadge rank={idx + 1} />
                </td>
                <td className="px-3 py-2.5 font-medium sticky left-12 bg-white z-10">
                  <Link
                    href={`/rfg/runners/${entry.runner_id}`}
                    className="hover:underline"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    {displayName(entry.full_name, entry.nickname)}
                  </Link>
                </td>
                {Array.from({ length: maxRaces }, (_, i) => {
                  const score = entry.race_scores[i];
                  return (
                    <td key={i} className="px-2 py-2.5 text-center">
                      {score ? <ScoreBadge points={score.points_earned} /> : (
                        <span style={{ color: 'var(--card-border)' }}>-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {entry.total_points}
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  {entry.efficiency?.toFixed(1) ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoringCard
          title="Actual PR"
          color="gold"
          rows={[
            ['5k / 4 mile', '8 pts'], ['5 mile / 10k', '9 pts'],
            ['8 mile / 15k', '11 pts'], ['10 mile', '12 pts'],
            ['Half Marathon', '13 pts'], ['Full Marathon', '16 pts'],
            ['50k', '17 pts'], ['50 Mile', '18 pts'], ['100 Mile', '19 pts'],
          ]}
        />
        <ScoringCard
          title="AG PR / 1st Time Distance"
          color="blue"
          rows={[
            ['5k / 4 mile', '6 pts'], ['5 mile / 10k', '7 pts'],
            ['8 mile / 15k', '8 pts'], ['10 mile', '9 pts'],
            ['Half Marathon', '10 pts'], ['Full Marathon', '12 pts'],
            ['50k', '13 pts'], ['50 Mile', '14 pts'], ['100 Mile', '15 pts'],
          ]}
        />
        <ScoringCard
          title="Participation"
          color="gray"
          rows={[
            ['Up to 5 mile', '1 pt'], ['Up to 8 mile', '2 pts'],
            ['Up to Half Marathon', '3 pts'], ['Marathon & beyond', '4 pts'],
          ]}
        />
      </div>
    </div>
  );
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

function ScoreBadge({ points }: { points: number }) {
  let bg: string, color: string;
  if (points >= 12) {
    bg = 'rgba(245,166,35,0.15)';
    color = '#B07800';
  } else if (points >= 6) {
    bg = 'rgba(0,115,234,0.1)';
    color = 'var(--accent-blue)';
  } else {
    bg = 'var(--card-border)';
    color = 'var(--text-secondary)';
  }
  return (
    <span
      className="inline-block min-w-[22px] text-center rounded-md px-1.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {points}
    </span>
  );
}

function ScoringCard({
  title,
  rows,
  color,
}: {
  title: string;
  rows: [string, string][];
  color: 'gold' | 'blue' | 'gray';
}) {
  const headerStyles = {
    gold: { background: 'rgba(245,166,35,0.12)', color: '#B07800', borderColor: 'rgba(245,166,35,0.25)' },
    blue: { background: 'rgba(0,115,234,0.08)', color: 'var(--accent-blue)', borderColor: 'rgba(0,115,234,0.2)' },
    gray: { background: 'var(--background)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)' },
  };
  const h = headerStyles[color];
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 font-semibold text-sm" style={{ background: h.background, color: h.color, borderBottom: `1px solid ${h.borderColor}` }}>
        {title}
      </div>
      <div>
        {rows.map(([dist, pts]) => (
          <div key={dist} className="px-4 py-2 flex justify-between text-sm" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{dist}</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
