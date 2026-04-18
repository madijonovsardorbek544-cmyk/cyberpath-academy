import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { buildRoadmap } from '../utils/roadmap.js';
import { getStudentAnalytics } from '../utils/analytics.js';
import {
  fromDbJson,
  makeId,
  many,
  mapCapstone,
  mapLab,
  mapLesson,
  mapMistake,
  mapPortfolioArtifact,
  mapQuestion,
  mapUser,
  mapTrack,
  nowIso,
  one,
  run,
  toDbJson
} from '../lib/db.js';
import {
  claimEligibleCertificates,
  getDueReviewItems,
  getGuidedProjects,
  getLearnerProjects,
  getPracticeHub,
  getStudentAssignments,
  getStudentCertificates,
  getStudentCohort,
  getStudentMastery,
  getStudentPortfolio,
  getStudentRecommendations,
  getTracks,
  reviewItemOutcome,
  upsertReviewItem
} from '../utils/learningIntelligence.js';

const router = Router();

const onboardingSchema = z.object({
  goal: z.string().min(2).max(80),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  score: z.number().min(0).max(100)
});

const lessonCompleteSchema = z.object({
  completed: z.boolean(),
  timeSpentMinutes: z.number().min(0).max(1000)
});

const quizSubmitSchema = z.object({
  lessonId: z.string().min(2),
  answers: z.record(z.any()),
  timeSpentMinutes: z.number().min(0).max(1000).default(0)
});

const labSubmitSchema = z.object({ answers: z.record(z.any()) });
const sessionSchema = z.object({ minutes: z.number().min(1).max(240), lessonId: z.string().optional() });
const portfolioSchema = z.object({
  title: z.string().min(3).max(120),
  artifactType: z.enum(['incident-report', 'risk-register', 'secure-code-review', 'iam-review', 'executive-summary', 'capstone-plan']),
  specialization: z.string().min(2).max(80),
  summary: z.string().min(20).max(2000),
  deliverables: z.array(z.string().min(2)).min(1).max(10),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable()
});
const portfolioPatchSchema = portfolioSchema.partial().extend({
  status: z.enum(['draft', 'in_review', 'published']).optional(),
  mentorFeedback: z.string().max(1000).optional().nullable()
});

const reviewOutcomeSchema = z.object({ success: z.boolean() });
const learnerProjectPatchSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'in_review', 'done']).optional(),
  checkpointProgress: z.array(z.string().min(1)).optional(),
  reflection: z.string().max(2000).optional().nullable(),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable()
});
const assignmentStudentPatchSchema = z.object({ status: z.enum(['open', 'in_progress', 'done']) });

router.use(requireAuth);

function isAnswerCorrect(expectedValue: unknown, actualValue: unknown, type: string) {
  if (type === 'multi-select') {
    const expected = [...((expectedValue as string[]) || [])].sort();
    const actual = [...(((actualValue as string[]) || []))].sort();
    return JSON.stringify(expected) === JSON.stringify(actual);
  }

  if (type === 'short-response') {
    return String(expectedValue || '').trim().toLowerCase() === String(actualValue || '').trim().toLowerCase();
  }

  if (type === 'matching') {
    const expectedObj = (expectedValue as Record<string, unknown>) || {};
    const actualObj = (actualValue as Record<string, unknown>) || {};
    const expected = JSON.stringify(expectedObj, Object.keys(expectedObj).sort());
    const actual = JSON.stringify(actualObj, Object.keys(actualObj).sort());
    return expected === actual;
  }

  return JSON.stringify(expectedValue) === JSON.stringify(actualValue);
}

function getLessonProgress(userId: string, lessonId: string) {
  return one<Record<string, unknown> | null>('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', userId, lessonId);
}

