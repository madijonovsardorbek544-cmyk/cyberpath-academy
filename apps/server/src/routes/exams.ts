import crypto from 'node:crypto';
import { Router } from 'express';
import { examGradeSchema, examSaveSchema } from '@cyberpath/contracts';
import { analystExam, examPassed, examQuestionPoints, examReportPoints, gradeExamAnswers, scoreReport, toPublicExam } from '@cyberpath/contracts/exam';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { fromDbJson, makeId, many, nowIso, one, run, toDbJson } from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();
export const examVerifyRouter = Router();
router.use(requireAuth);

const exam = analystExam;
/** Saves arriving just after the deadline (slow network) are still accepted. */
const GRACE_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
type Row = Record<string, unknown>;

function newCertificateCode() {
  const hex = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `CPA1-${hex.slice(0, 5)}-${hex.slice(5)}`;
}

function submitAttempt(row: Row, at = nowIso()) {
  const graded = gradeExamAnswers(exam, fromDbJson<Record<string, string>>(row.answers_json, {}));
  run(`UPDATE exam_attempts SET status = 'submitted', submitted_at = ?, auto_json = ?, auto_score = ? WHERE id = ? AND status = 'in_progress'`, at, toDbJson(graded.sections), graded.total, row.id);
}

/** Loads an attempt and submits it automatically once its time is up. */
function loadAttempt(id: string) {
  const row = one<Row | null>('SELECT * FROM exam_attempts WHERE id = ?', id);
  if (row && row.status === 'in_progress' && Date.now() > Date.parse(String(row.deadline_at)) + GRACE_MS) {
    submitAttempt(row, String(row.deadline_at));
    return one<Row>('SELECT * FROM exam_attempts WHERE id = ?', id);
  }
  return row;
}

function attemptSummary(row: Row) {
  const graded = row.status === 'passed' || row.status === 'failed';
  return {
    id: String(row.id),
    status: String(row.status),
    startedAt: String(row.started_at),
    deadlineAt: String(row.deadline_at),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    totalScore: graded ? Number(row.auto_score) + Number(row.report_score) : null,
    certificateCode: row.certificate_code ? String(row.certificate_code) : null
  };
}

function attemptDetail(row: Row) {
  const graded = row.status === 'passed' || row.status === 'failed';
  return {
    ...attemptSummary(row),
    answers: fromDbJson<Record<string, string>>(row.answers_json, {}),
    report: String(row.report_text),
    exam: toPublicExam(exam),
    result: row.status === 'in_progress' ? null : {
      sections: fromDbJson<Array<{ id: string; title: string; earned: number; max: number }>>(row.auto_json, []),
      autoScore: Number(row.auto_score),
      autoMax: examQuestionPoints(exam),
      report: graded ? fromDbJson<Array<{ id: string; label: string; earned: number; max: number }>>(row.report_json, []) : null,
      reportScore: graded ? Number(row.report_score) : null,
      reportMax: examReportPoints(exam),
      reviewerNote: graded && row.reviewer_note ? String(row.reviewer_note) : null,
      passed: row.status === 'passed'
    }
  };
}

function ownAttempt(req: AuthenticatedRequest) {
  const row = loadAttempt(String(req.params.id));
  return row && String(row.user_id) === req.user!.userId ? row : null;
}

