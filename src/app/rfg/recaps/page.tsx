'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Recap {
  id: number;
  race_name: string;
  race_date: string | null;
  recap_text: string;
  original_format: string;
  email_date: string;
}

interface RunnerRecaps {
  runner_id: number;
  runner_name: string;
  nickname: string;
  recaps: Recap[];
}

export default function RecapsPage() {
  const [data, setData] = useState<RunnerRecaps[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRunner, setExpandedRunner] = useState<number | null>(null);
  const [expandedRecap, setExpandedRecap] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/recaps')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        Loading recaps...
      </div>
    );
  }

  const totalRecaps = data.reduce((sum, r) => sum + r.recaps.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          2026 Race Recaps
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {totalRecaps} recaps from {data.length} runners
        </p>
      </div>

      <div className="space-y-4">
        {data.map((runner) => (
          <div key={runner.runner_id} className="card overflow-hidden">
            <button
              onClick={() => setExpandedRunner(expandedRunner === runner.runner_id ? null : runner.runner_id)}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left"
              style={{ background: expandedRunner === runner.runner_id ? 'var(--nav-bg)' : 'white' }}
            >
              <div className="flex items-center gap-3">
                <Link
                  href={`/rfg/runners/${runner.runner_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                  style={{ color: expandedRunner === runner.runner_id ? 'white' : 'var(--text-primary)' }}
                >
                  <span className="font-semibold text-lg">{runner.runner_name}</span>
                  <span className="ml-2 text-sm opacity-70">({runner.nickname})</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    background: expandedRunner === runner.runner_id ? 'rgba(255,255,255,0.2)' : 'rgba(0,115,234,0.1)',
                    color: expandedRunner === runner.runner_id ? 'white' : 'var(--accent-blue)'
                  }}
                >
                  {runner.recaps.length} recap{runner.recaps.length !== 1 ? 's' : ''}
                </span>
                <span style={{ color: expandedRunner === runner.runner_id ? 'white' : 'var(--text-muted)' }}>
                  {expandedRunner === runner.runner_id ? '−' : '+'}
                </span>
              </div>
            </button>

            {expandedRunner === runner.runner_id && (
              <div className="border-t" style={{ borderColor: 'var(--card-border)' }}>
                {runner.recaps.map((recap) => (
                  <div
                    key={recap.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <button
                      onClick={() => setExpandedRecap(expandedRecap === recap.id ? null : recap.id)}
                      className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                      <div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {recap.race_name}
                        </span>
                        <span className="ml-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {new Date(recap.email_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs uppercase"
                          style={{
                            background: 'var(--card-border)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {recap.original_format}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {expandedRecap === recap.id ? '−' : '+'}
                        </span>
                      </div>
                    </button>

                    {expandedRecap === recap.id && (
                      <div
                        className="px-4 sm:px-6 py-4"
                        style={{ background: 'var(--background)' }}
                      >
                        <div
                          className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {recap.recap_text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
