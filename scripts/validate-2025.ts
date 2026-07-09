/**
 * Validate 2025 RFG calculations against spreadsheet data.
 *
 * This script reverse-engineers the 2025 season to verify our point calculations match.
 * Run with: npx tsx scripts/validate-2025.ts
 */
import * as XLSX from 'xlsx';
import path from 'path';

const EXCEL_PATH = path.join(process.cwd(), 'data', 'SMRC_Incentive_Master_2025.xlsx');

// Point values by distance
const DISTANCES = ['5k', '4 mile', '5 mile', '10k', '8 mile', '15k', '10 mile', 'H_MAR', 'F_MAR', '50k/H_IM', '50m/IM', '100mile'];

const PARTICIPATION_POINTS: Record<string, number> = {
  '5k': 1, '4 mile': 1, '5 mile': 1,
  '10k': 2, '8 mile': 2,
  '15k': 3, '10 mile': 3, 'H_MAR': 3,
  'F_MAR': 4, '50k/H_IM': 4, '50m/IM': 4, '100mile': 4
};

const AG_PR_POINTS: Record<string, number> = {
  '5k': 6, '4 mile': 6, '5 mile': 7, '10k': 7,
  '8 mile': 8, '15k': 8, '10 mile': 9, 'H_MAR': 10,
  'F_MAR': 12, '50k/H_IM': 13, '50m/IM': 14, '100mile': 15
};

const PR_POINTS: Record<string, number> = {
  '5k': 8, '4 mile': 8, '5 mile': 9, '10k': 9,
  '8 mile': 11, '15k': 11, '10 mile': 12, 'H_MAR': 13,
  'F_MAR': 16, '50k/H_IM': 17, '50m/IM': 18, '100mile': 19
};

interface RaceResult {
  who: string;
  race: string;
  date: number;
  pts: number;
  type: 'PR' | 'AG_PR' | 'PART';
}

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  totalPts: number;
  efficiency: number;
  raceCount: number;
  racePoints: number[];
}

// Normalize runner names (fix typos and variations in spreadsheet)
function normalizeName(name: string): string {
  const n = name.trim();
  const map: Record<string, string> = {
    'Crich': 'Cindy', 'CRich': 'Cindy',
    'Logan ': 'Logan',
    'Jmill': 'J-Mill', 'JMill': 'J-Mill',
    'Jod Durt': 'Joe Durt',  // Typo in spreadsheet
    'Flyin': 'Flyin Brian',
    'Mdub': 'M-Dub',
    'DMac': 'Dmac'
  };
  return map[n] || n;
}

