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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'rgba(245, 166, 35, 0.15)', color: '#B07800' },
    approved: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  };
  const s = styles[status] || styles.draft;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

export default function AttendanceAdminPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attendance/weeks?year=2026')
      .then((r) => r.json())
      .then(setWeeks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminAuthProvider>
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading weeks...</div>
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
