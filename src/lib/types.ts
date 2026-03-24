// Core data types for Race for Gold

export interface Runner {
  id: number;
  nickname: string;
  fullName: string;
  birthday: string; // ISO date
  age: number;
}

export const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile'
] as const;

export type Distance = typeof DISTANCES[number];

// Maps display distance names to DB keys (matching age_grading_factors table)
export const DISTANCE_KEYS: Record<Distance, string> = {
  '5k': '5 km',
  '4 mile': '4 Mile',
  '5 mile': '5 Mile',
  '10k': '10 km',
  '8 mile': '8 km',
  '15k': '15 km',
  '10 mile': '10 Mile',
  'Half Marathon': 'H. Mar',
  'Full Marathon': 'Marathon',
  '50k': '50 km',
  '50 Mile': '50 Mile',
  '100 Mile': '100 Mile',
};

// Points for an actual PR by distance index (0-11)
export const PR_POINTS = [8, 8, 9, 9, 11, 11, 12, 13, 16, 17, 18, 19];

// Points for AG PR / 1st-time distance by distance index (0-11)
export const AG_PR_POINTS = [6, 6, 7, 7, 8, 8, 9, 10, 12, 13, 14, 15];

// Participation points based on spreadsheet:
// Part. up to 5 mile = 1 (5k, 4mi, 5mi)
// Part. up to 8 mile = 2 (10k, 8mi)
// Part up to H_MAR = 3 (15k, 10mi, Half Marathon)
// Part up to Infinity = 4 (Full Marathon, 50k, 50 Mile, 100 Mile)
export function getParticipationPoints(distance: Distance): number {
  switch (distance) {
    case '5k':
    case '4 mile':
    case '5 mile':
      return 1;
    case '10k':
    case '8 mile':
      return 2;
    case '15k':
    case '10 mile':
    case 'Half Marathon':
      return 3;
    case 'Full Marathon':
    case '50k':
    case '50 Mile':
    case '100 Mile':
      return 4;
    default:
      return 1;
  }
}

// Calculate the points for a race result
// Scoring: no stacking — runner gets the highest applicable category:
//   1. Actual PR (beat their all-time best) → PR_POINTS
//   2. AG PR (beat their age-graded target) or 1st-time distance → AG_PR_POINTS
//   3. Participation only → getParticipationPoints
export function calculateRacePoints(
  distance: Distance,
  isPR: boolean,
  isAGPR: boolean,
  isFirstTimeDistance: boolean
): number {
  const distIdx = DISTANCES.indexOf(distance);
  if (isPR) {
    return PR_POINTS[distIdx];
  }
  if (isAGPR || isFirstTimeDistance) {
    return AG_PR_POINTS[distIdx];
  }
  return getParticipationPoints(distance);
}

export interface RunnerPR {
  runnerId: number;
  distance: string;
  prTime: number | null;       // seconds
  agPrTime: number | null;     // seconds
  agPrDate: string | null;     // ISO date
  ageAtAgPr: number | null;
  factorAtRace: number | null;
  agTime: number | null;       // seconds
  todaysFactor: number | null;
  target: number | null;       // seconds
}

export interface RaceResult {
  id: number;
  runnerId: number;
  raceName: string;
  raceDate: string;           // ISO date
  distance: Distance;
  finishTime: number;         // seconds
  pointsEarned: number;
  pointsType: 'PR' | 'AG_PR' | 'FIRST_TIME' | 'PARTICIPATION';
  raceNumber: number;         // chronological race # for the runner
  status: 'approved' | 'pending';
}

export interface PendingSubmission {
  id: number;
  runnerNickname: string;
  raceName: string;
  raceDate: string;
  distance: Distance;
  finishTime: number;         // seconds
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface LeaderboardEntry {
  runner: Runner;
  raceScores: number[];       // points per race, chronological
  totalPoints: number;
  efficiency: number | null;
  raceCount: number;
}

// Age grading factor lookup
export interface AgeGradingFactor {
  age: number;
  distance: string;
  factor: number;
}
