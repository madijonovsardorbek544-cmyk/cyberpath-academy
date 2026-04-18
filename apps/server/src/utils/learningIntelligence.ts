import {
  count,
  fromDbJson,
  many,
  makeId,
  mapCertificate,
  mapCohort,
  mapGuidedProject,
  mapLearnerProject,
  mapMentorAlert,
  mapMentorAssignment,
  mapPortfolioArtifact,
  mapReviewItem,
  mapTrack,
  nowIso,
  one,
  run,
  toDbJson
} from '../lib/db.js';
import { getStudentAnalytics } from './analytics.js';

export type MasteryBand = 'attempted' | 'familiar' | 'proficient' | 'mastered';

function addDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function masteryState(score: number, evidenceCount: number): MasteryBand {
  if (score >= 88 && evidenceCount >= 6) return 'mastered';
  if (score >= 72 && evidenceCount >= 4) return 'proficient';
  if (score >= 50 && evidenceCount >= 2) return 'familiar';
  return 'attempted';
}

function labelForState(state: MasteryBand) {
  if (state === 'mastered') return 'Ready';
  if (state === 'proficient') return 'Developing';
  if (state === 'familiar') return 'Familiar';
  return 'Foundational';
}

function nextStreakMilestone(streakDays: number) {
  const milestones = [3, 7, 14, 30, 50, 100, 180, 365];
  const next = milestones.find((value) => value > streakDays) ?? (Math.ceil(streakDays / 100) * 100 + 100);
  return { next, remaining: Math.max(next - streakDays, 0) };
}

export function getTracks() {
  return many<Record<string, unknown>>('SELECT * FROM specialization_tracks ORDER BY CASE WHEN track_type = \'career\' THEN 0 ELSE 1 END, title ASC').map(mapTrack);
}

export function getGuidedProjects() {
  return many<Record<string, unknown>>('SELECT * FROM guided_projects ORDER BY estimated_hours ASC, title ASC').map(mapGuidedProject);
}

export function getLearnerProjects(userId: string) {
  const projects = many<Record<string, unknown>>(
    `SELECT lp.*, gp.title as guided_title, gp.slug as guided_slug, gp.summary as guided_summary, gp.specialization as guided_specialization,
            gp.difficulty as guided_difficulty, gp.estimated_hours as guided_estimated_hours,
            gp.checkpoints_json as guided_checkpoints_json, gp.rubric_json as guided_rubric_json, gp.starter_lesson_slug as guided_starter_lesson_slug
     FROM learner_projects lp
     JOIN guided_projects gp ON gp.id = lp.guided_project_id
     WHERE lp.user_id = ?
     ORDER BY lp.updated_at DESC`,
    userId
  );
  return projects.map((row) => ({
    ...mapLearnerProject(row),
    project: {
      id: String(row.guided_project_id),
      title: String(row.guided_title),
      slug: String(row.guided_slug),
      summary: String(row.guided_summary),
      specialization: String(row.guided_specialization),
      difficulty: String(row.guided_difficulty),
      estimatedHours: Number(row.guided_estimated_hours ?? 4),
      checkpoints: fromDbJson<string[]>(row.guided_checkpoints_json, []),
      rubric: fromDbJson<string[]>(row.guided_rubric_json, []),
      starterLessonSlug: row.guided_starter_lesson_slug ? String(row.guided_starter_lesson_slug) : null
    }
  }));
}

export function getStudentAssignments(userId: string) {
  return many<Record<string, unknown>>(
    'SELECT * FROM mentor_assignments WHERE student_id = ? ORDER BY CASE status WHEN \'open\' THEN 0 WHEN \'in_progress\' THEN 1 ELSE 2 END, COALESCE(due_at, created_at) ASC',
    userId
  ).map(mapMentorAssignment);
}