router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const analytics = await getStudentAnalytics(userId);
  const lessons = many<Record<string, unknown>>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC LIMIT 4');
  const nextLessons = lessons.map((lessonRow) => {
    const lesson = mapLesson(lessonRow);
    const progress = getLessonProgress(userId, lesson.id);
    return {
      ...lesson,
      completed: Number(progress?.completed ?? 0) === 1,
      timeSpentMinutes: Number(progress?.time_spent_minutes ?? 0)
    };
  });

  const roadmapRow = one<Record<string, unknown> | null>('SELECT roadmap_json FROM users WHERE id = ?', userId);
  const feedbackRows = many<Record<string, unknown>>('SELECT id, message, created_at FROM mentor_feedback WHERE student_id = ? ORDER BY created_at DESC LIMIT 3', userId);
  const capstones = many<Record<string, unknown>>('SELECT * FROM capstone_ideas ORDER BY title ASC LIMIT 5').map(mapCapstone);
  const mastery = await getStudentMastery(userId);
  const recommendationSignals = await getStudentRecommendations(userId);
  const recommendations = recommendationSignals.map((item, index) => ({
    id: `rec-${index + 1}`,
    title: item.title,
    reason: item.reason,
    actionType: item.action.toLowerCase().includes('artifact') ? 'portfolio' : item.action.toLowerCase().includes('quiz') ? 'quiz' : item.action.toLowerCase().includes('lab') ? 'lab' : 'lesson',
    actionTarget: item.action,
    priority: item.urgency
  }));
  const certificates = getStudentCertificates(userId);
  const portfolio = getStudentPortfolio(userId);
  const cohort = getStudentCohort(userId);
  const assignments = getStudentAssignments(userId);
  const dueReviews = getDueReviewItems(userId);
  const guidedProjects = getGuidedProjects();
  const learnerProjects = getLearnerProjects(userId);
  const practiceHub = await getPracticeHub(userId);
  const tracks = getTracks().map((track) => ({
    ...track,
    lessonCount: many<Record<string, unknown>>('SELECT id FROM track_lesson_links WHERE track_id = ?', track.id).length
  }));

  return res.json({
    analytics,
    roadmap: roadmapRow ? fromDbJson(roadmapRow.roadmap_json, null) : null,
    nextLessons,
    mentorFeedback: feedbackRows.map((row) => ({ id: String(row.id), message: String(row.message), createdAt: String(row.created_at) })),
    capstones,
    mastery,
    recommendations,
    certificates,
    portfolio,
    cohort,
    assignments,
    dueReviews,
    guidedProjects,
    learnerProjects,
    tracks,
    practiceHub
  });
});

router.get('/practice-hub', async (req: AuthenticatedRequest, res) => {
  const practiceHub = await getPracticeHub(req.user!.userId);
  return res.json({ practiceHub });
});

router.post('/onboarding', (req: AuthenticatedRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid onboarding payload.', errors: parsed.error.flatten() });
  }

  const roadmap = buildRoadmap(parsed.data.goal, parsed.data.experienceLevel, parsed.data.score);
  run(
    'UPDATE users SET goal = ?, experience_level = ?, placement_score = ?, roadmap_json = ?, updated_at = ? WHERE id = ?',
    parsed.data.goal,
    parsed.data.experienceLevel,
    parsed.data.score,
    toDbJson(roadmap),
    nowIso(),
    req.user!.userId
  );

  const user = mapUser(one<Record<string, unknown>>('SELECT * FROM users WHERE id = ?', req.user!.userId));
  return res.json({ user, roadmap });
});

router.get('/paths', (_req, res) => {
  const lessonRows = many<Record<string, unknown>>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC');
  const lessons = lessonRows.map(mapLesson);
  const capstones = many<Record<string, unknown>>('SELECT * FROM capstone_ideas ORDER BY title ASC').map(mapCapstone);
  const glossary = many<Record<string, unknown>>('SELECT * FROM glossary_terms ORDER BY term ASC LIMIT 30').map((row) => ({
    id: String(row.id),
    term: String(row.term),
    definition: String(row.definition),
    category: String(row.category)
  }));
  const labs = many<Record<string, unknown>>('SELECT * FROM labs ORDER BY title ASC LIMIT 8').map(mapLab);
  const guidedProjects = getGuidedProjects();
  const tracks = getTracks().map((track) => {
    const links = many<Record<string, unknown>>('SELECT lesson_id, competency, weight FROM track_lesson_links WHERE track_id = ?', track.id);
    const mappedLinks = links.map((link) => ({ lessonId: String(link.lesson_id), competency: String(link.competency), weight: Number(link.weight) }));
    return {
      ...track,
      lessonCount: links.length,
      competencies: mappedLinks,
      lessonLinks: mappedLinks
    };
  });

  const phases = Array.from(new Set(lessons.map((lesson) => lesson.phase))).map((phase) => ({
    phase,
    title: lessons.find((lesson) => lesson.phase === phase)?.phaseTitle,
    lessons: lessons.filter((lesson) => lesson.phase === phase)
  }));

  return res.json({ phases, capstones, glossary, labs, tracks, guidedProjects });
});

