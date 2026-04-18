import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  count,
  makeId,
  many,
  mapAuditLog,
  mapEmail,
  mapFeedback,
  mapLab,
  mapLesson,
  mapUser,
  nowIso,
  one,
  run,
  toDbJson
} from '../lib/db.js';
import { createAuditLog } from '../utils/audit.js';

const router = Router();

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const lessonSchema = z.object({
  slug: z.string().trim().min(3).max(120),
  title: z.string().trim().min(3).max(160),
  phase: z.number().int().min(1).max(5),
  phaseTitle: z.string().trim().min(3).max(120),
  level: z.string().trim().min(3).max(80),
  orderIndex: z.number().int().min(1),
  specialization: z.string().trim().min(2).max(120).optional().nullable(),
  learningObjectives: z.array(z.string().min(2)).min(1),
  content: z.string().min(20),
  glossary: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })),
  examples: z.array(z.string().min(2)).min(1),
  knowledgeChecks: z.array(z.string().min(2)).min(1),
  commonMistakes: z.string().min(10),
  whyItMatters: z.string().min(10),
  estimatedMinutes: z.number().int().min(5).max(240).optional(),
  icon: z.string().min(2).max(40).optional()
});

const lessonPatchSchema = lessonSchema.partial().extend({
  changeSummary: z.string().min(4).max(280).optional(),
  reviewDueAt: z.string().datetime().optional().nullable(),
  lastReviewedAt: z.string().datetime().optional().nullable()
});

const labSchema = z.object({
  slug: z.string().trim().min(3).max(120),
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(3).max(80),
  difficulty: z.string().trim().min(3).max(80),
  description: z.string().min(20),
  dataset: z.any(),
  tasks: z.array(z.object({ id: z.string().min(2), prompt: z.string().min(2), expectedKeywords: z.array(z.string().min(1)).min(1) })).min(1),
  safeGuardrails: z.string().min(10),
  solutionOutline: z.string().min(10)
});

const labPatchSchema = labSchema.partial();

router.use(requireAuth, requireRole(['admin']));

router.get('/overview', (req: AuthenticatedRequest, res) => {
  const users = many<Record<string, unknown>>('SELECT * FROM users ORDER BY created_at DESC').map((row) => mapUser(row));
  const lessons = many<Record<string, unknown>>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC').map(mapLesson);
  const labs = many<Record<string, unknown>>('SELECT * FROM labs ORDER BY title ASC').map(mapLab);

  const attemptsCount = count('SELECT COUNT(*) as value FROM quiz_attempts');
  const feedbackCount = count('SELECT COUNT(*) as value FROM mentor_feedback');
  const completedCount = count('SELECT COUNT(*) as value FROM lesson_progress WHERE completed = 1');
  const completionRate = lessons.length && users.length ? Math.round((completedCount / (lessons.length * users.length)) * 100) : 0;

  const platformFeedback = many<Record<string, unknown>>('SELECT * FROM platform_feedback ORDER BY created_at DESC LIMIT 12').map(mapFeedback);
  const emailOutbox = many<Record<string, unknown>>('SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 12').map(mapEmail);
  const auditLogs = many<Record<string, unknown>>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20').map(mapAuditLog);

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.overview_viewed', targetType: 'dashboard' });

  return res.json({
    stats: {
      users: users.length,
      students: users.filter((user) => user?.role === 'student').length,
      mentors: users.filter((user) => user?.role === 'mentor').length,
      admins: users.filter((user) => user?.role === 'admin').length,
      lessons: lessons.length,
      labs: labs.length,
      attempts: attemptsCount,
      feedbackItems: feedbackCount,
      completionRate,
      openPlatformFeedback: count("SELECT COUNT(*) as value FROM platform_feedback WHERE status = 'new'"),
      queuedEmails: count("SELECT COUNT(*) as value FROM email_outbox WHERE status = 'queued'")
    },
    users,
    lessons,
    labs,
    platformFeedback,
    emailOutbox,
    auditLogs
  });
});

