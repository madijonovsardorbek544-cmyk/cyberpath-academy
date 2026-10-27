import { Router } from 'express';
import { caseAnswerSchema } from '@cyberpath/contracts';
import { casePointsFor, caseTotalPoints, isCaseAnswerCorrect, toPublicCase, type InvestigationCase } from '@cyberpath/contracts/cases';
import { findCase, listCases } from '../utils/caseCatalog.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { makeId, many, nowIso, one, run } from '../lib/db.js';

const router = Router();
router.use(requireAuth);

type ProgressRow = { question_id: string; attempts: number; points_awarded: number; solved_at: string | null };

function progressFor(userId: string, slug: string) {
  const rows = many<ProgressRow>('SELECT question_id, attempts, points_awarded, solved_at FROM case_progress WHERE user_id = ? AND case_slug = ?', userId, slug);
  return new Map(rows.map((row) => [row.question_id, row]));
}

function caseSummary(item: InvestigationCase, progress: Map<string, ProgressRow>) {
  const solved = item.questions.filter((question) => progress.get(question.id)?.solved_at).length;
  const pointsEarned = [...progress.values()].reduce((sum, row) => sum + Number(row.points_awarded), 0);
  return {
    solvedQuestions: solved,
    totalQuestions: item.questions.length,
    pointsEarned,
    totalPoints: caseTotalPoints(item),
    completed: solved === item.questions.length
  };
}

function caseDetail(item: InvestigationCase, userId: string) {
  const progress = progressFor(userId, item.slug);
  const summary = caseSummary(item, progress);
  const publicCase = toPublicCase(item);
  return {
    case: {
      ...publicCase,
      questions: publicCase.questions.map((question, index) => {
        const row = progress.get(question.id);
        return {
          ...question,
          attempts: Number(row?.attempts ?? 0),
          solved: Boolean(row?.solved_at),
          pointsAwarded: Number(row?.points_awarded ?? 0),
          explanation: row?.solved_at ? item.questions[index].explanation : null
        };
      }),
      debrief: summary.completed ? item.debrief : null
    },
    progress: summary
  };
}

router.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const cases = listCases().map((item) => {
    const { evidence, questions, story: _story, ...meta } = toPublicCase(item);
    return { ...meta, evidenceCount: evidence.length, questionCount: questions.length, progress: caseSummary(item, progressFor(userId, item.slug)) };
  });
  return res.json({ cases });
});

router.get('/:slug', (req: AuthenticatedRequest, res) => {
  const item = findCase(String(req.params.slug));
  if (!item) return res.status(404).json({ message: 'Case not found.' });
  return res.json(caseDetail(item, req.user!.userId));
});

router.post('/:slug/answer', (req: AuthenticatedRequest, res) => {
  const item = findCase(String(req.params.slug));
  if (!item) return res.status(404).json({ message: 'Case not found.' });
  const parsed = caseAnswerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Send a questionId and a non-empty answer.' });
  const question = item.questions.find((entry) => entry.id === parsed.data.questionId);
  if (!question) return res.status(404).json({ message: 'Question not found in this case.' });

  const userId = req.user!.userId;
  const existing = one<(ProgressRow & { id: string }) | null>('SELECT id, question_id, attempts, points_awarded, solved_at FROM case_progress WHERE user_id = ? AND case_slug = ? AND question_id = ?', userId, item.slug, question.id);
  if (existing?.solved_at) {
    return res.json({ correct: true, alreadySolved: true, pointsAwarded: Number(existing.points_awarded), ...caseDetail(item, userId) });
  }

  const correct = isCaseAnswerCorrect(question, parsed.data.answer);
  const attempts = Number(existing?.attempts ?? 0) + 1;
  const pointsAwarded = correct ? casePointsFor(question, attempts) : 0;
  const timestamp = nowIso();
  run(
    `INSERT INTO case_progress (id, user_id, case_slug, question_id, attempts, points_awarded, solved_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, case_slug, question_id) DO UPDATE SET attempts = excluded.attempts, points_awarded = excluded.points_awarded, solved_at = excluded.solved_at, updated_at = excluded.updated_at`,
    makeId(), userId, item.slug, question.id, attempts, pointsAwarded, correct ? timestamp : null, timestamp, timestamp
  );

  return res.json({ correct, alreadySolved: false, pointsAwarded, ...caseDetail(item, userId) });
});

export default router;