router.get('/lessons', (req: AuthenticatedRequest, res) => {
  const lessons = many<Record<string, unknown>>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC').map((lessonRow) => {
    const lesson = mapLesson(lessonRow);
    const progress = getLessonProgress(req.user!.userId, lesson.id);
    return {
      ...lesson,
      completed: Number(progress?.completed ?? 0) === 1,
      timeSpentMinutes: Number(progress?.time_spent_minutes ?? 0)
    };
  });

  return res.json({ lessons });
});

router.get('/lessons/:slug', (req: AuthenticatedRequest, res) => {
  const lessonRow = one<Record<string, unknown> | null>('SELECT * FROM lessons WHERE slug = ?', req.params.slug);
  if (!lessonRow) {
    return res.status(404).json({ message: 'Lesson not found.' });
  }

  const lesson = mapLesson(lessonRow);
  const progress = getLessonProgress(req.user!.userId, lesson.id);
  const quizQuestions = many<Record<string, unknown>>('SELECT * FROM quiz_questions WHERE lesson_id = ? ORDER BY created_at ASC', lesson.id).map(mapQuestion);
  const relatedTracks = many<Record<string, unknown>>(
    `SELECT st.* FROM specialization_tracks st
     JOIN track_lesson_links tll ON tll.track_id = st.id
     WHERE tll.lesson_id = ?
     ORDER BY st.title ASC`,
    lesson.id
  ).map(mapTrack);

  const revisionCount = many<Record<string, unknown>>('SELECT id FROM lesson_revisions WHERE lesson_id = ?', lesson.id).length;
  return res.json({
    lesson: {
      ...lesson,
      quizQuestions,
      relatedTracks,
      revisionCount,
      completed: Number(progress?.completed ?? 0) === 1,
      timeSpentMinutes: Number(progress?.time_spent_minutes ?? 0)
    }
  });
});

router.post('/lessons/:id/complete', (req: AuthenticatedRequest, res) => {
  const parsed = lessonCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid lesson completion payload.' });
  }

  const lessonExists = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE id = ?', req.params.id);
  if (!lessonExists) {
    return res.status(404).json({ message: 'Lesson not found.' });
  }

  const now = nowIso();
  run(
    `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at, time_spent_minutes, last_opened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       completed = excluded.completed,
       completed_at = CASE WHEN excluded.completed = 1 THEN excluded.completed_at ELSE NULL END,
       time_spent_minutes = lesson_progress.time_spent_minutes + excluded.time_spent_minutes,
       last_opened_at = excluded.last_opened_at`,
    makeId(),
    req.user!.userId,
    req.params.id,
    parsed.data.completed ? 1 : 0,
    parsed.data.completed ? now : null,
    parsed.data.timeSpentMinutes,
    now
  );

  const lessonRow = one<Record<string, unknown> | null>('SELECT title, phase_title FROM lessons WHERE id = ?', req.params.id);
  if (lessonRow) {
    upsertReviewItem({
      userId: req.user!.userId,
      sourceType: 'lesson',
      sourceId: String(req.params.id),
      topic: String(lessonRow.phase_title),
      subtopic: String(lessonRow.title),
      prompt: `Revisit the key rule from ${String(lessonRow.title)}.`,
      success: parsed.data.completed
    });
  }

  const progress = one<Record<string, unknown>>('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', req.user!.userId, req.params.id);
  return res.json({ progress });
});

