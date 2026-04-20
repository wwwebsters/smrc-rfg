import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          SMRC
        </h1>
        <p className="text-lg mb-12 italic" style={{ color: 'var(--text-muted)' }}>
          Run all the miles, drink all the beer.&trade;
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
          <Link
            href="/rfg"
            className="card p-8 text-center hover:shadow-lg transition-all group"
          >
            <div className="text-3xl mb-3">🏅</div>
            <h2 className="text-xl font-bold mb-1 group-hover:text-[var(--accent-blue)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              Race for Gold
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Leaderboard, scores & results
            </p>
          </Link>

          <div
            className="card p-8 text-center opacity-50 cursor-not-allowed"
          >
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              2026 Attendance
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
