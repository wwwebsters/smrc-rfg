'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/components/AdminAuth';
import { RunnerFormFields, StatusMessage, emptyForm } from '@/components/RunnerForm';
import type { RunnerForm } from '@/components/RunnerForm';

export default function AddRunnerPage() {
  const { refreshRunners } = useAdminAuth();
  const [form, setForm] = useState<RunnerForm>(emptyForm());
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setAdding(true);
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: data.message });
        setForm(emptyForm());
        refreshRunners();
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to add runner' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="px-4 sm:px-6 py-3" style={{ background: 'var(--nav-bg)' }}>
        <h2 className="text-white font-semibold text-base sm:text-lg">Add Runner</h2>
      </div>
      <form onSubmit={handleAdd} className="p-4 sm:p-6">
        <RunnerFormFields form={form} setForm={setForm} />
        <div className="mt-6">
          <button type="submit" disabled={adding} className="btn-primary sm:w-auto px-8">
            {adding ? 'Adding...' : 'Add Runner'}
          </button>
        </div>
        {msg && <StatusMessage msg={msg} />}
      </form>
    </section>
  );
}
