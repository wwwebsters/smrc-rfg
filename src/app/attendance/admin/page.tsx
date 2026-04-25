'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAuthProvider } from '@/components/AdminAuth';

interface Week {
  id: number;
  week_date: string;
  timmy_year: number;
  week_number: number;
  status: string;
  attendance_count: number;
}

interface RSVP {
  id: number;
  runner_id: number;
  nickname: string;
  week_date: string;
  status: string;
  raw_text: string;
  parsed_at: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'rgba(245, 166, 35, 0.15)', color: '#B07800' },
    approved: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    in: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    out: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  };
  const s = styles[status] || styles.draft;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold uppercase"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function RSVPQueue({ rsvps, onAction, onClearWeek }: { rsvps: RSVP[]; onAction: (action: string, ids: number[]) => void; onClearWeek: (weekDate: string) => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (rsvps.length === 0) return null;

  // Group by week
  const byWeek = rsvps.reduce((acc, r) => {
    if (!acc[r.week_date]) acc[r.week_date] = [];
    acc[r.week_date].push(r);
    return acc;
  }, {} as Record<string, RSVP[]>);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: number[]) => {
    setSelected(new Set(ids));
  };

  const handleAction = (action: string) => {
    if (selected.size === 0) return;
    onAction(action, Array.from(selected));
    setSelected(new Set());
  };

  return (
    <div className="card mb-6 overflow-hidden">
      <div className="px-4 py-3 flex justify-between items-center" style={{ background: 'var(--nav-bg)' }}>
        <h2 className="text-lg font-bold text-white">
          Pending RSVPs
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={selected.size === 0}
            className="text-sm px-3 py-1 rounded disabled:opacity-50"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            Approve Selected ({selected.size})
          </button>
          <button
            onClick={() => handleAction('dismiss')}
            disabled={selected.size === 0}
            className="text-sm px-3 py-1 rounded disabled:opacity-50"
            style={{ background: 'var(--text-muted)', color: 'white' }}
          >
            Dismiss
          </button>
        </div>
      </div>

      {Object.entries(byWeek).map(([weekDate, weekRsvps]) => (
        <div key={weekDate}>
          <div
            className="px-4 py-2 flex justify-between items-center"
            style={{ background: 'var(--nav-bg)', color: 'white' }}
          >
            <span className="font-semibold">{formatShortDate(weekDate)}</span>
            <div className="flex gap-3">
              <button
                onClick={() => selectAll(weekRsvps.filter((r) => r.status === 'in').map((r) => r.id))}
                className="text-xs underline"
              >
                Select all IN
              </button>
              <button
                onClick={() => {
                  if (confirm(`Clear all RSVPs for ${formatShortDate(weekDate)}?`)) {
                    onClearWeek(weekDate);
                  }
                }}
                className="text-xs underline text-red-300"
              >
                Clear Week
              </button>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
            {weekRsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="px-4 py-2 flex items-center gap-3 hover:bg-blue-50/40 cursor-pointer"
                onClick={() => toggleSelect(rsvp.id)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(rsvp.id)}
                  onChange={() => toggleSelect(rsvp.id)}
                  className="h-4 w-4"
                />
                <span className="font-medium w-24" style={{ color: 'var(--text-primary)' }}>
                  {rsvp.nickname}
                </span>
                <StatusBadge status={rsvp.status} />
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-muted)' }}
                  title={rsvp.raw_text}
                >
                  {rsvp.raw_text?.slice(0, 60)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceAdminPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch('/api/attendance/weeks?year=2026').then((r) => r.json()),
      fetch('/api/attendance/rsvp-queue').then((r) => r.json()),
    ])
      .then(([weeksData, rsvpsData]) => {
        setWeeks(weeksData);
        setRsvps(Array.isArray(rsvpsData) ? rsvpsData : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRSVPAction = async (action: string, ids: number[]) => {
    await fetch('/api/attendance/rsvp-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rsvpIds: ids }),
    });
    fetchData();
  };

  const handleClearWeek = async (weekDate: string) => {
    await fetch('/api/attendance/rsvp-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_week', weekDate }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <AdminAuthProvider>
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </AdminAuthProvider>
    );
  }

  return (
    <AdminAuthProvider>
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Attendance Admin
            </h1>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
              Manage weekly attendance records
            </p>
          </div>
        </div>

        <RSVPQueue rsvps={rsvps} onAction={handleRSVPAction} onClearWeek={handleClearWeek} />

        <div className="card overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--nav-bg)' }}>
                <th className="px-4 py-3 text-left font-semibold text-white">Week</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Count</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr
                  key={week.id}
                  className="transition-colors hover:bg-blue-50/40"
                  style={{ borderBottom: '1px solid var(--card-border)' }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    #{week.week_number}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(week.week_date)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--accent-gold)' }}>
                    {week.attendance_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={week.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/attendance/admin/weeks/${week.id}`}
                      className="text-sm px-3 py-1 rounded"
                      style={{ background: 'var(--accent-blue)', color: 'white' }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
