import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { getStudentAnalytics } from '../utils/analytics.js';
import { createAuditLog } from '../utils/audit.js';
import { getStudentAssignments, getStudentMastery, getStudentPortfolio, syncMentorAlerts } from '../utils/learningIntelligence.js';
import { fromDbJson, makeId, many, mapCohort, mapMentorAlert, mapMentorAssignment, mapPortfolioArtifact, mapUser, nowIso, one, run, toDbJson, type Role } from '../lib/db.js';

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

const artifactFeedbackSchema = z.object({
  mentorFeedback: z.string().trim().min(6).max(2000),
  status: z.enum(['draft', 'in_review', 'published']).optional()
});

type AccessibleStudent = NonNullable<ReturnType<typeof mapUser>> & {
  analytics: Awaited<ReturnType<typeof getStudentAnalytics>>;
  mastery: Awaited<ReturnType<typeof getStudentMastery>>;
  portfolioCount: number;
  assignmentCount: number;
  labsCompleted: number;
  lastActiveAt: string;
  riskStatus: string;
  recommendedNextAction: string;
  cohort: ReturnType<typeof mapCohort> | null;
};

async function getAccessibleStudents(requestUser: AuthenticatedRequest['user']): Promise<AccessibleStudent[]> {
  const linkRows = requestUser!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_students WHERE mentor_id = ?', requestUser!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_students');

  const seen = new Set<string>();
  const students = await Promise.all(linkRows.map(async (link) => {
    const studentId = String(link.student_id);
    if (seen.has(studentId)) return null;
    seen.add(studentId);
    const userRow = one<Record<string, unknown> | null>('SELECT * FROM users WHERE id = ?', studentId);
    const user = mapUser(userRow);
    if (!user) return null;
    const [analytics, mastery] = await Promise.all([getStudentAnalytics(user.id), getStudentMastery(user.id)]);
    const portfolio = getStudentPortfolio(user.id);
    const assignments = getStudentAssignments(user.id);
    const labsCompleted = Number(one<{ value: number }>('SELECT COUNT(*) as value FROM lab_submissions WHERE user_id = ?', user.id)?.value ?? 0);
    const lastActivityRows = many<Record<string, unknown>>(
      `SELECT completed_at as value FROM lesson_progress WHERE user_id = ? AND completed_at IS NOT NULL
       UNION ALL SELECT created_at as value FROM quiz_attempts WHERE user_id = ?
       UNION ALL SELECT created_at as value FROM lab_submissions WHERE user_id = ?
       UNION ALL SELECT updated_at as value FROM portfolio_artifacts WHERE user_id = ?
       ORDER BY value DESC LIMIT 1`,
      user.id,
      user.id,
      user.id,
      user.id
    );
    const lastActiveAt = lastActivityRows[0]?.value ? String(lastActivityRows[0].value) : (user.createdAt ?? nowIso());
    const cohortRow = one<Record<string, unknown> | null>(
      `SELECT c.* FROM cohorts c
       JOIN cohort_members cm ON cm.cohort_id = c.id
       WHERE cm.user_id = ? LIMIT 1`,
      user.id
    );
    const riskStatus = getRiskStatus({ quizAverage: analytics.totalQuizAccuracy, completionRate: analytics.completionRate, lastActiveAt });
    return {
      ...user,
      analytics,
      mastery,
      portfolioCount: portfolio.length,
      assignmentCount: assignments.filter((item) => item.status !== 'done').length,
      labsCompleted,
      lastActiveAt,
      riskStatus,
      recommendedNextAction: getRecommendedNextAction(riskStatus, analytics.weakTopics.map((topic) => topic.topic), portfolio.length),
      cohort: cohortRow ? mapCohort(cohortRow) : null
    };
  }));

  return students.filter((student): student is AccessibleStudent => Boolean(student));
}