router.post('/study-session', (req: AuthenticatedRequest, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid study session payload.' });
  }

  if (parsed.data.lessonId) {
    const lessonExists = one<Record<string, unknown> | null>('SELECT id FROM lessons WHERE id = ?', parsed.data.lessonId);
    if (!lessonExists) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const now = nowIso();
    run(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, time_spent_minutes, last_opened_at)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         time_spent_minutes = lesson_progress.time_spent_minutes + excluded.time_spent_minutes,
         last_opened_at = excluded.last_opened_at`,
      makeId(),
      req.user!.userId,
      parsed.data.lessonId,
      parsed.data.minutes,
      now
    );
  }

  return res.json({ message: 'Study time recorded.' });
});

router.post('/quizzes/submit', (req: AuthenticatedRequest, res) => {
  const parsed = quizSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid quiz submission payload.' });
  }

  const questionRows = many<Record<string, unknown>>('SELECT * FROM quiz_questions WHERE lesson_id = ? ORDER BY created_at ASC', parsed.data.lessonId);
  const questions = questionRows.map(mapQuestion);
  if (!questions.length) {
    return res.status(404).json({ message: 'No quiz found for this lesson.' });
  }

  let correct = 0;
  const topicScores: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const review: Array<Record<string, unknown>> = [];
  const now = nowIso();

  for (const question of questions) {
    const actualValue = parsed.data.answers[question.id];
    const correctAnswer = isAnswerCorrect(question.answer, actualValue, question.type);
    if (correctAnswer) correct += 1;

    topicCounts[question.topic] = (topicCounts[question.topic] || 0) + 1;
    topicScores[question.topic] = (topicScores[question.topic] || 0) + (correctAnswer ? 100 : 0);

    if (!correctAnswer) {
      const existingMistake = one<Record<string, unknown> | null>('SELECT * FROM mistakes WHERE user_id = ? AND question_id = ?', req.user!.userId, question.id);
      if (existingMistake) {
        run(
          'UPDATE mistakes SET repeat_count = repeat_count + 1, last_seen_at = ?, user_answer = ?, correct_answer = ? WHERE id = ?',
          now,
          toDbJson(actualValue),
          toDbJson(question.answer),
          String(existingMistake.id)
        );
      } else {
        run(
          `INSERT INTO mistakes (id, user_id, lesson_id, question_id, topic, subtopic, prompt, explanation, user_answer, correct_answer, repeat_count, last_seen_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          makeId(),
          req.user!.userId,
          parsed.data.lessonId,
          question.id,
          question.topic,
          question.subtopic,
          question.prompt,
          question.explanation,
          toDbJson(actualValue),
          toDbJson(question.answer),
          now,
          now
        );
      }
    }

    upsertReviewItem({
      userId: req.user!.userId,
      sourceType: 'question',
      sourceId: question.id,
      topic: question.topic,
      subtopic: question.subtopic,
      prompt: question.prompt,
      success: correctAnswer
    });

    review.push({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      explanation: question.explanation,
      yourAnswer: actualValue,
      correctAnswer: question.answer,
      isCorrect: correctAnswer
    });
  }

  const normalizedTopicScores = Object.fromEntries(
    Object.entries(topicScores).map(([topic, value]) => [topic, Math.round(value / Math.max(topicCounts[topic] || 1, 1))])
  );

  const score = Math.round((correct / questions.length) * 100);
  const difficulty = score >= 85 ? 'confident' : score >= 65 ? 'developing' : 'needs reinforcement';
  const attemptId = makeId();

  run(
    `INSERT INTO quiz_attempts (id, user_id, lesson_id, score, accuracy, difficulty, time_spent_minutes, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    attemptId,
    req.user!.userId,
    parsed.data.lessonId,
    score,
    score / 100,
    difficulty,
    parsed.data.timeSpentMinutes,
    toDbJson({ totalQuestions: questions.length, correct, topicScores: normalizedTopicScores, review }),
    now
  );

  const attempt = one<Record<string, unknown>>('SELECT * FROM quiz_attempts WHERE id = ?', attemptId);

  return res.json({
    attempt: {
      ...attempt,
      details: fromDbJson(attempt.details, {})
    },
    result: {
      score,
      correct,
      total: questions.length,
      difficulty,
      topicScores: normalizedTopicScores,
      review
    }
  });
});

router.get('/mistakes', (req: AuthenticatedRequest, res) => {
  const mistakes = many<Record<string, unknown>>(
    'SELECT * FROM mistakes WHERE user_id = ? ORDER BY repeat_count DESC, last_seen_at DESC',
    req.user!.userId
  ).map(mapMistake);

  return res.json({ mistakes });
});

router.patch('/mistakes/:id', (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ notes: z.string().max(500) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid notes.' });
  }

  const existing = one<Record<string, unknown> | null>('SELECT * FROM mistakes WHERE id = ?', req.params.id);
  if (!existing || String(existing.user_id) !== req.user!.userId) {
    return res.status(404).json({ message: 'Mistake not found.' });
  }

  run('UPDATE mistakes SET notes = ? WHERE id = ?', parsed.data.notes, req.params.id);
  const updated = one<Record<string, unknown>>('SELECT * FROM mistakes WHERE id = ?', req.params.id);
  return res.json({ mistake: mapMistake(updated) });
});

router.get('/mistakes/review-quiz', async (req: AuthenticatedRequest, res) => {
  const mistakes = many<Record<string, unknown>>(
    'SELECT * FROM mistakes WHERE user_id = ? ORDER BY repeat_count DESC, created_at DESC LIMIT 10',
    req.user!.userId
  ).map(mapMistake);
  const recommendationSignals = await getStudentRecommendations(req.user!.userId);
  const recommendations = recommendationSignals.map((item, index) => ({
    id: `review-rec-${index + 1}`,
    title: item.title,
    reason: item.reason,
    actionType: item.action.toLowerCase().includes('artifact') ? 'portfolio' : item.action.toLowerCase().includes('quiz') ? 'quiz' : item.action.toLowerCase().includes('lab') ? 'lab' : 'lesson',
    actionTarget: item.action,
    priority: item.urgency
  }));

  const generated = mistakes.map((mistake, index) => ({
    id: `mistake-${index}`,
    type: index % 2 === 0 ? 'short-response' : 'true-false',
    topic: mistake.topic,
    prompt: `Review prompt: ${mistake.prompt}`,
    explanation: mistake.explanation,
    correctAnswer: mistake.correctAnswer,
    recoveryAction: `Restate the rule for ${mistake.subtopic} and explain why your earlier answer failed.`
  }));

  return res.json({ quiz: generated, recommendations });
});

router.get('/labs', (_req, res) => {
  const labs = many<Record<string, unknown>>('SELECT * FROM labs ORDER BY title ASC').map(mapLab);
  return res.json({ labs });
});

router.get('/labs/:slug', (req, res) => {
  const labRow = one<Record<string, unknown> | null>('SELECT * FROM labs WHERE slug = ?', req.params.slug);
  if (!labRow) {
    return res.status(404).json({ message: 'Lab not found.' });
  }
  return res.json({ lab: mapLab(labRow) });
});

router.post('/labs/:id/submit', (req: AuthenticatedRequest, res) => {
  const parsed = labSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid lab answers.' });
  }

  const labRow = one<Record<string, unknown> | null>('SELECT * FROM labs WHERE id = ?', req.params.id);
  if (!labRow) {
    return res.status(404).json({ message: 'Lab not found.' });
  }

  const lab = mapLab(labRow);
  const tasks = lab.tasks;
  let score = 0;

  const feedback = tasks.map((task) => {
    const answer = String(parsed.data.answers[task.id] || '').toLowerCase();
    const matched = task.expectedKeywords.some((keyword) => answer.includes(keyword.toLowerCase()));
    if (matched) score += Math.round(100 / Math.max(tasks.length, 1));
    return `${task.prompt}: ${matched ? 'good defensive judgment' : 'needs stronger evidence and safer reasoning'}`;
  });

  const submissionId = makeId();
  run(
    `INSERT INTO lab_submissions (id, user_id, lab_id, answers, score, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    submissionId,
    req.user!.userId,
    lab.id,
    toDbJson(parsed.data.answers),
    Math.min(100, score),
    feedback.join(' | '),
    nowIso()
  );

  const submission = one<Record<string, unknown>>('SELECT * FROM lab_submissions WHERE id = ?', submissionId);
  return res.json({
    submission: {
      ...submission,
      answers: fromDbJson(submission.answers, {})
    }
  });
});


