'use client';

import { useEffect, useState, FormEvent } from 'react';

interface Runner {
  id: number;
  nickname: string;
  full_name: string;
}

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

export default function SubmitRacePage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [form, setForm] = useState({
    runnerNickname: '',
    raceName: '',
    raceDate: '',
    distance: '',
    hours: '',
    minutes: '',
    seconds: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/runners')
      .then((r) => r.json())
      .then((data) => {
        const sorted = data.sort((a: Runner, b: Runner) => {
          const aLast = a.full_name.split(' ').slice(-1)[0];
          const bLast = b.full_name.split(' ').slice(-1)[0];
          return aLast.localeCompare(bLast);
        });
        setRunners(sorted);
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const h = parseInt(form.hours || '0', 10);
    const m = parseInt(form.minutes || '0', 10);
    const s = parseInt(form.seconds || '0', 10);
    const finishTime = h * 3600 + m * 60 + s;

    if (finishTime <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid finish time.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runnerNickname: form.runnerNickname,
          raceName: form.raceName,
          raceDate: form.raceDate,
          distance: form.distance,
          finishTime,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Race submitted successfully! It will appear after admin review.' });
        setForm({ runnerNickname: '', raceName: '', raceDate: '', distance: '', hours: '', minutes: '', seconds: '' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Submission failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Submit a Race Result</h1>
      <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>
        Submit your race and it will be reviewed by an admin before appearing on the leaderboard.
      </p>

      {message && (
        <div
          className="mb-6 p-4 rounded-lg text-sm"
          style={{
            background: message.type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(226,68,92,0.08)',
            color: message.type === 'success' ? '#00854D' : '#D83A52',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,200,117,0.25)' : 'rgba(226,68,92,0.25)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Runner</label>
          <select required value={form.runnerNickname} onChange={(e) => setForm({ ...form, runnerNickname: e.target.value })} className="input">
            <option value="">Select runner...</option>
            {runners.map((r) => {
              const parts = r.full_name.split(' ');
              const last = parts.slice(-1)[0];
              const first = parts.slice(0, -1).join(' ');
              const display = first ? `${last}, ${first}` : last;
              return (
                <option key={r.id} value={r.nickname}>
                  {display} ({r.nickname})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Race Name</label>
          <input type="text" required value={form.raceName} onChange={(e) => setForm({ ...form, raceName: e.target.value })} placeholder="e.g., Flying Pig Marathon" className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Race Date</label>
          <input type="date" required max={new Date().toISOString().split('T')[0]} value={form.raceDate} onChange={(e) => setForm({ ...form, raceDate: e.target.value })} className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Distance</label>
          <select required value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="input">
            <option value="">Select distance...</option>
            {DISTANCES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Finish Time</label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <input type="number" min="0" max="99" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="HH" className="input text-center" />
              <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Hours</div>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-muted)' }}>:</span>
            <div className="flex-1">
              <input type="number" min="0" max="59" required value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} placeholder="MM" className="input text-center" />
              <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Minutes</div>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-muted)' }}>:</span>
            <div className="flex-1">
              <input type="number" min="0" max="59" required value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} placeholder="SS" className="input text-center" />
              <div className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>Seconds</div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting...' : 'Submit Race Result'}
        </button>
      </form>
    </div>
  );
}
