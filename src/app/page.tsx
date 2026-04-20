import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <header style={{ background: 'var(--nav-bg)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                SMRC
              </span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="min-h-[60vh] flex items-center justify-center px-4">
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
      </main>
    </>
  );
}