router.get('/review-queue', (req: AuthenticatedRequest, res) => {
  const dueReviews = getDueReviewItems(req.user!.userId);
  return res.json({ reviewQueue: dueReviews });
});

router.post('/review-queue/:id/complete', (req: AuthenticatedRequest, res) => {
  const parsed = reviewOutcomeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid review outcome.' });
  }
  const item = reviewItemOutcome(req.user!.userId, String(req.params.id), parsed.data.success);
  if (!item) {
    return res.status(404).json({ message: 'Review item not found.' });
  }
  return res.json({ reviewItem: item });
});

router.get('/projects', (req: AuthenticatedRequest, res) => {
  const projects = getGuidedProjects();
  const learnerProjects = getLearnerProjects(req.user!.userId);
  return res.json({ projects, learnerProjects });
});

router.post('/projects/:id/start', (req: AuthenticatedRequest, res) => {
  const project = one<Record<string, unknown> | null>('SELECT * FROM guided_projects WHERE id = ?', req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Guided project not found.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM learner_projects WHERE user_id = ? AND guided_project_id = ?', req.user!.userId, req.params.id);
  const now = nowIso();
  if (!existing) {
    run(
      `INSERT INTO learner_projects (id, user_id, guided_project_id, status, checkpoint_progress_json, reflection, evidence_url, created_at, updated_at)
       VALUES (?, ?, ?, 'in_progress', '[]', NULL, NULL, ?, ?)`,
      makeId(),
      req.user!.userId,
      req.params.id,
      now,
      now
    );
  } else if (String(existing.status) === 'not_started') {
    run('UPDATE learner_projects SET status = ?, updated_at = ? WHERE id = ?', 'in_progress', now, String(existing.id));
  }
  return res.status(existing ? 200 : 201).json({ learnerProjects: getLearnerProjects(req.user!.userId) });
});

router.patch('/projects/:id', (req: AuthenticatedRequest, res) => {
  const parsed = learnerProjectPatchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return res.status(400).json({ message: 'Invalid learner project update.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM learner_projects WHERE user_id = ? AND guided_project_id = ?', req.user!.userId, req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Project progress not found.' });
  }
  const currentProgress = fromDbJson<string[]>(existing.checkpoint_progress_json, []);
  run(
    `UPDATE learner_projects SET status = ?, checkpoint_progress_json = ?, reflection = ?, evidence_url = ?, updated_at = ? WHERE id = ?`,
    parsed.data.status ?? String(existing.status),
    toDbJson(parsed.data.checkpointProgress ?? currentProgress),
    parsed.data.reflection === undefined ? (existing.reflection ?? null) : (parsed.data.reflection || null),
    parsed.data.evidenceUrl === undefined ? (existing.evidence_url ?? null) : (parsed.data.evidenceUrl || null),
    nowIso(),
    String(existing.id)
  );
  return res.json({ learnerProjects: getLearnerProjects(req.user!.userId) });
});

router.get('/assignments', (req: AuthenticatedRequest, res) => {
  const assignments = getStudentAssignments(req.user!.userId);
  return res.json({ assignments });
});

router.patch('/assignments/:id', (req: AuthenticatedRequest, res) => {
  const parsed = assignmentStudentPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid assignment status.' });
  }
  const existing = one<Record<string, unknown> | null>('SELECT * FROM mentor_assignments WHERE id = ? AND student_id = ?', req.params.id, req.user!.userId);
  if (!existing) {
    return res.status(404).json({ message: 'Assignment not found.' });
  }
  run('UPDATE mentor_assignments SET status = ?, updated_at = ? WHERE id = ?', parsed.data.status, nowIso(), req.params.id);
  return res.json({ assignment: one<Record<string, unknown>>('SELECT * FROM mentor_assignments WHERE id = ?', req.params.id) });
});

router.get('/glossary', (_req, res) => {
  const glossary = many<Record<string, unknown>>('SELECT * FROM glossary_terms ORDER BY term ASC').map((row) => ({
    id: String(row.id),
    term: String(row.term),
    definition: String(row.definition),
    category: String(row.category)
  }));
  return res.json({ glossary });
});

router.get('/capstones', (_req, res) => {
  const capstones = many<Record<string, unknown>>('SELECT * FROM capstone_ideas ORDER BY title ASC').map(mapCapstone);
  return res.json({ capstones });
});

router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  const analytics = await getStudentAnalytics(req.user!.userId);
  return res.json({ analytics });
});