function getRiskStatus(input: { quizAverage: number; completionRate: number; lastActiveAt: string }) {
  const inactiveDays = Math.floor((Date.now() - new Date(input.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000));
  if (inactiveDays >= 10) return 'inactive';
  if (input.quizAverage > 0 && input.quizAverage < 60) return 'struggling';
  if (input.completionRate < 25 || input.quizAverage < 75) return 'needs attention';
  return 'on track';
}

function getRecommendedNextAction(riskStatus: string, weakTopics: string[], portfolioCount: number) {
  if (riskStatus === 'inactive') return 'Send reactivation message and assign one 20-minute starter lab.';
  if (riskStatus === 'struggling') return `Review ${weakTopics[0] ?? 'foundation concepts'} and require evidence-first corrections.`;
  if (riskStatus === 'needs attention') return 'Assign targeted review sprint and one mentor feedback checkpoint.';
  if (portfolioCount === 0) return 'Convert the next passed lab into a proof-of-work artifact.';
  return 'Publish or refine a portfolio artifact for school-ready evidence.';
}

function assertMentorCanAccessStudent(req: AuthenticatedRequest, studentId: string) {
  if (req.user!.role === 'admin') return true;
  return Boolean(one<Record<string, unknown> | null>('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ?', req.user!.userId, studentId));
}

async function buildCohortDashboard(req: AuthenticatedRequest) {
  const students = await getAccessibleStudents(req.user);
  const studentIds = students.map((student) => student.id);
  const placeholders = studentIds.map(() => '?').join(',');
  const activeThisWeek = students.filter((student) => Date.now() - new Date(student.lastActiveAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const inactiveStudents = students.filter((student) => student.riskStatus === 'inactive').length;
  const lessonsCompleted = studentIds.length ? Number(one<{ value: number }>(`SELECT COUNT(*) as value FROM lesson_progress WHERE completed = 1 AND user_id IN (${placeholders})`, ...studentIds)?.value ?? 0) : 0;
  const labsSubmitted = studentIds.length ? Number(one<{ value: number }>(`SELECT COUNT(*) as value FROM lab_submissions WHERE user_id IN (${placeholders})`, ...studentIds)?.value ?? 0) : 0;
  const portfolioArtifacts = studentIds.length ? Number(one<{ value: number }>(`SELECT COUNT(*) as value FROM portfolio_artifacts WHERE user_id IN (${placeholders})`, ...studentIds)?.value ?? 0) : 0;
  const openAssignments = req.user!.role === 'mentor'
    ? Number(one<{ value: number }>("SELECT COUNT(*) as value FROM mentor_assignments WHERE mentor_id = ? AND status != 'done'", req.user!.userId)?.value ?? 0)
    : Number(one<{ value: number }>("SELECT COUNT(*) as value FROM mentor_assignments WHERE status != 'done'")?.value ?? 0);

  const weakTopicCounts = new Map<string, number>();
  for (const student of students) {
    for (const topic of student.analytics.weakTopics) weakTopicCounts.set(topic.topic, (weakTopicCounts.get(topic.topic) ?? 0) + 1);
  }
  const weakTopicHeatmap = [...weakTopicCounts.entries()]
    .map(([topic, affectedStudents]) => ({ topic, affectedStudents, intensity: Math.min(100, Math.round((affectedStudents / Math.max(1, students.length)) * 100)) }))
    .sort((a, b) => b.affectedStudents - a.affectedStudents);

  const labSubmissions = studentIds.length ? many<Record<string, unknown>>(
    `SELECT ls.*, l.title as lab_title, l.slug as lab_slug, u.name as student_name
     FROM lab_submissions ls
     JOIN labs l ON l.id = ls.lab_id
     JOIN users u ON u.id = ls.user_id
     WHERE ls.user_id IN (${placeholders})
     ORDER BY ls.created_at DESC LIMIT 20`,
    ...studentIds
  ).map((row) => ({
    id: String(row.id),
    studentId: String(row.user_id),
    studentName: String(row.student_name),
    labId: String(row.lab_id),
    labTitle: String(row.lab_title),
    labSlug: String(row.lab_slug),
    score: Number(row.score),
    feedback: String(row.feedback),
    rubricResult: fromDbJson(row.rubric_result_json, {}),
    createdAt: String(row.created_at)
  })) : [];

  const artifactReviews = studentIds.length ? many<Record<string, unknown>>(
    `SELECT pa.*, u.name as student_name
     FROM portfolio_artifacts pa
     JOIN users u ON u.id = pa.user_id
     WHERE pa.user_id IN (${placeholders}) AND pa.status IN ('draft', 'in_review', 'published')
     ORDER BY CASE pa.status WHEN 'in_review' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, pa.updated_at DESC LIMIT 20`,
    ...studentIds
  ).map((row) => ({ ...mapPortfolioArtifact(row), studentName: String(row.student_name) })) : [];

  return {
    metrics: {
      totalStudents: students.length,
      activeThisWeek,
      inactiveStudents,
      lessonsCompleted,
      quizAverage: students.length ? Math.round(students.reduce((sum, student) => sum + student.analytics.totalQuizAccuracy, 0) / students.length) : 0,
      labsSubmitted,
      portfolioArtifactsCreated: portfolioArtifacts,
      weakTopics: weakTopicHeatmap.slice(0, 5).map((item) => item.topic),
      assignmentsDue: openAssignments,
      studentsNeedingHelp: students.filter((student) => student.riskStatus !== 'on track').length
    },
    students: students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      goalPath: student.goal ?? student.mastery[0]?.title ?? 'Cyber Foundations',
      lessonsCompleted: Math.round((student.analytics.completionRate / 100) * 24),
      quizAccuracy: student.analytics.totalQuizAccuracy,
      labsCompleted: student.labsCompleted,
      portfolioArtifacts: student.portfolioCount,
      lastActiveAt: student.lastActiveAt,
      riskStatus: student.riskStatus,
      recommendedNextAction: student.recommendedNextAction
    })),
    weakTopicHeatmap,
    inactiveAlerts: students.filter((student) => student.riskStatus === 'inactive').map((student) => ({ studentId: student.id, name: student.name, lastActiveAt: student.lastActiveAt, recommendedNextAction: student.recommendedNextAction })),
    labSubmissions,
    artifactReviews
  };
}

