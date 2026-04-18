import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { getStudentAnalytics } from '../utils/analytics.js';
import { createAuditLog } from '../utils/audit.js';
import { getStudentAssignments, getStudentMastery, getStudentPortfolio, syncMentorAlerts } from '../utils/learningIntelligence.js';
import { makeId, many, mapCohort, mapMentorAlert, mapMentorAssignment, mapUser, nowIso, one, run, toDbJson } from '../lib/db.js';

const router = Router();

router.use(requireAuth, requireRole(['mentor', 'admin']));

const assignmentSchema = z.object({
  studentId: z.string().min(2),
  title: z.string().min(4).max(140),
  instructions: z.string().min(12).max(2000),
  lessonId: z.string().optional().nullable(),
  trackSlug: z.string().optional().nullable(),
  targetMastery: z.number().int().min(0).max(100).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  rubric: z.array(z.string().min(2)).max(8).optional()
});
const assignmentPatchSchema = z.object({
  status: z.enum(['open', 'in_progress', 'done']).optional(),
  instructions: z.string().min(12).max(2000).optional(),
  targetMastery: z.number().int().min(0).max(100).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  rubric: z.array(z.string().min(2)).max(8).optional()
});

async function getAccessibleStudents(requestUser: AuthenticatedRequest['user']) {
  const linkRows = requestUser!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_students WHERE mentor_id = ?', requestUser!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_students');

  const students = await Promise.all(linkRows.map(async (link) => {
    const userRow = one<Record<string, unknown> | null>('SELECT * FROM users WHERE id = ?', String(link.student_id));
    const user = mapUser(userRow);
    if (!user) return null;
    const [analytics, mastery] = await Promise.all([getStudentAnalytics(user.id), getStudentMastery(user.id)]);
    const portfolio = getStudentPortfolio(user.id);
    const assignments = getStudentAssignments(user.id);
    const cohortRow = one<Record<string, unknown> | null>(
      `SELECT c.* FROM cohorts c
       JOIN cohort_members cm ON cm.cohort_id = c.id
       WHERE cm.user_id = ? LIMIT 1`,
      user.id
    );
    return { ...user, analytics, mastery, portfolioCount: portfolio.length, assignmentCount: assignments.filter((item) => item.status !== 'done').length, cohort: cohortRow ? mapCohort(cohortRow) : null };
  }));

  return students.filter(Boolean);
}

router.get('/students', async (req: AuthenticatedRequest, res) => {
  const students = await getAccessibleStudents(req.user);
  return res.json({ students });
});

router.get('/feedback', (req: AuthenticatedRequest, res) => {
  const feedbackRows = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_feedback WHERE mentor_id = ? ORDER BY created_at DESC', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_feedback ORDER BY created_at DESC');

  const feedback = feedbackRows.map((row) => {
    const student = one<Record<string, unknown> | null>('SELECT name, email FROM users WHERE id = ?', String(row.student_id));
    return {
      id: String(row.id),
      mentorId: String(row.mentor_id),
      studentId: String(row.student_id),
      message: String(row.message),
      createdAt: String(row.created_at),
      student: student ? { name: String(student.name), email: String(student.email) } : null
    };
  });

  return res.json({ feedback });
});

