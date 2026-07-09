'use client';

import { useState, useEffect } from 'react';

interface PageViewStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  uniqueVisitors: number;
  todayUnique: number;
  viewsByPage: { path: string; views: number }[];
  viewsByDay: { date: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Site Analytics
          <span className="text-xs text-gray-400">
            {expanded ? '(click to collapse)' : '(click to expand)'}
          </span>
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">{stats.todayViews} today</span>
          <span className="text-blue-400">{stats.weekViews} this week</span>
          <span className="text-gray-400">{stats.totalViews} total</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Summary Stats */}
          <div className="bg-gray-700 rounded p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Today:</span>
                <span className="text-white ml-2">{stats.todayViews} views</span>
              </div>
              <div>
                <span className="text-gray-400">Unique today:</span>
                <span className="text-white ml-2">{stats.todayUnique}</span>
              </div>
              <div>
                <span className="text-gray-400">This week:</span>
                <span className="text-white ml-2">{stats.weekViews} views</span>
              </div>
              <div>
                <span className="text-gray-400">All-time unique:</span>
                <span className="text-white ml-2">{stats.uniqueVisitors}</span>
              </div>
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-gray-700 rounded p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Top Pages</h4>
            <div className="space-y-1 text-sm">
              {stats.viewsByPage.slice(0, 5).map((page) => (
                <div key={page.path} className="flex justify-between">
                  <span className="text-gray-300 truncate max-w-[200px]">{page.path}</span>
                  <span className="text-white">{page.views}</span>
                </div>
              ))}
              {stats.viewsByPage.length === 0 && (
                <div className="text-gray-500">No data yet</div>
              )}
            </div>
          </div>

          {/* Recent Days */}
          <div className="bg-gray-700 rounded p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Last 7 Days</h4>
            <div className="space-y-1 text-sm">
              {stats.viewsByDay.slice(0, 7).map((day) => (
                <div key={day.date} className="flex justify-between">
                  <span className="text-gray-300">{day.date}</span>
                  <span className="text-white">{day.views}</span>
                </div>
              ))}
              {stats.viewsByDay.length === 0 && (
                <div className="text-gray-500">No data yet</div>
              )}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-gray-700 rounded p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Top Referrers</h4>
            <div className="space-y-1 text-sm">
              {stats.topReferrers.map((ref) => (
                <div key={ref.referrer} className="flex justify-between">
                  <span className="text-gray-300 truncate max-w-[200px]">
                    {ref.referrer || '(direct)'}
                  </span>
                  <span className="text-white">{ref.count}</span>
                </div>
              ))}
              {stats.topReferrers.length === 0 && (
                <div className="text-gray-500">No referrers yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