router.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  for (const row of many<Row>(`SELECT id FROM exam_attempts WHERE user_id = ? AND status = 'in_progress'`, userId)) loadAttempt(String(row.id));
  const attempts = many<Row>('SELECT * FROM exam_attempts WHERE user_id = ? AND exam_slug = ? ORDER BY started_at DESC', userId, exam.slug);
  const active = attempts.find((row) => row.status === 'in_progress');
  const pending = attempts.find((row) => row.status === 'submitted');
  const passed = attempts.find((row) => row.status === 'passed');
  const lastFail = attempts.find((row) => row.status === 'failed');
  const cooldownUntil = lastFail?.reviewed_at ? new Date(Date.parse(String(lastFail.reviewed_at)) + exam.retakeCooldownDays * DAY_MS).toISOString() : null;
  const blockedReason = active ? null
    : passed ? 'You have already passed this exam.'
    : pending ? 'Your last attempt is waiting for a mentor to grade the report.'
    : cooldownUntil && cooldownUntil > nowIso() ? `You can retake the exam after ${cooldownUntil.slice(0, 10)}.`
    : null;

  return res.json({
    exam: {
      slug: exam.slug, title: exam.title, summary: exam.summary, scenario: exam.scenario, durationMinutes: exam.durationMinutes,
      passMark: exam.passMark, reportPassMark: exam.reportPassMark, retakeCooldownDays: exam.retakeCooldownDays,
      sections: exam.sections.map((section) => ({ id: section.id, title: section.title, questionCount: section.questions.length })),
      questionPoints: examQuestionPoints(exam), reportPoints: examReportPoints(exam), rubric: exam.report.rubric
    },
    attempts: attempts.map(attemptSummary),
    activeAttemptId: active ? String(active.id) : null,
    canStart: !active && !blockedReason,
    blockedReason
  });
});

router.post('/:slug/start', (req: AuthenticatedRequest, res) => {
  if (String(req.params.slug) !== exam.slug) return res.status(404).json({ message: 'Exam not found.' });
  const userId = req.user!.userId;
  for (const row of many<Row>(`SELECT id FROM exam_attempts WHERE user_id = ? AND status = 'in_progress'`, userId)) loadAttempt(String(row.id));
  const active = one<Row | null>(`SELECT * FROM exam_attempts WHERE user_id = ? AND exam_slug = ? AND status = 'in_progress'`, userId, exam.slug);
  if (active) return res.json({ attempt: attemptDetail(active) });
  const blocking = one<Row | null>(`SELECT status, reviewed_at FROM exam_attempts WHERE user_id = ? AND exam_slug = ? AND status IN ('submitted', 'passed') LIMIT 1`, userId, exam.slug);
  if (blocking) return res.status(409).json({ message: blocking.status === 'passed' ? 'You have already passed this exam.' : 'Your last attempt is still waiting for grading.' });
  const lastFail = one<Row | null>(`SELECT reviewed_at FROM exam_attempts WHERE user_id = ? AND exam_slug = ? AND status = 'failed' ORDER BY reviewed_at DESC LIMIT 1`, userId, exam.slug);
  if (lastFail && Date.now() < Date.parse(String(lastFail.reviewed_at)) + exam.retakeCooldownDays * DAY_MS) {
    return res.status(409).json({ message: `Retakes open ${exam.retakeCooldownDays} days after a graded attempt.` });
  }

  const id = makeId();
  const started = new Date();
  run(
    `INSERT INTO exam_attempts (id, user_id, exam_slug, status, started_at, deadline_at) VALUES (?, ?, ?, 'in_progress', ?, ?)`,
    id, userId, exam.slug, started.toISOString(), new Date(started.getTime() + exam.durationMinutes * 60 * 1000).toISOString()
  );
  return res.status(201).json({ attempt: attemptDetail(one<Row>('SELECT * FROM exam_attempts WHERE id = ?', id)) });
});

router.get('/review', requireRole(['mentor', 'admin']), (_req, res) => {
  const rows = many<Row>(`SELECT a.*, u.name AS candidate_name FROM exam_attempts a JOIN users u ON u.id = a.user_id WHERE a.status = 'submitted' ORDER BY a.submitted_at ASC`);
  return res.json({
    rubric: exam.report.rubric,
    reportPrompt: exam.report.prompt,
    attempts: rows.map((row) => ({ ...attemptSummary(row), candidate: String(row.candidate_name), report: String(row.report_text), autoScore: Number(row.auto_score), autoMax: examQuestionPoints(exam), sections: fromDbJson(row.auto_json, []) }))
  });
});

router.get('/attempts/:id', (req: AuthenticatedRequest, res) => {
  const row = ownAttempt(req);
  if (!row) return res.status(404).json({ message: 'Attempt not found.' });
  return res.json({ attempt: attemptDetail(row) });
});

