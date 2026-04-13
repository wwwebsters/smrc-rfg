'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { formatTime } from '@/lib/format';

interface PR {
  distance: string;
  pr_time_seconds: number | null;
  ag_pr_time_seconds: number | null;
  ag_pr_date: string | null;
  age_at_ag_pr: number | null;
  factor_at_race: number | null;
  ag_time_seconds: number | null;
  todays_factor: number | null;
  target_seconds: number | null;
}

interface Race {
  id: number;
  race_name: string;
  race_date: string;
  distance: string;
  finish_time_seconds: number;
  points_earned: number;
  points_type: string;
  race_number: number;
}

interface RunnerDetail {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  prs: PR[];
  races: Race[];
}

const DISTANCE_DISPLAY: Record<string, string> = {
  '5 km': '5K', '4 Mile': '4 Mile', '5 Mile': '5 Mile',
  '10 km': '10K', '8 km': '8 Mile', '15 km': '15K',
  '10 Mile': '10 Mile', 'H. Mar': 'Half Marathon',
  'Marathon': 'Full Marathon', '50 km': '50K',
  '50 Mile': '50 Mile', '100 km': '100K', '100 Mile': '100 Mile',
};

const DISTANCE_ORDER = [
  '5 km', '4 Mile', '5 Mile', '10 km', '8 km', '15 km',
  '10 Mile', 'H. Mar', 'Marathon', '50 km', '50 Mile', '100 km', '100 Mile'
];

function typeBadge(pointsType: string) {
  const typeLabel: Record<string, string> = {
    PR: 'PR', AG_PR: 'AG PR', FIRST_TIME: '1st Time', PARTICIPATION: 'Participation',
  };
  const typeStyle: Record<string, { bg: string; color: string }> = {
    PR: { bg: 'rgba(245,166,35,0.15)', color: '#B07800' },
    AG_PR: { bg: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' },
    FIRST_TIME: { bg: 'rgba(0,115,234,0.1)', color: 'var(--accent-blue)' },
    PARTICIPATION: { bg: 'var(--card-border)', color: 'var(--text-secondary)' },
  };
  const s = typeStyle[pointsType] || typeStyle.PARTICIPATION;
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {typeLabel[pointsType] || pointsType}
    </span>
  );
}

export default function RunnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [runner, setRunner] = useState<RunnerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/runners/${id}`)
      .then((r) => r.json())
      .then(setRunner)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading runner...</div>;
  }

  if (!runner) {
    return <div className="text-center py-12 text-red-500">Runner not found</div>;
  }

  const sortedPRs = [...runner.prs].sort(
    (a, b) => DISTANCE_ORDER.indexOf(a.distance) - DISTANCE_ORDER.indexOf(b.distance)
  );

  const activePRs = sortedPRs.filter(
    (pr) => pr.pr_time_seconds && pr.pr_time_seconds > 0
  );

  const runnerDisplay = (() => {
    const parts = runner.full_name.split(' ');
    const last = parts.slice(-1)[0];
    const first = parts.slice(0, -1).join(' ');
    return first ? `${last}, ${first} (${runner.nickname})` : `${last} (${runner.nickname})`;
  })();

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {runnerDisplay}
        </h1>
        <div className="flex gap-4 mt-1" style={{ color: 'var(--text-secondary)' }}>
          {runner.age && <span>Age: {runner.age}</span>}
          {runner.birthday && <span>Born: {runner.birthday}</span>}
        </div>
      </div>

      {/* Race History */}
      {runner.races && runner.races.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: 'var(--nav-bg)' }}>
            <h2 className="text-white font-semibold text-base sm:text-lg">2026 Race History</h2>
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.2)', color: 'var(--accent-gold)' }}>
              {runner.races.reduce((sum, r) => sum + r.points_earned, 0)} pts
            </span>
          </div>
          <div className="overflow-x-auto relative group">
            {/* Scroll hint for mobile - fades out on scroll */}
            <div className="sm:hidden absolute right-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-end pr-1">
              <span className="text-xs animate-pulse" style={{ color: 'var(--text-muted)' }}>→</span>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>#</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Race</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Distance</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Time</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Points</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {runner.races.map((race) => (
                  <tr key={race.id} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{race.race_number}</td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{race.race_name}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{race.race_date}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {DISTANCE_DISPLAY[race.distance] || race.distance}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatTime(race.finish_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold" style={{ color: 'var(--accent-gold)' }}>
                      {race.points_earned}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {typeBadge(race.points_type)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--background)', borderTop: '2px solid var(--card-border)' }}>
                  <td colSpan={5} className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Total:</td>
                  <td className="px-4 py-2.5 text-center font-bold text-lg" style={{ color: 'var(--accent-gold)' }}>
                    {runner.races.reduce((sum, r) => sum + r.points_earned, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activePRs.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3" style={{ background: 'var(--nav-bg)' }}>
            <h2 className="text-white font-semibold text-base sm:text-lg">Personal Records & Targets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Distance</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>PR</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>AG PR</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>AG PR Date</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Age @ Race</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Factor @ Race</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>AG Time</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>Today&apos;s Factor</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--accent-gold)' }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {activePRs.map((pr) => (
                  <tr key={pr.distance} className="hover:bg-blue-50/40 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {DISTANCE_DISPLAY[pr.distance] || pr.distance}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatTime(pr.pr_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatTime(pr.ag_pr_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>
                      {pr.ag_pr_date || '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                      {pr.age_at_ag_pr ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                      {pr.factor_at_race?.toFixed(4) ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(pr.ag_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                      {pr.todays_factor?.toFixed(4) ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--accent-gold)' }}>
                      {formatTime(pr.target_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No PR data available for this runner.
        </div>
      )}

      {sortedPRs.length > activePRs.length && (
        <div className="mt-6 card p-4 sm:p-6">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Distances Not Yet Raced</h3>
          <div className="flex flex-wrap gap-2">
            {sortedPRs
              .filter((pr) => !pr.pr_time_seconds || pr.pr_time_seconds <= 0)
              .map((pr) => (
                <span
                  key={pr.distance}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
                >
                  {DISTANCE_DISPLAY[pr.distance] || pr.distance}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
