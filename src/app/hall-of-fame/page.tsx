export default function HallOfFamePage() {
  // 2025 top 3 from the leaderboard data:
  // 1st: Logan (65 pts, 7 races, 9.29 eff)
  // 2nd: C-Rich (53 pts, 9 races, 5.89 eff)
  // 3rd: MG (43 pts, 9 races, 4.78 eff)

  const winners = [
    {
      rank: 1,
      name: 'Logan',
      points: 65,
      races: 7,
      efficiency: 9.29,
      medal: 'Gold',
      gradient: 'from-yellow-300 via-yellow-400 to-amber-500',
      border: 'border-yellow-400',
      textColor: 'text-yellow-900',
      bgColor: 'bg-yellow-50',
      medalSize: 'text-6xl',
    },
    {
      rank: 2,
      name: 'C-Rich',
      points: 53,
      races: 9,
      efficiency: 5.89,
      medal: 'Silver',
      gradient: 'from-gray-200 via-gray-300 to-gray-400',
      border: 'border-gray-300',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      medalSize: 'text-5xl',
    },
    {
      rank: 3,
      name: 'MG',
      points: 43,
      races: 9,
      efficiency: 4.78,
      medal: 'Bronze',
      gradient: 'from-amber-500 via-amber-600 to-amber-700',
      border: 'border-amber-600',
      textColor: 'text-amber-900',
      bgColor: 'bg-amber-50',
      medalSize: 'text-5xl',
    },
  ];

  return (
    <div>
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">2025 Results</h1>
        <p className="text-base sm:text-xl text-gray-600 mt-1 sm:mt-2">Race for Gold Champions</p>
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

      <div className="bg-white rounded-xl shadow p-4 sm:p-8 max-w-2xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">2025 Season Highlights</h2>
        <div className="space-y-4 text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-xl mt-0.5">*</span>
            <p>
              <strong className="text-gray-800">Logan</strong> dominated the season with an incredible
              9.29 points-per-race efficiency across 7 races, racking up 65 total points to claim gold.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 text-xl mt-0.5">*</span>
            <p>
              <strong className="text-gray-800">C-Rich</strong> earned silver through sheer consistency,
              competing in 9 races and accumulating 53 points including a 16-point race.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-xl mt-0.5">*</span>
            <p>
              <strong className="text-gray-800">MG</strong> captured bronze with 43 points across
              9 races, including a strong 12-point PR performance.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Season Totals</h3>
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
  gradient,
  border,
  textColor,
  bgColor,
  medalSize,
}: {
  rank: number;
  name: string;
  points: number;
  races: number;
  efficiency: number;
  medal: string;
  gradient: string;
  border: string;
  textColor: string;
  bgColor: string;
  medalSize: string;
}) {
  const rankOrdinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';

  return (
    <div className={`rounded-2xl shadow-lg border-2 ${border} overflow-hidden ${rank === 1 ? 'transform md:-translate-y-4' : ''}`}>
      <div className={`bg-gradient-to-br ${gradient} px-6 py-8 text-center`}>
        <div className={`${medalSize} mb-2`}>
          {rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : '\u{1F949}'}
        </div>
        <div className={`text-2xl font-extrabold ${rank === 1 ? 'text-yellow-900' : rank === 2 ? 'text-gray-700' : 'text-amber-900'}`}>
          {name}
        </div>
        <div className={`text-sm font-medium mt-1 ${rank === 1 ? 'text-yellow-800' : rank === 2 ? 'text-gray-600' : 'text-amber-800'}`}>
          {rankOrdinal} Place - {medal}
        </div>
      </div>
      <div className={`${bgColor} px-6 py-4`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>{points}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Points</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>{races}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Races</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>{efficiency}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Eff</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}