router.get('/portfolio', (req: AuthenticatedRequest, res) => {
  const portfolio = getStudentPortfolio(req.user!.userId);
  return res.json({ portfolio });
});

router.post('/portfolio', (req: AuthenticatedRequest, res) => {
  const parsed = portfolioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid portfolio artifact.', errors: parsed.error.flatten() });
  }
  const id = makeId();
  const now = nowIso();
  run(
    `INSERT INTO portfolio_artifacts (id, user_id, title, artifact_type, specialization, summary, deliverables_json, status, evidence_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    id,
    req.user!.userId,
    parsed.data.title,
    parsed.data.artifactType,
    parsed.data.specialization,
    parsed.data.summary,
    toDbJson(parsed.data.deliverables),
    parsed.data.evidenceUrl || null,
    now,
    now
  );
  const artifact = mapPortfolioArtifact(one<Record<string, unknown>>('SELECT * FROM portfolio_artifacts WHERE id = ?', id));
  res.status(201).json({ artifact });
});

router.patch('/portfolio/:id', (req: AuthenticatedRequest, res) => {
  const parsed = portfolioPatchSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return res.status(400).json({ message: 'Invalid portfolio update.', errors: parsed.success ? undefined : parsed.error.flatten() });
  }
  const existingRow = one<Record<string, unknown> | null>('SELECT * FROM portfolio_artifacts WHERE id = ?', req.params.id);
  if (!existingRow || String(existingRow.user_id) !== req.user!.userId) {
    return res.status(404).json({ message: 'Portfolio artifact not found.' });
  }
  const existing = mapPortfolioArtifact(existingRow);
  const merged = {
    ...existing,
    ...parsed.data,
    deliverables: parsed.data.deliverables ?? existing.deliverables,
    evidenceUrl: parsed.data.evidenceUrl === undefined ? existing.evidenceUrl : (parsed.data.evidenceUrl || null),
    mentorFeedback: parsed.data.mentorFeedback === undefined ? existing.mentorFeedback : (parsed.data.mentorFeedback || null)
  };
  run(
    `UPDATE portfolio_artifacts SET title = ?, artifact_type = ?, specialization = ?, summary = ?, deliverables_json = ?, status = ?, evidence_url = ?, mentor_feedback = ?, updated_at = ? WHERE id = ?`,
    merged.title,
    merged.artifactType,
    merged.specialization,
    merged.summary,
    toDbJson(merged.deliverables),
    merged.status,
    merged.evidenceUrl,
    merged.mentorFeedback,
    nowIso(),
    req.params.id
  );
  const artifact = mapPortfolioArtifact(one<Record<string, unknown>>('SELECT * FROM portfolio_artifacts WHERE id = ?', req.params.id));
  res.json({ artifact });
});

router.get('/certificates', async (req: AuthenticatedRequest, res) => {
  const mastery = await getStudentMastery(req.user!.userId);
  const certificates = getStudentCertificates(req.user!.userId);
  res.json({ certificates, eligibleTracks: mastery.filter((item) => item.score >= 80 && item.completionRate >= 65 && item.quizAverage >= 75) });
});

router.post('/certificates/claim', async (req: AuthenticatedRequest, res) => {
  const mastery = await getStudentMastery(req.user!.userId);
  const created = claimEligibleCertificates(req.user!.userId, mastery);
  res.status(created.length ? 201 : 200).json({ certificates: getStudentCertificates(req.user!.userId), created });
});

export default router;
