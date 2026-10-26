import { Router } from 'express';
import { caseTotalPoints } from '@cyberpath/contracts/cases';
import { annualEvent, eventSchedule } from '@cyberpath/contracts/event';
import { leaderboardName } from '@cyberpath/contracts/gamification';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { many } from '../lib/db.js';
import { eventStartsOn } from '../utils/caseCatalog.js';

const router = Router();
router.use(requireAuth);

type StandingRow = { user_id: string; name: string; points: number; solved: number; last_solved_at: string };

router.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const schedule = eventSchedule(annualEvent, eventStartsOn(), new Date());
  const slugs = annualEvent.days.map((item) => item.slug);
  const marks = slugs.map(() => '?').join(', ');

  const mine = many<{ case_slug: string; points: number; solved: number }>(
    `SELECT case_slug, SUM(points_awarded) AS points, COUNT(*) AS solved FROM case_progress
     WHERE user_id = ? AND solved_at IS NOT NULL AND case_slug IN (${marks}) GROUP BY case_slug`,
    userId, ...slugs
  );
  const mineBySlug = new Map(mine.map((row) => [row.case_slug, row]));

  // Only solves before closesAt count, so the leaderboard freezes while the days stay open for practice.
  const standings = many<StandingRow>(
    `SELECT p.user_id, u.name, SUM(p.points_awarded) AS points, COUNT(*) AS solved, MAX(p.solved_at) AS last_solved_at
     FROM case_progress p JOIN users u ON u.id = p.user_id
     WHERE p.solved_at IS NOT NULL AND p.solved_at < ? AND p.case_slug IN (${marks})
     GROUP BY p.user_id ORDER BY points DESC, last_solved_at ASC`,
    schedule.closesAt, ...slugs
  );
  const ranked = standings.map((row, index) => ({ rank: index + 1, userId: row.user_id, name: leaderboardName(row.name), points: Number(row.points), solved: Number(row.solved) }));
  const me = ranked.find((row) => row.userId === userId) ?? null;

  return res.json({
    event: { slug: annualEvent.slug, title: annualEvent.title, summary: annualEvent.summary, startsAt: schedule.startsAt, closesAt: schedule.closesAt, status: schedule.status },
    days: schedule.days.map((day, index) => {
      const item = annualEvent.days[index];
      const progress = mineBySlug.get(item.slug);
      return {
        ...day,
        // Titles stay hidden until a day unlocks so the schedule does not spoil the topics.
        title: day.unlocked ? item.title : `Day ${day.day}`,
        summary: day.unlocked ? item.summary : null,
        category: day.unlocked ? item.category : null,
        totalPoints: caseTotalPoints(item),
        pointsEarned: Number(progress?.points ?? 0),
        completed: Number(progress?.solved ?? 0) === item.questions.length
      };
    }),
    leaderboard: ranked.slice(0, 20).map(({ userId: id, ...row }) => ({ ...row, isMe: id === userId })),
    me: me ? { rank: me.rank, points: me.points, solved: me.solved } : null
  });
});

export default router;