router.post('/lessons', (req: AuthenticatedRequest, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid lesson payload.', errors: parsed.error.flatten() });
  }

  const now = nowIso();
  const id = makeId();
  run(
    `INSERT INTO lessons (id, slug, title, phase, phase_title, level, order_index, specialization, estimated_minutes, learning_objectives, content, glossary, examples, knowledge_checks, common_mistakes, why_it_matters, icon, version, last_reviewed_at, review_due_at, reviewed_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    id,
    parsed.data.slug,
    parsed.data.title,
    parsed.data.phase,
    parsed.data.phaseTitle,
    parsed.data.level,
    parsed.data.orderIndex,
    parsed.data.specialization ?? null,
    parsed.data.estimatedMinutes ?? 20,
    toDbJson(parsed.data.learningObjectives),
    parsed.data.content,
    toDbJson(parsed.data.glossary),
    toDbJson(parsed.data.examples),
    toDbJson(parsed.data.knowledgeChecks),
    parsed.data.commonMistakes,
    parsed.data.whyItMatters,
    parsed.data.icon ?? 'shield',
    now,
    addDays(90),
    req.user!.userId,
    now,
    now
  );

  run(
    `INSERT INTO lesson_revisions (id, lesson_id, version, snapshot_json, change_summary, created_by, created_at)
     VALUES (?, ?, 1, ?, ?, ?, ?)`,
    makeId(),
    id,
    toDbJson({ slug: parsed.data.slug, title: parsed.data.title, phase: parsed.data.phase, phaseTitle: parsed.data.phaseTitle, level: parsed.data.level }),
    'Initial lesson creation',
    req.user!.userId,
    now
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lesson_created', targetType: 'lesson', targetId: id, metadata: { slug: parsed.data.slug } });
  const lesson = mapLesson(one<Record<string, unknown>>('SELECT * FROM lessons WHERE id = ?', id));
  return res.status(201).json({ lesson });
});

router.patch('/lessons/:id', (req: AuthenticatedRequest, res) => {
  const parsed = lessonPatchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return res.status(400).json({ message: 'Invalid lesson update payload.', errors: parsed.success ? undefined : parsed.error.flatten() });
  }

  const existing = one<Record<string, unknown> | null>('SELECT * FROM lessons WHERE id = ?', String(req.params.id));
  if (!existing) {
    return res.status(404).json({ message: 'Lesson not found.' });
  }

  const current = mapLesson(existing);
  const merged = {
    ...current,
    ...parsed.data,
    learningObjectives: parsed.data.learningObjectives ?? current.learningObjectives,
    glossary: parsed.data.glossary ?? current.glossary,
    examples: parsed.data.examples ?? current.examples,
    knowledgeChecks: parsed.data.knowledgeChecks ?? current.knowledgeChecks,
    phaseTitle: parsed.data.phaseTitle ?? current.phaseTitle,
    orderIndex: parsed.data.orderIndex ?? current.orderIndex,
    estimatedMinutes: parsed.data.estimatedMinutes ?? current.estimatedMinutes,
    commonMistakes: parsed.data.commonMistakes ?? current.commonMistakes,
    whyItMatters: parsed.data.whyItMatters ?? current.whyItMatters,
    icon: parsed.data.icon ?? current.icon
  };

  const updatedAt = nowIso();
  const nextVersion = Number(existing.version ?? current.version ?? 1) + 1;
  run(
    `UPDATE lessons SET slug = ?, title = ?, phase = ?, phase_title = ?, level = ?, order_index = ?, specialization = ?, estimated_minutes = ?, learning_objectives = ?, content = ?, glossary = ?, examples = ?, knowledge_checks = ?, common_mistakes = ?, why_it_matters = ?, icon = ?, version = ?, last_reviewed_at = ?, review_due_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?`,
    merged.slug,
    merged.title,
    merged.phase,
    merged.phaseTitle,
    merged.level,
    merged.orderIndex,
    merged.specialization,
    merged.estimatedMinutes,
    toDbJson(merged.learningObjectives),
    merged.content,
    toDbJson(merged.glossary),
    toDbJson(merged.examples),
    toDbJson(merged.knowledgeChecks),
    merged.commonMistakes,
    merged.whyItMatters,
    merged.icon,
    nextVersion,
    parsed.data.lastReviewedAt ?? updatedAt,
    parsed.data.reviewDueAt === undefined ? addDays(90) : (parsed.data.reviewDueAt ?? null),
    req.user!.userId,
    updatedAt,
    String(req.params.id)
  );

  run(
    `INSERT INTO lesson_revisions (id, lesson_id, version, snapshot_json, change_summary, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    makeId(),
    String(req.params.id),
    nextVersion,
    toDbJson(existing),
    parsed.data.changeSummary ?? `Updated fields: ${Object.keys(parsed.data).join(', ')}`,
    req.user!.userId,
    updatedAt
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lesson_updated', targetType: 'lesson', targetId: String(req.params.id), metadata: { fields: Object.keys(parsed.data) } });
  const lesson = mapLesson(one<Record<string, unknown>>('SELECT * FROM lessons WHERE id = ?', String(req.params.id)));
  return res.json({ lesson });
});

router.get('/lessons/:id/revisions', (req: AuthenticatedRequest, res) => {
  const revisions = many<Record<string, unknown>>('SELECT * FROM lesson_revisions WHERE lesson_id = ? ORDER BY version DESC', String(req.params.id));
  return res.json({ revisions });
});

router.delete('/lessons/:id', (req: AuthenticatedRequest, res) => {
  const existing = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE id = ?', String(req.params.id));
  if (!existing) {
    return res.status(404).json({ message: 'Lesson not found.' });
  }
  run('DELETE FROM lessons WHERE id = ?', String(req.params.id));
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lesson_deleted', targetType: 'lesson', targetId: String(req.params.id) });
  return res.json({ message: 'Lesson deleted.' });
});

router.post('/labs', (req: AuthenticatedRequest, res) => {
  const parsed = labSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid lab payload.', errors: parsed.error.flatten() });
  }

  const id = makeId();
  run(
    `INSERT INTO labs (id, slug, title, category, difficulty, description, dataset, tasks, safe_guardrails, solution_outline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    parsed.data.slug,
    parsed.data.title,
    parsed.data.category,
    parsed.data.difficulty,
    parsed.data.description,
    toDbJson(parsed.data.dataset),
    toDbJson(parsed.data.tasks),
    parsed.data.safeGuardrails,
    parsed.data.solutionOutline
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lab_created', targetType: 'lab', targetId: id, metadata: { slug: parsed.data.slug } });
  const lab = mapLab(one<Record<string, unknown>>('SELECT * FROM labs WHERE id = ?', id));
  return res.status(201).json({ lab });
});

router.patch('/labs/:id', (req: AuthenticatedRequest, res) => {
  const parsed = labPatchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return res.status(400).json({ message: 'Invalid lab update payload.', errors: parsed.success ? undefined : parsed.error.flatten() });
  }

  const existingRow = one<Record<string, unknown> | null>('SELECT * FROM labs WHERE id = ?', String(req.params.id));
  if (!existingRow) {
    return res.status(404).json({ message: 'Lab not found.' });
  }
  const existing = mapLab(existingRow);
  const merged = { ...existing, ...parsed.data };

  run(
    `UPDATE labs SET slug = ?, title = ?, category = ?, difficulty = ?, description = ?, dataset = ?, tasks = ?, safe_guardrails = ?, solution_outline = ? WHERE id = ?`,
    merged.slug,
    merged.title,
    merged.category,
    merged.difficulty,
    merged.description,
    toDbJson(merged.dataset),
    toDbJson(merged.tasks),
    merged.safeGuardrails,
    merged.solutionOutline,
    String(req.params.id)
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lab_updated', targetType: 'lab', targetId: String(req.params.id), metadata: { fields: Object.keys(parsed.data) } });
  const lab = mapLab(one<Record<string, unknown>>('SELECT * FROM labs WHERE id = ?', String(req.params.id)));
  return res.json({ lab });
});

router.delete('/labs/:id', (req: AuthenticatedRequest, res) => {
  const existing = one<Record<string, unknown> | null>('SELECT id FROM labs WHERE id = ?', String(req.params.id));
  if (!existing) {
    return res.status(404).json({ message: 'Lab not found.' });
  }
  run('DELETE FROM labs WHERE id = ?', String(req.params.id));
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.lab_deleted', targetType: 'lab', targetId: String(req.params.id) });
  return res.json({ message: 'Lab deleted.' });
});

router.patch('/users/:id/role', (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ role: z.enum(['student', 'mentor', 'admin']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  const existing = one<Record<string, unknown> | null>('SELECT * FROM users WHERE id = ?', String(req.params.id));
  if (!existing) {
    return res.status(404).json({ message: 'User not found.' });
  }

  run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', parsed.data.role, nowIso(), String(req.params.id));
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'admin.user_role_updated', targetType: 'user', targetId: String(req.params.id), metadata: { role: parsed.data.role } });
  const user = mapUser(one<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', String(req.params.id)));
  return res.json({ user });
});

router.get('/ops', (_req, res) => {
  const feedback = many<Record<string, unknown>>('SELECT * FROM platform_feedback ORDER BY created_at DESC LIMIT 30').map(mapFeedback);
  const emails = many<Record<string, unknown>>('SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 30').map(mapEmail);
  const auditLogs = many<Record<string, unknown>>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').map(mapAuditLog);
  return res.json({ feedback, emails, auditLogs });
});

export default router;
