'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Runner {
  id: number;
  nickname: string;
  full_name: string;
  birthday: string | null;
  age: number | null;
}

export default function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runners')
      .then((r) => r.json())
      .then((data: Runner[]) => {
        const sorted = data.sort((a, b) => {
          const aLast = a.full_name.split(' ').slice(-1)[0];
          const bLast = b.full_name.split(' ').slice(-1)[0];
          return aLast.localeCompare(bLast);
        });
        setRunners(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading runners...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Runners</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {runners.map((runner) => {
          const parts = runner.full_name.split(' ');
          const last = parts.slice(-1)[0];
          const first = parts.slice(0, -1).join(' ');
          const display = first ? `${last}, ${first}` : last;
          return (
            <Link
              key={runner.id}
              href={`/runners/${runner.id}`}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-3 sm:p-5 group"
            >
              <div className="text-lg font-semibold text-amber-700 group-hover:text-amber-900">
                {display} ({runner.nickname})
              </div>
              {runner.age && (
                <div className="text-sm text-gray-500 mt-1">Age: {runner.age}</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
