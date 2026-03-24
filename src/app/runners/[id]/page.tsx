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

interface RunnerDetail {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
  prs: PR[];
}

const DISTANCE_DISPLAY: Record<string, string> = {
  '5 km': '5K',
  '4 Mile': '4 Mile',
  '5 Mile': '5 Mile',
  '10 km': '10K',
  '8 km': '8 Mile',
  '15 km': '15K',
  '10 Mile': '10 Mile',
  'H. Mar': 'Half Marathon',
  'Marathon': 'Full Marathon',
  '50 km': '50K',
  '50 Mile': '50 Mile',
  '100 km': '100K',
  '100 Mile': '100 Mile',
};

const DISTANCE_ORDER = [
  '5 km', '4 Mile', '5 Mile', '10 km', '8 km', '15 km',
  '10 Mile', 'H. Mar', 'Marathon', '50 km', '50 Mile', '100 km', '100 Mile'
];

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
    return <div className="text-center py-12 text-gray-500">Loading runner...</div>;
  }

  if (!runner) {
    return <div className="text-center py-12 text-red-500">Runner not found</div>;
  }

  // Sort PRs by distance order
  const sortedPRs = [...runner.prs].sort(
    (a, b) => DISTANCE_ORDER.indexOf(a.distance) - DISTANCE_ORDER.indexOf(b.distance)
  );

  // Only show distances that have actual data
  const activePRs = sortedPRs.filter(
    (pr) => pr.pr_time_seconds && pr.pr_time_seconds > 0
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{runner.nickname}</h1>
        <div className="flex gap-4 text-gray-600 mt-1">
          {runner.age && <span>Age: {runner.age}</span>}
          {runner.birthday && <span>Born: {runner.birthday}</span>}
        </div>
      </div>

      {activePRs.length > 0 ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3">
            <h2 className="text-white font-semibold text-lg">Personal Records & Targets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Distance</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">PR</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">AG PR</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">AG PR Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Age @ Race</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Factor @ Race</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">AG Time</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Today&apos;s Factor</th>
                  <th className="px-4 py-3 text-right font-semibold text-amber-700">Target</th>
                </tr>
              </thead>
              <tbody>
                {activePRs.map((pr) => (
                  <tr key={pr.distance} className="border-b border-gray-50 hover:bg-yellow-50/30">
                    <td className="px-4 py-2.5 font-medium">
                      {DISTANCE_DISPLAY[pr.distance] || pr.distance}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatTime(pr.pr_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatTime(pr.ag_pr_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-500">
                      {pr.ag_pr_date || '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {pr.age_at_ag_pr ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {pr.factor_at_race?.toFixed(4) ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                      {formatTime(pr.ag_time_seconds)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {pr.todays_factor?.toFixed(4) ?? '--'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-700">
                      {formatTime(pr.target_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          No PR data available for this runner.
        </div>
      )}

      {/* Show all distances including those without PRs */}
      {sortedPRs.length > activePRs.length && (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Distances Not Yet Raced</h3>
          <div className="flex flex-wrap gap-2">
            {sortedPRs
              .filter((pr) => !pr.pr_time_seconds || pr.pr_time_seconds <= 0)
              .map((pr) => (
                <span
                  key={pr.distance}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
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
