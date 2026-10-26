import { findInvestigationCase, investigationCases } from '@cyberpath/contracts/cases';
import { findSocShift } from '@cyberpath/contracts/soc';
import {
  LEAGUE_DEMOTE,
  LEAGUE_GROUP_SIZE,
  LEAGUE_MIN_SIZE_FOR_DEMOTION,
  LEAGUE_PROMOTE,
  LEAGUE_TIERS,
  XP_RULES,
  addDays,
  badgeCatalog,
  computeStreak,
  leaderboardName,
  levelForXp,
  nextTier,
  weekStartOf,
  type XpEvent
} from '@cyberpath/contracts/gamification';
import { count, db, makeId, many, nowIso, one, run } from '../lib/db.js';

type Row = Record<string, unknown>;

/** Rebuilds a learner's XP ledger from their activity. Idempotent: every event has a stable key. */
export function syncXp(userId: string) {
  const events: XpEvent[] = [];

  for (const row of many<Row>(`SELECT p.lesson_id, p.completed_at, l.title FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = ? AND p.completed = 1 AND p.completed_at IS NOT NULL`, userId)) {
    events.push({ key: `lesson:${row.lesson_id}`, label: `Completed lesson: ${row.title}`, xp: XP_RULES.lessonComplete, at: String(row.completed_at) });
  }
  for (const row of many<Row>(`SELECT q.lesson_id, MIN(q.created_at) AS at, l.title FROM quiz_attempts q JOIN lessons l ON l.id = q.lesson_id WHERE q.user_id = ? AND q.score >= 70 GROUP BY q.lesson_id`, userId)) {
    events.push({ key: `quiz:${row.lesson_id}`, label: `Passed quiz: ${row.title}`, xp: XP_RULES.quizPass, at: String(row.at) });
  }
  for (const row of many<Row>(`SELECT s.lab_id, MIN(s.created_at) AS at, l.title FROM lab_submissions s JOIN labs l ON l.id = s.lab_id WHERE s.user_id = ? AND s.score >= 60 GROUP BY s.lab_id`, userId)) {
    events.push({ key: `lab:${row.lab_id}`, label: `Passed lab: ${row.title}`, xp: XP_RULES.labPass, at: String(row.at) });
  }

  const solvedByCase = new Map<string, Row[]>();
  for (const row of many<Row>(`SELECT case_slug, question_id, points_awarded, solved_at FROM case_progress WHERE user_id = ? AND solved_at IS NOT NULL`, userId)) {
    const item = findInvestigationCase(String(row.case_slug));
    if (!item) continue;
    events.push({ key: `case:${row.case_slug}:${row.question_id}`, label: `Solved a question in "${item.title}"`, xp: Number(row.points_awarded), at: String(row.solved_at) });
    solvedByCase.set(item.slug, [...(solvedByCase.get(item.slug) ?? []), row]);
  }
  for (const [slug, rows] of solvedByCase) {
    const item = findInvestigationCase(slug)!;
    if (rows.length === item.questions.length) {
      const closedAt = rows.map((row) => String(row.solved_at)).sort().at(-1)!;
      events.push({ key: `case-complete:${slug}`, label: `Closed case "${item.title}"`, xp: XP_RULES.caseComplete, at: closedAt });
    }
  }

  const bestByShift = new Map<string, number>();
  for (const row of many<Row>(`SELECT id, shift_slug, score, created_at FROM soc_shift_attempts WHERE user_id = ? ORDER BY created_at ASC`, userId)) {
    const slug = String(row.shift_slug);
    const best = bestByShift.get(slug) ?? 0;
    const score = Number(row.score);
    // Only improvements earn XP, so replaying a shift cannot be farmed.
    if (score > best) {
      events.push({ key: `soc:${row.id}`, label: `New best on SOC shift "${findSocShift(slug)?.title ?? slug}"`, xp: score - best, at: String(row.created_at) });
      bestByShift.set(slug, score);
    }
  }

  for (const row of many<Row>(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS correct, MAX(created_at) AS at FROM skill_exercise_attempts WHERE user_id = ? AND is_correct = 1 GROUP BY day`, userId)) {
    events.push({ key: `exercises:${row.day}`, label: `Practice exercises (${row.correct} correct)`, xp: Math.min(Number(row.correct) * XP_RULES.exercisePerCorrect, XP_RULES.exerciseDailyCap), at: String(row.at) });
  }

  const upsert = db.prepare(`INSERT INTO xp_events (id, user_id, event_key, label, xp, earned_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, event_key) DO UPDATE SET label = excluded.label, xp = excluded.xp, earned_at = excluded.earned_at`);
  for (const event of events) upsert.run(makeId(), userId, event.key, event.label, event.xp, event.at);
}

function weekXp(userId: string, weekStart: string) {
  return count(`SELECT COALESCE(SUM(xp), 0) AS value FROM xp_events WHERE user_id = ? AND earned_at >= ? AND earned_at < ?`, userId, weekStart, addDays(weekStart, 7));
}

function groupStandings(groupId: string, weekStart: string) {
  const members = many<Row>('SELECT user_id FROM league_memberships WHERE group_id = ?', groupId);
  for (const member of members) syncXp(String(member.user_id));
  return many<Row>(`SELECT m.user_id, u.name, COALESCE(SUM(x.xp), 0) AS xp
    FROM league_memberships m JOIN users u ON u.id = m.user_id
    LEFT JOIN xp_events x ON x.user_id = m.user_id AND x.earned_at >= ? AND x.earned_at < ?
    WHERE m.group_id = ? GROUP BY m.user_id, u.name ORDER BY xp DESC, m.created_at ASC`, weekStart, addDays(weekStart, 7), groupId)
    .map((row, index) => ({ userId: String(row.user_id), name: leaderboardName(String(row.name)), xp: Number(row.xp), rank: index + 1 }));
}

function ensureMembership(userId: string, weekStart: string) {
  const existing = one<Row | null>('SELECT tier, group_id FROM league_memberships WHERE user_id = ? AND week_start = ?', userId, weekStart);
  if (existing) return { tier: Number(existing.tier), groupId: String(existing.group_id) };

  let tier = 0;
  const previous = one<Row | null>('SELECT week_start, tier, group_id FROM league_memberships WHERE user_id = ? AND week_start < ? ORDER BY week_start DESC LIMIT 1', userId, weekStart);
  if (previous) {
    tier = Number(previous.tier);
    if (String(previous.week_start) === addDays(weekStart, -7)) {
      const standings = groupStandings(String(previous.group_id), String(previous.week_start));
      const mine = standings.find((entry) => entry.userId === userId);
      if (mine) tier = nextTier(tier, mine.rank, standings.length, mine.xp);
    }
  }

  const open = one<Row | null>(`SELECT group_id FROM league_memberships WHERE week_start = ? AND tier = ? GROUP BY group_id HAVING COUNT(*) < ? ORDER BY group_id LIMIT 1`, weekStart, tier, LEAGUE_GROUP_SIZE);
  const groupId = open ? String(open.group_id) : `${weekStart}:${tier}:${count('SELECT COUNT(DISTINCT group_id) AS value FROM league_memberships WHERE week_start = ? AND tier = ?', weekStart, tier) + 1}`;
  run('INSERT INTO league_memberships (id, user_id, week_start, tier, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', makeId(), userId, weekStart, tier, groupId, nowIso());
  return { tier, groupId };
}

function badgeStats(userId: string, totalXp: number, streak: number) {
  const casesCompleted = investigationCases.filter((item) => count('SELECT COUNT(*) AS value FROM case_progress WHERE user_id = ? AND case_slug = ? AND solved_at IS NOT NULL', userId, item.slug) === item.questions.length).length;
  return {
    totalXp,
    lessonsCompleted: count('SELECT COUNT(*) AS value FROM lesson_progress WHERE user_id = ? AND completed = 1', userId),
    casesCompleted,
    totalCases: investigationCases.length,
    socShiftsWorked: count('SELECT COUNT(*) AS value FROM soc_shift_attempts WHERE user_id = ?', userId),
    perfectSocShift: count('SELECT COUNT(*) AS value FROM soc_shift_attempts WHERE user_id = ? AND correct_verdicts = total_alerts', userId) > 0,
    streak
  };
}

/** Awards newly earned badges and returns the full catalogue with earned dates. */
export function syncBadges(userId: string, totalXp: number, streak: number) {
  const stats = badgeStats(userId, totalXp, streak);
  for (const badge of badgeCatalog) {
    if (badge.earned(stats)) run('INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, ?)', makeId(), userId, badge.id, nowIso());
  }
  const earned = new Map(many<Row>('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?', userId).map((row) => [String(row.badge_id), String(row.earned_at)]));
  return badgeCatalog.map(({ earned: _earned, ...badge }) => ({ ...badge, earnedAt: earned.get(badge.id) ?? null }));
}

export function getLearnerProgress(userId: string, now = new Date()) {
  syncXp(userId);
  const today = now.toISOString().slice(0, 10);
  const weekStart = weekStartOf(now);
  const totalXp = count('SELECT COALESCE(SUM(xp), 0) AS value FROM xp_events WHERE user_id = ?', userId);
  const activeDays = many<Row>('SELECT DISTINCT substr(earned_at, 1, 10) AS day FROM xp_events WHERE user_id = ? AND xp > 0', userId).map((row) => String(row.day));
  const streak = computeStreak(activeDays, today);
  const recent = many<Row>('SELECT label, xp, earned_at FROM xp_events WHERE user_id = ? AND xp > 0 ORDER BY earned_at DESC LIMIT 10', userId)
    .map((row) => ({ label: String(row.label), xp: Number(row.xp), at: String(row.earned_at) }));

  const role = one<Row | null>('SELECT role FROM users WHERE id = ?', userId)?.role;
  let league = null;
  if (role === 'student') {
    const membership = ensureMembership(userId, weekStart);
    const standings = groupStandings(membership.groupId, weekStart);
    const mine = standings.find((entry) => entry.userId === userId)!;
    league = {
      tier: membership.tier,
      tierName: LEAGUE_TIERS[membership.tier],
      weekStart,
      weekEnds: addDays(weekStart, 7),
      rank: mine.rank,
      promoteCount: membership.tier < LEAGUE_TIERS.length - 1 ? LEAGUE_PROMOTE : 0,
      demoteCount: membership.tier > 0 && standings.length >= LEAGUE_MIN_SIZE_FOR_DEMOTION ? LEAGUE_DEMOTE : 0,
      members: standings.map(({ userId: memberId, ...entry }) => ({ ...entry, isMe: memberId === userId }))
    };
  }

  return {
    xp: { total: totalXp, thisWeek: weekXp(userId, weekStart), ...levelForXp(totalXp) },
    streak,
    league,
    badges: syncBadges(userId, totalXp, streak.current),
    recent
  };
}
