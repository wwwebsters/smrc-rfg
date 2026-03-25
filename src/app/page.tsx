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
    return <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>;
  }

  const maxRaces = Math.max(...data.map((d) => d.race_scores.length), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">2026 Race for Gold Leaderboard</h1>
        <p className="text-gray-600 mt-1">Points earned across all races this season</p>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
              <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-yellow-500 z-10">Rank</th>
              <th className="px-3 py-3 text-left font-semibold sticky left-12 bg-yellow-500 z-10">Runner</th>
              {Array.from({ length: maxRaces }, (_, i) => (
                <th key={i} className="px-2 py-3 text-center font-semibold min-w-[40px]">
                  #{i + 1}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold">Total</th>
              <th className="px-3 py-3 text-center font-semibold">Eff</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, idx) => (
              <tr
                key={entry.runner_id}
                className={`border-b border-gray-100 hover:bg-yellow-50 transition-colors ${
                  idx < 3 ? 'bg-yellow-50/50' : ''
                }`}
              >
                <td className="px-3 py-2.5 sticky left-0 bg-inherit z-10">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    idx === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : idx === 1
                      ? 'bg-gray-300 text-gray-700'
                      : idx === 2
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium sticky left-12 bg-inherit z-10">
                  <Link
                    href={`/runners/${entry.runner_id}`}
                    className="text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    {(() => {
                      const parts = entry.full_name.split(' ');
                      const last = parts.slice(-1)[0];
                      const first = parts.slice(0, -1).join(' ');
                      return first ? `${last}, ${first} (${entry.nickname})` : `${last} (${entry.nickname})`;
                    })()}
                  </Link>
                </td>
                {Array.from({ length: maxRaces }, (_, i) => {
                  const score = entry.race_scores[i];
                  return (
                    <td key={i} className="px-2 py-2.5 text-center">
                      {score ? (
                        <span className={`inline-block min-w-[24px] rounded px-1 py-0.5 text-xs font-semibold ${
                          score.points_earned >= 12
                            ? 'bg-yellow-200 text-yellow-800'
                            : score.points_earned >= 6
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {score.points_earned}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center font-bold text-lg text-amber-700">
                  {entry.total_points}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-500">
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
          rows={[
            ['5k / 4 mile', '8 pts'],
            ['5 mile / 10k', '9 pts'],
            ['8 mile / 15k', '11 pts'],
            ['10 mile', '12 pts'],
            ['Half Marathon', '13 pts'],
            ['Full Marathon', '16 pts'],
            ['50k', '17 pts'],
            ['50 Mile', '18 pts'],
            ['100 Mile', '19 pts'],
          ]}
          color="yellow"
        />
        <ScoringCard
          title="AG PR / 1st Time Distance"
          rows={[
            ['5k / 4 mile', '6 pts'],
            ['5 mile / 10k', '7 pts'],
            ['8 mile / 15k', '8 pts'],
            ['10 mile', '9 pts'],
            ['Half Marathon', '10 pts'],
            ['Full Marathon', '12 pts'],
            ['50k', '13 pts'],
            ['50 Mile', '14 pts'],
            ['100 Mile', '15 pts'],
          ]}
          color="blue"
        />
        <ScoringCard
          title="Participation"
          rows={[
            ['Up to 5 mile', '1 pt'],
            ['Up to 8 mile', '2 pts'],
            ['Up to Half Marathon', '3 pts'],
            ['Marathon & beyond', '4 pts'],
          ]}
          color="gray"
        />
      </div>
    </div>
  );
}

function ScoringCard({
  title,
  rows,
  color,
}: {
  title: string;
  rows: [string, string][];
  color: 'yellow' | 'blue' | 'gray';
}) {
  const headerColors = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className={`px-4 py-3 font-semibold border-b ${headerColors[color]}`}>
        {title}
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(([dist, pts]) => (
          <div key={dist} className="px-4 py-2 flex justify-between text-sm">
            <span className="text-gray-600">{dist}</span>
            <span className="font-medium">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
