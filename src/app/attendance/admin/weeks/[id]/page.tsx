'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider } from '@/components/AdminAuth';

interface Week {
  id: number;
  week_date: string;
  timmy_year: number;
  week_number: number;
  status: string;
}

interface AttendanceRecord {
  runner_id: number;
  nickname: string;
  full_name: string | null;
  present: number;
  source: string;
}

interface WeekData {
  week: Week;
  records: AttendanceRecord[];
}

function formatDate(dateStr: string): string {
  // Parse as local date to avoid timezone issues (UTC conversion shifts to previous day)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function EditAttendanceWeekPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    fetch(`/api/attendance/weeks/${id}`)
      .then((r) => r.json())
      .then((d: WeekData) => {
        setData(d);
        const initialRecords = new Map<number, boolean>();
        d.records.forEach((r) => initialRecords.set(r.runner_id, r.present === 1));
        setRecords(initialRecords);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleRunner = (runnerId: number) => {
    setRecords((prev) => {
      const newRecords = new Map(prev);
      newRecords.set(runnerId, !prev.get(runnerId));
      return newRecords;
    });
  };

  const handleSave = async (approve = false) => {
    setSaving(true);
    const recordsArray = Array.from(records.entries()).map(([runner_id, present]) => ({
      runner_id,
      present,
    }));

    await fetch(`/api/attendance/weeks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: recordsArray,
        status: approve ? 'approved' : data?.week.status,
      }),
    });

    setSaving(false);
    if (approve) {
      router.push('/attendance/admin');
    }
  };

  if (loading || !data) {
    return (
      <AdminAuthProvider type="attendance">
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading week...</div>
      </AdminAuthProvider>
    );
  }

  const presentCount = Array.from(records.values()).filter(Boolean).length;

  return (
    <AdminAuthProvider type="attendance">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Week #{data.week.week_number}
          </h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(data.week.week_date)}
          </p>
          <div className="mt-2 flex gap-4 items-center">
            <span
              className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{
                background: data.week.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,166,35,0.15)',
                color: data.week.status === 'approved' ? '#22c55e' : '#B07800',
              }}
            >
              {data.week.status}
            </span>
            <span style={{ color: 'var(--accent-gold)' }} className="font-bold">
              {presentCount} present
            </span>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Toggle Attendance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {data.records.map((record) => {
              const isPresent = records.get(record.runner_id) ?? false;
              return (
                <button
                  key={record.runner_id}
                  onClick={() => toggleRunner(record.runner_id)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    background: isPresent ? 'rgba(34, 197, 94, 0.15)' : 'var(--background)',
                    border: `2px solid ${isPresent ? '#22c55e' : 'var(--card-border)'}`,
                  }}
                >
                  <div className="font-medium text-sm" style={{ color: isPresent ? '#22c55e' : 'var(--text-muted)' }}>
                    {record.nickname}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {record.source !== 'none' && record.source !== 'manual' && `via ${record.source}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.push('/attendance/admin')}
            className="px-4 py-2 rounded"
            style={{ background: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 rounded"
            style={{ background: 'var(--accent-blue)', color: 'white', opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {data.week.status !== 'approved' && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 rounded font-semibold"
              style={{ background: '#22c55e', color: 'white', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Approve & Finalize'}
            </button>
          )}
        </div>
      </div>
    </AdminAuthProvider>
  );
}
