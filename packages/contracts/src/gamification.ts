// XP, levels, streaks, weekly leagues and badges. Pure functions shared by the API and the mock demo.

export const XP_RULES = {
  lessonComplete: 50,
  quizPass: 30,
  labPass: 40,
  caseComplete: 50,
  exercisePerCorrect: 5,
  exerciseDailyCap: 50
} as const;

export const LEAGUE_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;
export const LEAGUE_GROUP_SIZE = 30;
export const LEAGUE_PROMOTE = 5;
export const LEAGUE_DEMOTE = 5;
/** Demotion only applies once a group is big enough that the bottom places mean something. */
export const LEAGUE_MIN_SIZE_FOR_DEMOTION = 10;

export type XpEvent = { key: string; label: string; xp: number; at: string };

export function levelForXp(xp: number) {
  // Level n starts at 50 * (n - 1)^2 XP: 0, 50, 200, 450, 800, ...
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
  const start = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, currentLevelXp: xp - start, nextLevelXp: next - start };
}

/** Monday 00:00 UTC of the week containing `date`, as YYYY-MM-DD. */
export function weekStartOf(date: Date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export function addDays(isoDay: string, days: number) {
  const day = new Date(`${isoDay}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

/**
 * Current streak in active days. Today not being active yet does not break it.
 * One missed day per Monday-start week is bridged by an automatic streak freeze.
 */
export function computeStreak(activeDays: Iterable<string>, today: string) {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  const frozenWeeks = new Set<string>();
  const freezesUsed: string[] = [];
  while (true) {
    if (days.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    const week = weekStartOf(new Date(`${cursor}T00:00:00Z`));
    if (current > 0 && !frozenWeeks.has(week) && days.has(addDays(cursor, -1))) {
      frozenWeeks.add(week);
      freezesUsed.push(cursor);
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return { current, activeToday: days.has(today), freezesUsed, freezeAvailableThisWeek: !frozenWeeks.has(weekStartOf(new Date(`${today}T00:00:00Z`))) };
}

/** Tier for next week given this week's rank in a group. */
export function nextTier(tier: number, rank: number, groupSize: number, weekXp: number) {
  if (weekXp > 0 && rank <= LEAGUE_PROMOTE) return Math.min(tier + 1, LEAGUE_TIERS.length - 1);
  if (groupSize >= LEAGUE_MIN_SIZE_FOR_DEMOTION && rank > groupSize - LEAGUE_DEMOTE) return Math.max(tier - 1, 0);
  return tier;
}

export type BadgeStats = {
  totalXp: number;
  lessonsCompleted: number;
  casesCompleted: number;
  totalCases: number;
  socShiftsWorked: number;
  perfectSocShift: boolean;
  streak: number;
};

export const badgeCatalog: Array<{ id: string; name: string; description: string; earned: (stats: BadgeStats) => boolean }> = [
  { id: 'first-lesson', name: 'First steps', description: 'Complete your first lesson.', earned: (s) => s.lessonsCompleted >= 1 },
  { id: 'lessons-10', name: 'Ten down', description: 'Complete 10 lessons.', earned: (s) => s.lessonsCompleted >= 10 },
  { id: 'lessons-25', name: 'Deep learner', description: 'Complete 25 lessons.', earned: (s) => s.lessonsCompleted >= 25 },
  { id: 'first-case', name: 'Case closed', description: 'Finish your first investigation.', earned: (s) => s.casesCompleted >= 1 },
  { id: 'all-cases', name: 'Lead investigator', description: 'Finish every investigation.', earned: (s) => s.totalCases > 0 && s.casesCompleted >= s.totalCases },
  { id: 'first-shift', name: 'On shift', description: 'Work a full SOC shift.', earned: (s) => s.socShiftsWorked >= 1 },
  { id: 'perfect-shift', name: 'Sharp eye', description: 'Get every verdict right in a SOC shift.', earned: (s) => s.perfectSocShift },
  { id: 'streak-7', name: 'One week strong', description: 'Reach a 7-day streak.', earned: (s) => s.streak >= 7 },
  { id: 'streak-30', name: 'Habit formed', description: 'Reach a 30-day streak.', earned: (s) => s.streak >= 30 },
  { id: 'xp-1000', name: '1,000 XP', description: 'Earn 1,000 XP.', earned: (s) => s.totalXp >= 1000 }
];

/** "Amina Student" -> "Amina S." so leaderboards do not expose full names. */
export function leaderboardName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Learner';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