router.get('/students', async (req: AuthenticatedRequest, res) => {
  const students = await getAccessibleStudents(req.user);
  return res.json({ students });
});

router.get('/cohort-dashboard', async (req: AuthenticatedRequest, res) => {
  const dashboard = await buildCohortDashboard(req);
  res.json(dashboard);
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

  if (!assertMentorCanAccessStudent(req, parsed.data.studentId)) {
    return res.status(403).json({ message: 'You can only leave feedback for assigned students.' });
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

  const rows = req.user!.role === 'mentor'
    ? many<Record<string, unknown>>('SELECT * FROM mentor_alerts WHERE mentor_id = ? ORDER BY severity DESC, updated_at DESC', req.user!.userId)
    : many<Record<string, unknown>>('SELECT * FROM mentor_alerts ORDER BY severity DESC, updated_at DESC');
  const alerts = rows.map((row) => {
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
  if (!assertMentorCanAccessStudent(req, parsed.data.studentId)) {
    return res.status(403).json({ message: 'You can only assign work to assigned students.' });
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

router.patch('/artifacts/:id/review', (req: AuthenticatedRequest, res) => {
  const parsed = artifactFeedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid artifact review payload.' });
  const existing = one<Record<string, unknown> | null>('SELECT * FROM portfolio_artifacts WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ message: 'Artifact not found.' });
  if (!assertMentorCanAccessStudent(req, String(existing.user_id))) {
    return res.status(403).json({ message: 'You can only review artifacts for assigned students.' });
  }
  run(
    'UPDATE portfolio_artifacts SET mentor_feedback = ?, status = ?, updated_at = ? WHERE id = ?',
    parsed.data.mentorFeedback,
    parsed.data.status ?? String(existing.status),
    nowIso(),
    req.params.id
  );
  createAuditLog({ actorUserId: req.user!.userId, actorRole: req.user!.role as Role, action: 'mentor.artifact_reviewed', targetType: 'portfolio_artifact', targetId: String(req.params.id), metadata: { studentId: String(existing.user_id) } });
  res.json({ artifact: mapPortfolioArtifact(one<Record<string, unknown>>('SELECT * FROM portfolio_artifacts WHERE id = ?', req.params.id)) });
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