export function upsertReviewItem(input: {
  userId: string;
  sourceType: string;
  sourceId?: string | null;
  topic: string;
  subtopic?: string | null;
  prompt: string;
  success: boolean;
}) {
  const existing = one<Record<string, unknown> | null>(
    'SELECT * FROM review_queue WHERE user_id = ? AND source_type = ? AND COALESCE(source_id, \'\') = COALESCE(?, \'\')',
    input.userId,
    input.sourceType,
    input.sourceId ?? null
  );
  const now = nowIso();

  if (!existing) {
    const intervalDays = input.success ? 2 : 1;
    run(
      `INSERT INTO review_queue (id, user_id, source_type, source_id, topic, subtopic, prompt, due_at, last_reviewed_at, interval_days, ease_factor, status, success_streak, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      makeId(),
      input.userId,
      input.sourceType,
      input.sourceId ?? null,
      input.topic,
      input.subtopic ?? null,
      input.prompt,
      input.success ? addDaysIso(intervalDays) : now,
      now,
      intervalDays,
      input.success ? 2.4 : 2.1,
      input.success ? 'scheduled' : 'due',
      input.success ? 1 : 0,
      now,
      now
    );
    return;
  }

  const currentInterval = Number(existing.interval_days ?? 1);
  const currentEase = Number(existing.ease_factor ?? 2.3);
  const currentStreak = Number(existing.success_streak ?? 0);
  const nextEase = input.success ? Math.min(3, currentEase + 0.1) : Math.max(1.3, currentEase - 0.25);
  const nextInterval = input.success
    ? Math.max(2, Math.round(currentInterval * (currentStreak >= 1 ? nextEase : 1.8)))
    : 1;
  const nextStreak = input.success ? currentStreak + 1 : 0;

  run(
    `UPDATE review_queue
     SET topic = ?, subtopic = ?, prompt = ?, due_at = ?, last_reviewed_at = ?, interval_days = ?, ease_factor = ?, status = ?, success_streak = ?, updated_at = ?
     WHERE id = ?`,
    input.topic,
    input.subtopic ?? null,
    input.prompt,
    input.success ? addDaysIso(nextInterval) : now,
    now,
    nextInterval,
    nextEase,
    input.success ? 'scheduled' : 'due',
    nextStreak,
    now,
    String(existing.id)
  );
}

export function reviewItemOutcome(userId: string, reviewItemId: string, success: boolean) {
  const existing = one<Record<string, unknown> | null>('SELECT * FROM review_queue WHERE id = ? AND user_id = ?', reviewItemId, userId);
  if (!existing) return null;
  upsertReviewItem({
    userId,
    sourceType: String(existing.source_type),
    sourceId: existing.source_id ? String(existing.source_id) : null,
    topic: String(existing.topic),
    subtopic: existing.subtopic ? String(existing.subtopic) : null,
    prompt: String(existing.prompt),
    success
  });
  const refreshed = one<Record<string, unknown> | null>('SELECT * FROM review_queue WHERE id = ?', reviewItemId);
  return refreshed ? mapReviewItem(refreshed) : null;
}

export function getDueReviewItems(userId: string) {
  return many<Record<string, unknown>>(
    `SELECT * FROM review_queue
     WHERE user_id = ? AND (status = 'due' OR due_at <= ?)
     ORDER BY due_at ASC, updated_at ASC`,
    userId,
    nowIso()
  ).map(mapReviewItem);
}

export async function getStudentMastery(userId: string) {
  const tracks = getTracks();
  const attempts = many<Record<string, unknown>>('SELECT * FROM quiz_attempts WHERE user_id = ?', userId);
  const progress = many<Record<string, unknown>>('SELECT * FROM lesson_progress WHERE user_id = ?', userId);
  const labs = many<Record<string, unknown>>('SELECT * FROM lab_submissions WHERE user_id = ?', userId);
  const reviewItems = many<Record<string, unknown>>('SELECT * FROM review_queue WHERE user_id = ?', userId).map(mapReviewItem);

  const attemptByLesson = new Map<string, number[]>();
  const topicAccuracy = new Map<string, number[]>();
  for (const attempt of attempts) {
    const lessonId = String(attempt.lesson_id);
    const arr = attemptByLesson.get(lessonId) ?? [];
    arr.push(Number(attempt.score));
    attemptByLesson.set(lessonId, arr);

    const details = fromDbJson<{ topicScores?: Record<string, number> }>(attempt.details, {});
    for (const [topic, score] of Object.entries(details.topicScores ?? {})) {
      const existing = topicAccuracy.get(topic.toLowerCase()) ?? [];
      existing.push(Number(score));
      topicAccuracy.set(topic.toLowerCase(), existing);
    }
  }

  const progressByLesson = new Map<string, Record<string, unknown>>();
  for (const item of progress) progressByLesson.set(String(item.lesson_id), item);
  const avgLabScore = labs.length ? Math.round(labs.reduce((sum, lab) => sum + Number(lab.score), 0) / labs.length) : 0;

  return tracks.map((track) => {
    const links = many<Record<string, unknown>>('SELECT * FROM track_lesson_links WHERE track_id = ?', track.id);
    const lessonIds = links.map((link) => String(link.lesson_id));
    const completed = lessonIds.filter((lessonId) => Number(progressByLesson.get(lessonId)?.completed ?? 0) === 1).length;
    const completionRate = lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0;
    const quizScores = lessonIds.flatMap((lessonId) => attemptByLesson.get(lessonId) ?? []);
    const quizAverage = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
    const evidenceCount = completed + quizScores.length + Math.min(labs.length, 3);
    const linkedReview = reviewItems.filter((item) => item.sourceType === 'lesson' && item.sourceId && lessonIds.includes(item.sourceId));
    const overdueReviews = linkedReview.filter((item) => item.status === 'due' || item.dueAt <= nowIso()).length;
    const reviewHealth = linkedReview.length ? Math.max(25, 100 - Math.round((overdueReviews / linkedReview.length) * 100)) : 70;
    const skillSignals = track.skills.map((skill) => {
      const scores = [...(topicAccuracy.get(skill.toLowerCase()) ?? []), ...(topicAccuracy.get(track.title.toLowerCase()) ?? [])];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const state = masteryState(avg || reviewHealth / 2, scores.length ? scores.length : completed ? 1 : 0);
      return { skill, score: avg, state };
    });

    const masteryScore = Math.min(100, Math.round((completionRate * 0.35) + (quizAverage * 0.35) + (avgLabScore * 0.15) + (reviewHealth * 0.15)));
    const state = masteryState(masteryScore, evidenceCount);
    return {
      trackId: track.id,
      trackSlug: track.slug,
      title: track.title,
      frameworkRef: track.frameworkRef,
      trackType: track.trackType,
      estimatedHours: track.estimatedHours,
      hero: track.hero,
      outcomes: track.outcomes,
      targetRoles: track.targetRoles,
      entryPoints: track.entryPoints,
      prerequisites: track.prerequisites,
      recommendedFor: track.recommendedFor,
      score: masteryScore,
      completionRate,
      quizAverage,
      evidenceCount,
      confidence: Math.min(100, evidenceCount * 14 + Math.max(0, 100 - overdueReviews * 10)),
      band: state,
      status: labelForState(state),
      evidence: track.outcomes.slice(0, 2),
      nextMilestone: track.milestones[0] ?? 'Build more evidence',
      milestones: track.milestones,
      skills: track.skills,
      skillSignals,
      reviewDueCount: overdueReviews,
      reviewHealth,
      lessonCount: lessonIds.length
    };
  }).sort((a, b) => b.score - a.score);
}

export async function getStudentRecommendations(userId: string) {
  const analytics = await getStudentAnalytics(userId);
  const mastery = await getStudentMastery(userId);
  const mistakes = many<Record<string, unknown>>(
    'SELECT * FROM mistakes WHERE user_id = ? ORDER BY repeat_count DESC, last_seen_at DESC LIMIT 5',
    userId
  );
  const dueReviews = getDueReviewItems(userId);
  const assignments = getStudentAssignments(userId).filter((item) => item.status !== 'done');
  const projects = getLearnerProjects(userId);

  const recommendations: Array<{ title: string; reason: string; action: string; urgency: 'high' | 'medium' | 'low' }> = [];

  if (dueReviews.length) {
    recommendations.push({
      title: 'Clear your due review queue',
      reason: `You have ${dueReviews.length} review item(s) due now. Retention decays when you keep skipping reactivation.`,
      action: 'Open the practice hub and clear two due reviews before doing new content.',
      urgency: dueReviews.length >= 4 ? 'high' : 'medium'
    });
  }

  const weakestTrack = mastery.slice().sort((a, b) => a.score - b.score)[0];
  if (weakestTrack) {
    recommendations.push({
      title: `Raise your ${weakestTrack.title} mastery`,
      reason: `${weakestTrack.title} is your weakest mapped path right now at ${weakestTrack.score}%, with ${weakestTrack.reviewDueCount} due review signal(s).`,
      action: `Complete the remaining ${Math.max(weakestTrack.lessonCount - Math.round((weakestTrack.completionRate / 100) * weakestTrack.lessonCount), 0)} linked lessons and retake one quiz in this path.`,
      urgency: weakestTrack.score < 55 ? 'high' : 'medium'
    });
  }

  if (assignments[0]) {
    recommendations.push({
      title: `Finish mentor assignment: ${assignments[0].title}`,
      reason: 'A mentor already told you exactly what weak point to fix. Ignoring that is lazy, not strategic.',
      action: 'Open your dashboard, complete the assignment, and move its status forward.',
      urgency: assignments[0].dueAt ? 'high' : 'medium'
    });
  }

  if (analytics.weakTopics[0]) {
    recommendations.push({
      title: `Stop leaking points on ${analytics.weakTopics[0].topic}`,
      reason: `${analytics.weakTopics[0].topic} is your highest-frequency miss area with ${analytics.weakTopics[0].misses} logged misses.`,
      action: 'Open the mistake notebook, save one note for each repeated miss, then complete the generated review quiz.',
      urgency: analytics.weakTopics[0].misses >= 3 ? 'high' : 'medium'
    });
  }

  const stalledProject = projects.find((project) => project.status === 'not_started' || project.status === 'draft');
  if (stalledProject && recommendations.length < 5) {
    recommendations.push({
      title: `Advance guided project: ${stalledProject.project.title}`,
      reason: 'Proof of work is what separates learners from résumé talkers.',
      action: 'Open your guided project, complete the next checkpoint, and attach evidence.',
      urgency: 'low'
    });
  }

  if (analytics.streakDays < 2 && recommendations.length < 5) {
    recommendations.push({
      title: 'Rebuild your consistency',
      reason: `Your current learning streak is only ${analytics.streakDays} days. Low consistency kills retention.`,
      action: 'Log at least one 20-minute lesson and one quiz attempt today to restart momentum.',
      urgency: 'medium'
    });
  }

  if (mistakes.length && recommendations.length < 5) {
    const topMistake = mistakes[0];
    recommendations.push({
      title: `Fix the repeated mistake in ${String(topMistake.subtopic)}`,
      reason: 'Repeated mistakes are a cleaner signal than generic low confidence.',
      action: `Review the explanation for “${String(topMistake.prompt).slice(0, 80)}...” and write the real rule in your own words.`,
      urgency: 'medium'
    });
  }

  return recommendations.slice(0, 5);
}

export async function getPracticeHub(userId: string) {
  const analytics = await getStudentAnalytics(userId);
  const mastery = await getStudentMastery(userId);
  const dueReviews = getDueReviewItems(userId);
  const assignments = getStudentAssignments(userId).filter((item) => item.status !== 'done');
  const learnerProjects = getLearnerProjects(userId);
  const mistakes = many<Record<string, unknown>>(
    'SELECT * FROM mistakes WHERE user_id = ? ORDER BY repeat_count DESC, last_seen_at DESC LIMIT 6',
    userId
  );
  const nextLessonRow = one<Record<string, unknown> | null>(
    `SELECT * FROM lessons WHERE id NOT IN (SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND completed = 1)
     ORDER BY phase ASC, order_index ASC LIMIT 1`,
    userId
  ) ?? one<Record<string, unknown> | null>('SELECT * FROM lessons ORDER BY phase ASC, order_index ASC LIMIT 1');
  const resumeLessonRow = one<Record<string, unknown> | null>(
    `SELECT l.* FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
     WHERE lp.user_id = ?
     ORDER BY lp.last_opened_at DESC LIMIT 1`,
    userId
  );

  const weakestTrack = mastery.slice().sort((a, b) => a.score - b.score)[0] ?? null;
  const strongestTrack = mastery.slice().sort((a, b) => b.score - a.score)[0] ?? null;
  const streak = nextStreakMilestone(analytics.streakDays);
  const portfolioCount = count('SELECT COUNT(*) as value FROM portfolio_artifacts WHERE user_id = ?', userId);
  const activeProject = learnerProjects.find((project) => project.status !== 'done') ?? null;

  const questSteps = [
    {
      id: 'review',
      label: dueReviews.length ? `Clear ${Math.min(dueReviews.length, 2)} due review item(s)` : 'Run one review set',
      href: '/practice',
      done: dueReviews.length === 0
    },
    {
      id: 'lesson',
      label: nextLessonRow ? `Complete ${String(nextLessonRow.title)}` : 'Complete one lesson',
      href: nextLessonRow ? `/lessons/${String(nextLessonRow.slug)}` : '/paths',
      done: false
    },
    {
      id: 'artifact',
      label: activeProject ? `Advance ${activeProject.project.title}` : 'Start one guided project checkpoint',
      href: '/paths',
      done: false
    }
  ];

  return {
    streak: {
      days: analytics.streakDays,
      nextMilestone: streak.next,
      daysRemaining: streak.remaining
    },
    continueLesson: resumeLessonRow
      ? {
          id: String(resumeLessonRow.id),
          slug: String(resumeLessonRow.slug),
          title: String(resumeLessonRow.title),
          phaseTitle: String(resumeLessonRow.phase_title),
          estimatedMinutes: Number(resumeLessonRow.estimated_minutes ?? 20)
        }
      : nextLessonRow
        ? {
            id: String(nextLessonRow.id),
            slug: String(nextLessonRow.slug),
            title: String(nextLessonRow.title),
            phaseTitle: String(nextLessonRow.phase_title),
            estimatedMinutes: Number(nextLessonRow.estimated_minutes ?? 20)
          }
        : null,
    recoveryPlan: analytics.streakDays < 2 ? {
      title: 'Streak recovery',
      summary: 'Do not overreact. Recover with one review rep, one lesson checkpoint, and one short quiz retry today.',
      actions: ['Clear one due review item', 'Spend 15 minutes on the next lesson', 'Retry one quiz or practice set']
    } : null,
    dailyQuest: {
      title: "Today's high-value plan",
      rewardLabel: weakestTrack ? `Raise ${weakestTrack.title} mastery` : 'Build momentum',
      progress: questSteps.filter((step) => step.done).length,
      total: questSteps.length,
      steps: questSteps
    },
    focusAreas: [
      dueReviews[0]
        ? {
            id: 'due-review',
            title: `${dueReviews[0].topic} review is due`,
            description: 'This is not optional busywork. This is how retention gets built instead of faked.',
            badge: 'Due now',
            href: '/practice',
            actionLabel: 'Clear review'
          }
        : null,
      assignments[0]
        ? {
            id: 'mentor-assignment',
            title: assignments[0].title,
            description: assignments[0].instructions,
            badge: 'Mentor assigned',
            href: '/dashboard',
            actionLabel: 'Open dashboard'
          }
        : null,
      weakestTrack
        ? {
            id: 'mastery',
            title: `${weakestTrack.title} mastery challenge`,
            description: `You are at ${weakestTrack.score}% mastery with ${weakestTrack.reviewDueCount} due review signal(s). Clear one lesson and one quiz retry to move this path forward.`,
            badge: weakestTrack.trackType === 'skill' ? 'Skill path' : 'Career path',
            href: '/paths',
            actionLabel: 'Open path'
          }
        : null,
      {
        id: 'guided-project',
        title: portfolioCount ? 'Tighten proof of work' : 'Start a guided project',
        description: portfolioCount
          ? `You already have ${portfolioCount} artifact(s). Improve one with clearer evidence, scope, and business impact.`
          : 'Turn study into proof with a guided artifact: incident memo, IAM review, or secure-code note.',
        badge: 'Guided project',
        href: '/paths',
        actionLabel: portfolioCount ? 'Review portfolio' : 'Start artifact'
      }
    ].filter(Boolean),
    reviewQueue: dueReviews.slice(0, 5).map((item) => ({
      id: item.id,
      title: `${item.topic} review`,
      description: item.prompt,
      badge: item.status === 'due' ? 'Due' : `${item.intervalDays}d`,
      href: '/practice',
      actionLabel: 'Review now'
    })),
    assignments: assignments.slice(0, 4),
    activeProject,
    paths: mastery.slice(0, 5).map((item) => ({
      trackSlug: item.trackSlug,
      title: item.title,
      trackType: item.trackType,
      estimatedHours: item.estimatedHours,
      hero: item.hero,
      score: item.score,
      completionRate: item.completionRate,
      quizAverage: item.quizAverage,
      band: item.band,
      reviewDueCount: item.reviewDueCount
    }))
  };
}

export function getStudentPortfolio(userId: string) {
  return many<Record<string, unknown>>('SELECT * FROM portfolio_artifacts WHERE user_id = ? ORDER BY updated_at DESC', userId).map(mapPortfolioArtifact);
}

export function getStudentCertificates(userId: string) {
  return many<Record<string, unknown>>('SELECT * FROM certificate_awards WHERE user_id = ? ORDER BY created_at DESC', userId).map(mapCertificate);
}

export function getStudentCohort(userId: string) {
  const cohortRow = one<Record<string, unknown> | null>(
    `SELECT c.* FROM cohorts c
     JOIN cohort_members cm ON cm.cohort_id = c.id
     WHERE cm.user_id = ?
     ORDER BY c.created_at DESC LIMIT 1`,
    userId
  );
  if (!cohortRow) return null;
  const cohort = mapCohort(cohortRow);
  const memberCount = count('SELECT COUNT(*) as value FROM cohort_members WHERE cohort_id = ?', cohort.id);
  return { ...cohort, memberCount };
}

export function claimEligibleCertificates(userId: string, mastery: Awaited<ReturnType<typeof getStudentMastery>>) {
  const created: ReturnType<typeof mapCertificate>[] = [];
  const now = nowIso();
  const portfolioCount = count('SELECT COUNT(*) as value FROM portfolio_artifacts WHERE user_id = ?', userId);
  const labsPassed = count('SELECT COUNT(*) as value FROM lab_submissions WHERE user_id = ? AND score >= 70', userId);

  for (const item of mastery) {
    const existing = one<Record<string, unknown> | null>('SELECT * FROM certificate_awards WHERE user_id = ? AND track_slug = ?', userId, item.trackSlug);
    const eligible = item.score >= 80 && item.completionRate >= 65 && item.quizAverage >= 75 && (portfolioCount >= 1 || labsPassed >= 2);
    if (!existing && eligible) {
      const id = makeId();
      run(
        `INSERT INTO certificate_awards (id, user_id, track_slug, title, status, criteria_json, issued_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'issued', ?, ?, ?, ?)`,
        id,
        userId,
        item.trackSlug,
        `${item.title} Readiness Certificate`,
        toDbJson({ score: item.score, completionRate: item.completionRate, quizAverage: item.quizAverage, portfolioCount, labsPassed, assessedSkills: item.skills.slice(0, 4) }),
        now,
        now,
        now
      );
      const row = one<Record<string, unknown>>('SELECT * FROM certificate_awards WHERE id = ?', id);
      created.push(mapCertificate(row));
    }
  }
  return created;
}

export async function syncMentorAlerts(studentId: string, mentorId?: string | null, cohortId?: string | null) {
  const analytics = await getStudentAnalytics(studentId);
  const mastery = await getStudentMastery(studentId);
  const assignments = getStudentAssignments(studentId);
  const dueReviews = getDueReviewItems(studentId);
  const activeRules: Array<{ alertType: string; severity: string; summary: string; recommendation: string }> = [];

  if (analytics.streakDays < 2) {
    activeRules.push({
      alertType: 'streak-risk',
      severity: 'medium',
      summary: `Learner momentum is weak: current streak is ${analytics.streakDays} day(s).`,
      recommendation: 'Intervene with a short, high-confidence plan: one review rep, one lesson checkpoint, one quiz retry.'
    });
  }
  if (analytics.weakTopics[0]?.misses >= 3) {
    activeRules.push({
      alertType: 'repeat-mistakes',
      severity: 'high',
      summary: `${analytics.weakTopics[0].topic} is repeatedly breaking performance with ${analytics.weakTopics[0].misses} logged misses.`,
      recommendation: 'Review one wrong answer together, force the learner to explain the rule, then assign a targeted retry set.'
    });
  }
  const weakest = mastery.slice().sort((a, b) => a.score - b.score)[0];
  if (weakest && weakest.score < 55) {
    activeRules.push({
      alertType: 'track-gap',
      severity: 'high',
      summary: `${weakest.title} mastery is only ${weakest.score}%, which is too weak for safe progression.`,
      recommendation: 'Pause forward motion in this track until the learner clears the missing lesson and quiz evidence.'
    });
  }
  if (dueReviews.length >= 4) {
    activeRules.push({
      alertType: 'retention-risk',
      severity: 'medium',
      summary: `Learner has ${dueReviews.length} overdue review items. This is a retention problem, not just a pacing problem.`,
      recommendation: 'Assign a review-only session before letting them absorb more new content.'
    });
  }
  const overdueAssignment = assignments.find((item) => item.status !== 'done' && item.dueAt && item.dueAt < nowIso());
  if (overdueAssignment) {
    activeRules.push({
      alertType: 'assignment-overdue',
      severity: 'high',
      summary: `Mentor assignment “${overdueAssignment.title}” is overdue.`,
      recommendation: 'Follow up directly, tighten scope, and reset a realistic deadline with one measurable outcome.'
    });
  }

  const now = nowIso();
  for (const rule of activeRules) {
    const existing = one<Record<string, unknown> | null>('SELECT * FROM mentor_alerts WHERE student_id = ? AND alert_type = ?', studentId, rule.alertType);
    if (existing) {
      run(
        "UPDATE mentor_alerts SET severity = ?, summary = ?, recommendation = ?, status = CASE WHEN status = 'resolved' THEN 'resolved' ELSE 'open' END, updated_at = ? WHERE id = ?",
        rule.severity,
        rule.summary,
        rule.recommendation,
        now,
        String(existing.id)
      );
    } else {
      run(
        `INSERT INTO mentor_alerts (id, student_id, mentor_id, cohort_id, severity, alert_type, summary, recommendation, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        makeId(),
        studentId,
        mentorId ?? null,
        cohortId ?? null,
        rule.severity,
        rule.alertType,
        rule.summary,
        rule.recommendation,
        now,
        now
      );
    }
  }

  return many<Record<string, unknown>>('SELECT * FROM mentor_alerts WHERE student_id = ? ORDER BY updated_at DESC', studentId).map(mapMentorAlert);
}
