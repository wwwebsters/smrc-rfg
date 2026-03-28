export default function HallOfFamePage() {
  // 2025 top 3 from the leaderboard data:
  // 1st: Logan (65 pts, 7 races, 9.29 eff)
  // 2nd: C-Rich (53 pts, 9 races, 5.89 eff)
  // 3rd: MG (43 pts, 9 races, 4.78 eff)

  const winners = [
    {
      rank: 1,
      name: 'Logan Holmes',
      points: 65,
      races: 7,
      efficiency: 9.29,
      medal: 'Gold',
      borderColor: 'var(--accent-gold)',
      gradientFrom: '#F5A623',
      gradientTo: '#D4891A',
      nameColor: '#7A5100',
      subtitleColor: '#9A6D00',
      statColor: '#7A5100',
      bgColor: '#FEF9F0',
      medalSize: 'text-6xl',
    },
    {
      rank: 2,
      name: 'Cindy Richmond',
      points: 53,
      races: 9,
      efficiency: 5.89,
      medal: 'Silver',
      borderColor: 'var(--card-border)',
      gradientFrom: '#E6E9EF',
      gradientTo: '#C8CCD6',
      nameColor: 'var(--text-secondary)',
      subtitleColor: 'var(--text-muted)',
      statColor: 'var(--text-secondary)',
      bgColor: '#F6F7FB',
      medalSize: 'text-5xl',
    },
    {
      rank: 3,
      name: 'Kenji Heilman',
      points: 43,
      races: 9,
      efficiency: 4.78,
      medal: 'Bronze',
      borderColor: '#CD7F32',
      gradientFrom: '#CD7F32',
      gradientTo: '#A0622A',
      nameColor: '#6B3E1A',
      subtitleColor: '#8B5E3C',
      statColor: '#6B3E1A',
      bgColor: '#FDF5EC',
      medalSize: 'text-5xl',
    },
  ];

  return (
    <div>
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>2025 Results</h1>
        <p className="text-base sm:text-xl mt-1 sm:mt-2" style={{ color: 'var(--text-secondary)' }}>Race for Gold Champions</p>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
        {/* Silver - 2nd place */}
        <div className="order-2 md:order-1 w-full md:w-72">
          <WinnerCard {...winners[1]} />
        </div>
        {/* Gold - 1st place */}
        <div className="order-1 md:order-2 w-full md:w-80">
          <WinnerCard {...winners[0]} />
        </div>
        {/* Bronze - 3rd place */}
        <div className="order-3 w-full md:w-72">
          <WinnerCard {...winners[2]} />
        </div>
      </div>

      <div className="card p-4 sm:p-8 max-w-2xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>2025 Season Highlights</h2>
        <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5" style={{ color: 'var(--accent-gold)' }}>*</span>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Logan Holmes</strong> dominated the season with an incredible
              9.29 points-per-race efficiency across 7 races, racking up 65 total points to claim gold.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5" style={{ color: 'var(--text-muted)' }}>*</span>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Cindy Richmond</strong> earned silver through sheer consistency,
              competing in 9 races and accumulating 53 points including a 16-point race.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5" style={{ color: '#CD7F32' }}>*</span>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Kenji Heilman</strong> captured bronze with 43 points across
              9 races, including a strong 12-point PR performance.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--card-border)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Season Totals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <StatBox label="PRs" value="14" />
            <StatBox label="AG/1st Time" value="16" />
            <StatBox label="Participation" value="55" />
            <StatBox label="Total Races" value="85" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WinnerCard({
  rank,
  name,
  points,
  races,
  efficiency,
  medal,
  borderColor,
  gradientFrom,
  gradientTo,
  nameColor,
  subtitleColor,
  statColor,
  bgColor,
  medalSize,
}: {
  rank: number;
  name: string;
  points: number;
  races: number;
  efficiency: number;
  medal: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  nameColor: string;
  subtitleColor: string;
  statColor: string;
  bgColor: string;
  medalSize: string;
}) {
  const rankOrdinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';

  return (
    <div
      className={`rounded-2xl overflow-hidden ${rank === 1 ? 'transform md:-translate-y-4' : ''}`}
      style={{ border: `2px solid ${borderColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
    >
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
      >
        <div className={`${medalSize} mb-2`}>
          {rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : '\u{1F949}'}
        </div>
        <div className="text-2xl font-extrabold" style={{ color: nameColor }}>
          {name}
        </div>
        <div className="text-sm font-medium mt-1" style={{ color: subtitleColor }}>
          {rankOrdinal} Place - {medal}
        </div>
      </div>
      <div className="px-6 py-4" style={{ backgroundColor: bgColor }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: statColor }}>{points}</div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: statColor }}>{races}</div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Races</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: statColor }}>{efficiency}</div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Eff</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--card-border)' }}>
      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