function main() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const lb = wb.Sheets['Leaderboard'];
  const lbData = XLSX.utils.sheet_to_json(lb, { header: 1 }) as unknown[][];

  // Extract expected leaderboard
  const expected: LeaderboardEntry[] = [];
  for (let r = 2; r < 30; r++) {
    const row = lbData[r];
    if (!row || !row[1]) continue;

    const nickname = row[1] as string;
    const racePoints: number[] = [];
    for (let c = 2; c <= 20; c++) {
      if (row[c] && typeof row[c] === 'number' && row[c] > 0) {
        racePoints.push(row[c] as number);
      }
    }
    const totalPts = (row[21] as number) || 0;
    const efficiency = (row[22] as number) || 0;

    expected.push({
      rank: r - 1,
      nickname,
      totalPts,
      efficiency,
      raceCount: racePoints.length,
      racePoints
    });
  }

  // Extract race logs - the logs contain ALL races, not specific to the row's runner
  const prLog: RaceResult[] = [];
  const agLog: RaceResult[] = [];
  const partLog: RaceResult[] = [];

  for (let r = 2; r < 70; r++) {
    const row = lbData[r];
    if (!row) continue;

    // True PR Log (cols 26-29)
    if (row[26] && row[27] && row[28] && typeof row[29] === 'number') {
      prLog.push({
        who: normalizeName(row[26] as string),
        race: row[27] as string,
        date: row[28] as number,
        pts: row[29] as number,
        type: 'PR'
      });
    }

    // AG PR / 1st Time (cols 31-34)
    if (row[31] && row[32] && row[33] && typeof row[34] === 'number') {
      agLog.push({
        who: normalizeName(row[31] as string),
        race: row[32] as string,
        date: row[33] as number,
        pts: row[34] as number,
        type: 'AG_PR'
      });
    }

    // Participation (multiple column sets)
    const partCols = [[36, 39], [41, 44], [46, 49], [51, 54]];
    for (const [start, end] of partCols) {
      if (row[start] && row[start + 1] && row[start + 2] && typeof row[end] === 'number') {
        partLog.push({
          who: normalizeName(row[start] as string),
          race: row[start + 1] as string,
          date: row[start + 2] as number,
          pts: row[end] as number,
          type: 'PART'
        });
      }
    }
  }

  console.log('=== 2025 RFG Validation ===\n');
  console.log('Scoring Tables:');
  console.log('Distance'.padEnd(12), 'Part'.padStart(4), 'AG PR'.padStart(6), '  PR'.padStart(4));
  console.log('-'.repeat(30));
  for (const dist of DISTANCES) {
    console.log(
      dist.padEnd(12),
      String(PARTICIPATION_POINTS[dist]).padStart(4),
      String(AG_PR_POINTS[dist]).padStart(6),
      String(PR_POINTS[dist]).padStart(4)
    );
  }

  console.log('\n=== Race Logs Extracted ===');
  console.log(`True PRs: ${prLog.length}`);
  console.log(`AG PRs / 1st Time: ${agLog.length}`);
  console.log(`Participation: ${partLog.length}`);
  console.log(`Total logged races: ${prLog.length + agLog.length + partLog.length}`);

  // Combine all races by runner (already normalized)
  const allRaces = [...prLog, ...agLog, ...partLog];
  const byRunner = new Map<string, RaceResult[]>();

  for (const race of allRaces) {
    if (!byRunner.has(race.who)) byRunner.set(race.who, []);
    byRunner.get(race.who)!.push(race);
  }

  // Deduplicate races (same runner + race + date + type)
  for (const [runner, races] of byRunner) {
    const seen = new Set<string>();
    const deduped: RaceResult[] = [];
    for (const r of races) {
      const key = `${r.race}|${r.date}|${r.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }
    byRunner.set(runner, deduped);
  }

  console.log('\n=== Calculated vs Expected ===');
  console.log('Runner'.padEnd(12), 'Calc'.padStart(5), 'Exp'.padStart(5), 'Match'.padStart(6), 'Races');
  console.log('-'.repeat(45));

  let matches = 0;
  let mismatches = 0;

  for (const exp of expected) {
    if (exp.totalPts === 0) continue;

    const races = byRunner.get(exp.nickname) || [];
    const calcPts = races.reduce((sum, r) => sum + r.pts, 0);
    const match = calcPts === exp.totalPts;

    if (match) {
      matches++;
      console.log(
        exp.nickname.padEnd(12),
        String(calcPts).padStart(5),
        String(exp.totalPts).padStart(5),
        '✓'.padStart(6),
        races.length
      );
    } else {
      mismatches++;
      console.log(
        exp.nickname.padEnd(12),
        String(calcPts).padStart(5),
        String(exp.totalPts).padStart(5),
        '✗'.padStart(6),
        races.length
      );
      // Show breakdown for mismatches
      console.log(`  Expected races: ${exp.raceCount}, Found: ${races.length}`);
      console.log(`  Race details:`, races.map(r => `${r.race}(${r.pts}/${r.type})`).join(', '));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Matches: ${matches}`);
  console.log(`Mismatches: ${mismatches}`);
  console.log(`Accuracy: ${((matches / (matches + mismatches)) * 100).toFixed(1)}%`);

  // Validate point calculations for specific races
  console.log('\n=== Point Validation Spot Checks ===');

  // Check a few PR races
  const prChecks = prLog.slice(0, 5);
  console.log('\nTrue PR races:');
  for (const r of prChecks) {
    const raceName = r.race.toLowerCase();
    let expectedDist = '';
    if (raceName.includes('marathon') || raceName.includes('26.2')) expectedDist = 'F_MAR';
    else if (raceName.includes('half') || raceName.includes('hlaf')) expectedDist = 'H_MAR';
    else if (raceName.includes('15k')) expectedDist = '15k';
    else if (raceName.includes('10k')) expectedDist = '10k';
    else if (raceName.includes('5k')) expectedDist = '5k';

    const expPts = expectedDist ? PR_POINTS[expectedDist] : '?';
    const match = expPts === r.pts ? '✓' : '✗';
    console.log(`  ${r.who}: ${r.race} = ${r.pts} pts (expected ${expPts} for ${expectedDist}) ${match}`);
  }

  // Check AG PR races
  const agChecks = agLog.slice(0, 5);
  console.log('\nAG PR / 1st Time races:');
  for (const r of agChecks) {
    const raceName = r.race.toLowerCase();
    let expectedDist = '';
    if (raceName.includes('marathon')) expectedDist = 'F_MAR';
    else if (raceName.includes('half')) expectedDist = 'H_MAR';
    else if (raceName.includes('15k')) expectedDist = '15k';
    else if (raceName.includes('10k')) expectedDist = '10k';
    else if (raceName.includes('5k') || raceName.includes('pump')) expectedDist = '5k';

    const expPts = expectedDist ? AG_PR_POINTS[expectedDist] : '?';
    const match = expPts === r.pts ? '✓' : '✗';
    console.log(`  ${r.who}: ${r.race} = ${r.pts} pts (expected ${expPts} for ${expectedDist}) ${match}`);
  }
}

main();