router.patch('/attempts/:id', (req: AuthenticatedRequest, res) => {
  const row = ownAttempt(req);
  if (!row) return res.status(404).json({ message: 'Attempt not found.' });
  if (row.status !== 'in_progress') return res.status(409).json({ message: 'Time is up. This attempt has been submitted.' });
  const parsed = examSaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid answers.' });
  const validKeys = new Set(exam.sections.flatMap((section) => section.questions.map((question) => `${section.id}.${question.id}`)));
  const answers = { ...fromDbJson<Record<string, string>>(row.answers_json, {}) };
  for (const [key, value] of Object.entries(parsed.data.answers ?? {})) if (validKeys.has(key)) answers[key] = value;
  run('UPDATE exam_attempts SET answers_json = ?, report_text = ? WHERE id = ?', toDbJson(answers), parsed.data.report ?? String(row.report_text), row.id);
  return res.json({ attempt: attemptDetail(one<Row>('SELECT * FROM exam_attempts WHERE id = ?', row.id)) });
});

router.post('/attempts/:id/submit', (req: AuthenticatedRequest, res) => {
  const row = ownAttempt(req);
  if (!row) return res.status(404).json({ message: 'Attempt not found.' });
  if (row.status === 'in_progress') {
    // When time is up the client submits whatever is saved, even a short report.
    const timeUp = Date.now() >= Date.parse(String(row.deadline_at));
    if (!timeUp && String(row.report_text).trim().length < exam.report.minLength) {
      return res.status(400).json({ message: `Write at least ${exam.report.minLength} characters in the incident report before submitting.` });
    }
    submitAttempt(row);
  }
  return res.json({ attempt: attemptDetail(one<Row>('SELECT * FROM exam_attempts WHERE id = ?', row.id)) });
});

router.post('/attempts/:id/grade', requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  const row = one<Row | null>('SELECT * FROM exam_attempts WHERE id = ?', String(req.params.id));
  if (!row) return res.status(404).json({ message: 'Attempt not found.' });
  if (String(row.user_id) === req.user!.userId) return res.status(403).json({ message: 'You cannot grade your own exam.' });
  if (row.status !== 'submitted') return res.status(409).json({ message: 'Only submitted attempts can be graded.' });
  const parsed = examGradeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid grade.' });

  const report = scoreReport(exam, parsed.data.scores);
  const passed = examPassed(exam, Number(row.auto_score), report.total);
  run(
    `UPDATE exam_attempts SET status = ?, report_json = ?, report_score = ?, reviewer_id = ?, reviewer_note = ?, reviewed_at = ?, certificate_code = ? WHERE id = ?`,
    passed ? 'passed' : 'failed', toDbJson(report.criteria), report.total, req.user!.userId, parsed.data.note, nowIso(), passed ? newCertificateCode() : null, row.id
  );
  createAuditLog({ actorUserId: req.user!.userId, action: `exam.${passed ? 'pass' : 'fail'}`, targetType: 'exam_attempt', targetId: String(row.id), metadata: { autoScore: Number(row.auto_score), reportScore: report.total } });
  return res.json({ attempt: attemptDetail(one<Row>('SELECT * FROM exam_attempts WHERE id = ?', row.id)) });
});

// Public: employers check a certificate code without signing in. Shows the minimum needed to verify.
examVerifyRouter.get('/:code', (req, res) => {
  const row = one<Row | null>(`SELECT a.*, u.name AS candidate_name FROM exam_attempts a JOIN users u ON u.id = a.user_id WHERE a.certificate_code = ? AND a.status = 'passed'`, String(req.params.code).trim().toUpperCase());
  if (!row) return res.status(404).json({ message: 'No passed exam matches this code.' });
  return res.json({
    certificate: { code: String(row.certificate_code), name: String(row.candidate_name), exam: exam.title, passedAt: String(row.reviewed_at), score: Number(row.auto_score) + Number(row.report_score) }
  });
});

export default router;