router.post('/feedback', (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    studentId: z.string().min(2),
    message: z.string().min(10).max(1000)
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid feedback payload.' });
  }

  const student = one<Record<string, unknown> | null>('SELECT id FROM users WHERE id = ? AND role = ?', parsed.data.studentId, 'student');
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  if (req.user!.role === 'mentor') {
    const assignment = one<Record<string, unknown> | null>('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ?', req.user!.userId, parsed.data.studentId);
    if (!assignment) {
      return res.status(403).json({ message: 'You can only leave feedback for assigned students.' });
    }
  }

  const id = makeId();
  run(
    `INSERT INTO mentor_feedback (id, mentor_id, student_id, message, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    req.user!.userId,
    parsed.data.studentId,
    parsed.data.message,
    nowIso()
  );

  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'mentor.feedback_created', targetType: 'mentor_feedback', targetId: id, metadata: { studentId: parsed.data.studentId } });
  const feedback = one<Record<string, unknown>>('SELECT * FROM mentor_feedback WHERE id = ?', id);
  return res.status(201).json({ feedback });
});

router.get('/alerts', async (req: AuthenticatedRequest, res) => {
  const assignments = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_students WHERE mentor_id = ?', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_students');

  for (const assignment of assignments) {
    const cohortLink = one<Record<string, unknown> | null>(
      `SELECT c.id FROM cohorts c
       JOIN cohort_members cm ON cm.cohort_id = c.id
       WHERE c.mentor_id = ? AND cm.user_id = ? LIMIT 1`,
      req.user!.role === 'mentor' ? req.user!.userId : String(assignment.mentor_id),
      String(assignment.student_id)
    );
    await syncMentorAlerts(String(assignment.student_id), req.user!.role === 'mentor' ? req.user!.userId : String(assignment.mentor_id), cohortLink ? String(cohortLink.id) : null);
  }

  const alertRows = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_alerts WHERE mentor_id = ? OR mentor_id IS NULL ORDER BY updated_at DESC', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_alerts ORDER BY updated_at DESC');

  const alerts = alertRows.map((row) => {
    const student = one<Record<string, unknown> | null>('SELECT name, email FROM users WHERE id = ?', String(row.student_id));
    return { ...mapMentorAlert(row), student: student ? { name: String(student.name), email: String(student.email) } : null };
  });

  res.json({ alerts });
});

router.patch('/alerts/:id', (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ status: z.enum(['open', 'reviewing', 'resolved']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid alert status.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM mentor_alerts WHERE id = ?', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Alert not found.' });
  }
  if (req.user!.role === 'mentor' && existing.mentor_id && String(existing.mentor_id) !== req.user!.userId) {
    return res.status(403).json({ message: 'You can only update your own alerts.' });
  }
  run('UPDATE mentor_alerts SET status = ?, updated_at = ? WHERE id = ?', parsed.data.status, nowIso(), req.params.id);
  res.json({ alert: mapMentorAlert(one<Record<string, unknown>>('SELECT * FROM mentor_alerts WHERE id = ?', req.params.id)) });
});


router.get('/assignments', (req: AuthenticatedRequest, res) => {
  const rows = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_assignments WHERE mentor_id = ? ORDER BY updated_at DESC', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_assignments ORDER BY updated_at DESC');
  const assignments = rows.map((row) => {
    const student = one<Record<string, unknown> | null>('SELECT name, email FROM users WHERE id = ?', String(row.student_id));
    return { ...mapMentorAssignment(row), student: student ? { name: String(student.name), email: String(student.email) } : null };
  });
  res.json({ assignments });
});

router.post('/assignments', (req: AuthenticatedRequest, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid assignment payload.' });
  }
  const student = one<Record<string, unknown> | null>('SELECT id FROM users WHERE id = ? AND role = ?', parsed.data.studentId, 'student');
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }
  if (req.user!.role === 'mentor') {
    const assignment = one<Record<string, unknown> | null>('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ?', req.user!.userId, parsed.data.studentId);
    if (!assignment) {
      return res.status(403).json({ message: 'You can only assign work to assigned students.' });
    }
  }
  const now = nowIso();
  const id = makeId();
  run(
    `INSERT INTO mentor_assignments (id, mentor_id, student_id, lesson_id, track_slug, title, instructions, target_mastery, due_at, status, rubric_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
    id,
    req.user!.userId,
    parsed.data.studentId,
    parsed.data.lessonId ?? null,
    parsed.data.trackSlug ?? null,
    parsed.data.title,
    parsed.data.instructions,
    parsed.data.targetMastery ?? null,
    parsed.data.dueAt ?? null,
    toDbJson(parsed.data.rubric ?? []),
    now,
    now
  );
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role, action: 'mentor.assignment_created', targetType: 'mentor_assignment', targetId: id, metadata: { studentId: parsed.data.studentId } });
  res.status(201).json({ assignment: mapMentorAssignment(one<Record<string, unknown>>('SELECT * FROM mentor_assignments WHERE id = ?', id)) });
});

router.patch('/assignments/:id', (req: AuthenticatedRequest, res) => {
  const parsed = assignmentPatchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return res.status(400).json({ message: 'Invalid assignment update.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM mentor_assignments WHERE id = ?', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Assignment not found.' });
  }
  if (req.user!.role === 'mentor' && String(existing.mentor_id) !== req.user!.userId) {
    return res.status(403).json({ message: 'You can only update your own assignments.' });
  }
  run(
    `UPDATE mentor_assignments SET
      instructions = ?,
      target_mastery = ?,
      due_at = ?,
      status = ?,
      rubric_json = ?,
      updated_at = ?
     WHERE id = ?`,
    parsed.data.instructions ?? String(existing.instructions),
    parsed.data.targetMastery === undefined ? (existing.target_mastery ?? null) : (parsed.data.targetMastery ?? null),
    parsed.data.dueAt === undefined ? (existing.due_at ?? null) : (parsed.data.dueAt ?? null),
    parsed.data.status ?? String(existing.status),
    toDbJson(parsed.data.rubric ?? JSON.parse(String(existing.rubric_json ?? '[]'))),
    nowIso(),
    req.params.id
  );
  res.json({ assignment: mapMentorAssignment(one<Record<string, unknown>>('SELECT * FROM mentor_assignments WHERE id = ?', req.params.id)) });
});

router.get('/cohorts', async (req: AuthenticatedRequest, res) => {
  const cohortRows = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM cohorts WHERE mentor_id = ? ORDER BY created_at DESC', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM cohorts ORDER BY created_at DESC');

  const cohorts = await Promise.all(cohortRows.map(async (row) => {
    const cohort = mapCohort(row);
    const members = many<Record<string, unknown>>(
      `SELECT u.id, u.name, u.email, cm.membership_role FROM cohort_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.cohort_id = ?
       ORDER BY u.name ASC`,
      cohort.id
    );
    return {
      ...cohort,
      members: members.map((member) => ({ id: String(member.id), name: String(member.name), email: String(member.email), membershipRole: String(member.membership_role) })),
      memberCount: members.length
    };
  }));

  res.json({ cohorts });
});

export default router;
