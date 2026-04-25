'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AdminAuthContextType {
  authed: boolean | null;
  runnersMap: Record<string, string>;
  refreshRunners: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  authed: null,
  runnersMap: {},
  refreshRunners: () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children, type = 'rfg' }: { children: React.ReactNode; type?: 'attendance' | 'rfg' }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [runnersMap, setRunnersMap] = useState<Record<string, string>>({});

  const refreshRunners = useCallback(() => {
    fetch('/api/runners')
      .then((r) => r.json())
      .then((data: { nickname: string; full_name: string }[]) => {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.nickname] = r.full_name; });
        setRunnersMap(map);
      });
  }, []);

  useEffect(() => {
    // Use different endpoints to check auth based on type
    const checkEndpoint = type === 'attendance'
      ? '/api/attendance/auth-check'  // Simple auth check endpoint for attendance
      : '/api/admin/review';           // This endpoint requires RFG admin auth

    fetch(checkEndpoint, { method: type === 'attendance' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, body: type === 'attendance' ? undefined : '{}' })
      .then((r) => {
        if (r.status === 401) {
          setAuthed(false);
        } else if (r.ok) {
          setAuthed(true);
          if (type === 'rfg') refreshRunners();
        } else {
          // Non-401 error - show login form as fallback
          setAuthed(false);
        }
      })
      .catch(() => {
        // Network error - show login form as fallback
        setAuthed(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (authed === null) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (authed === false) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, type }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          setError('Wrong password');
        }
      } catch {
        setError('Something went wrong');
      }
    };

    return (
      <div className="max-w-sm mx-auto mt-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Access</h1>
          <p style={{ color: 'var(--text-muted)' }} className="mt-1">Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Admin Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="input" autoFocus />
          </div>
          {error && <div className="text-sm" style={{ color: '#D83A52' }}>{error}</div>}
          <button type="submit" className="btn-primary">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ authed, runnersMap, refreshRunners }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function formatRunnerName(nickname: string, runnersMap: Record<string, string>): string {
  const fullName = runnersMap[nickname];
  if (!fullName) return nickname;
  const parts = fullName.split(' ');
  const last = parts.slice(-1)[0];
  const first = parts.slice(0, -1).join(' ');
  return first ? `${last}, ${first} (${nickname})` : `${last} (${nickname})`;
}
