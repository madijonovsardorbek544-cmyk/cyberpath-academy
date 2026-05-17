import assert from 'node:assert/strict';

class MemoryStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, value); }
}

globalThis.localStorage = new MemoryStorage() as Storage;

const { mockApi, resetMockDemoData } = await import('../src/api/mock');
const { demoLocaleNotice, getMissingTranslationKeys, resolveDemoLocale, translateDemoKey } = await import('../src/contexts/LocaleContext');

async function login(email: string, password: string) {
  const response = await mockApi.post<{ user: { email: string; role: string } }>('/auth/login', { email, password });
  assert.equal(response.user.email, email);
  return response.user;
}

async function assertRoutes(routes: string[]) {
  for (const route of routes) {
    await mockApi.get(route);
  }
}

function assertPathQuality(paths: any) {
  assert.ok(paths.phases.length >= 1, 'paths should include curriculum phases');
  assert.ok(paths.tracks.length >= 1, 'paths should include tracks');

  for (const track of paths.tracks) {
    assert.ok(Array.isArray(track.outcomes), `${track.title} outcomes must be an array`);
    assert.ok(track.outcomes.length >= 1, `${track.title} must not have empty outcomes`);
    assert.ok(track.outcomes.every((item: string) => item.trim().length >= 12), `${track.title} outcomes should be meaningful`);
    const mappedCount = track.lessonLinks?.length ?? track.lessonCount ?? 0;
    assert.ok(mappedCount > 0 || track.comingSoon === true, `${track.title} has zero mapped lessons but is not marked coming soon`);
    assert.ok(track.recommendedLessonSlug || track.recommendedLessonId || track.lessonLinks?.[0]?.lessonSlug, `${track.title} needs at least one recommended lesson`);
  }
}

resetMockDemoData(false);
const signup = await mockApi.post<{ user: { email: string; role: string; roadmapJson: unknown; streakDays?: number; goal?: string | null; experienceLevel?: string | null; placementScore?: number | null } }>('/auth/signup', {
  name: 'New Student',
  email: 'new-student@example.com',
  password: 'StrongPass1!'
});
assert.equal(signup.user.email, 'new-student@example.com');
assert.equal(signup.user.role, 'student');
assert.equal(signup.user.roadmapJson, null);
assert.equal(signup.user.streakDays, 0);
assert.equal(signup.user.goal, null);
assert.equal(signup.user.experienceLevel, null);
assert.equal(signup.user.placementScore, null);

const newMeBefore = await mockApi.get<{ user: { email: string; roadmapJson: unknown } }>('/auth/me');
assert.equal(newMeBefore.user.email, 'new-student@example.com');
assert.equal(newMeBefore.user.roadmapJson, null);

const newDashboardBefore = await mockApi.get<any>('/learning/dashboard');
assert.ok(newDashboardBefore.analytics, 'new user dashboard before onboarding missing analytics');
assert.deepEqual(newDashboardBefore.dueReviews, [], 'new user should have no due reviews before activity');
assert.deepEqual(newDashboardBefore.assignments, [], 'new user should have no assignments before activity');
assert.deepEqual(newDashboardBefore.learnerProjects, [], 'new user should have no learner projects before activity');
assert.deepEqual(newDashboardBefore.portfolio, [], 'new user should have empty portfolio');
assert.deepEqual(newDashboardBefore.certificates, [], 'new user should have no certificates');

const onboarding = await mockApi.post<{ user: { roadmapJson: unknown; placementScore?: number | null }; roadmap: unknown }>('/learning/onboarding', { goal: 'SOC', experienceLevel: 'beginner', score: 80 });
assert.ok(onboarding.user.roadmapJson, 'onboarding response user should include roadmapJson');
assert.ok(onboarding.roadmap, 'onboarding response should include roadmap');
assert.equal(onboarding.user.placementScore, 80);

const newMeAfter = await mockApi.get<{ user: { roadmapJson: unknown } }>('/auth/me');
assert.ok(newMeAfter.user.roadmapJson, 'auth/me should include roadmapJson after onboarding');

const newDashboardAfter = await mockApi.get<any>('/learning/dashboard');
for (const key of ['analytics', 'nextLessons', 'practiceHub', 'dueReviews', 'assignments', 'learnerProjects', 'portfolio', 'certificates', 'mastery', 'recommendations']) {
  assert.ok(key in newDashboardAfter, `new user dashboard missing ${key}`);
}
assert.equal(newDashboardAfter.analytics.totalCompleted, 0, 'new user should have 0 completed lessons');
assert.equal(newDashboardAfter.analytics.totalQuizAccuracy, 0, 'new user should have 0 quiz accuracy');
assert.equal(newDashboardAfter.analytics.timeStudied, 0, 'new user should have 0 minutes studied');
assert.ok(newDashboardAfter.masterySummary, 'new user dashboard should expose skill mastery summary');
assert.ok(newDashboardAfter.practiceHub.continueLesson !== undefined, 'student dashboard exposes continue learning state');
assert.ok(newDashboardAfter.practiceHub.dailyQuest, 'student dashboard exposes daily practice quest');
assert.ok(Array.isArray(newDashboardAfter.practiceHub.reviewQueue), 'student dashboard exposes review due queue');
assert.ok(Array.isArray(newDashboardAfter.recommendations), 'student dashboard exposes next recommended actions');
assert.ok(newDashboardAfter.masterySummary.records.every((record: any) => record.score <= 19), 'new user starts with empty/low skill mastery');
assert.ok(Array.isArray(newDashboardAfter.nextLessons), 'new user nextLessons must be an array');
assert.ok(newDashboardAfter.nextLessons.length >= 1, 'new user should receive a first recommended lesson');
assertPathQuality(await mockApi.get('/learning/paths'));
const newSkillTree = await mockApi.get<any>('/learning/skill-tree');
assert.ok(newSkillTree.categories.length >= 9, 'skill tree should expose nine categories');
for (const node of newSkillTree.categories.flatMap((category: any) => category.nodes)) {
  assert.ok(node.id && node.title && node.categoryId, 'every visible skill needs id, title, category');
  assert.ok(node.lessons.length >= 1 || node.exercises.length >= 1, `${node.title} is empty`);
}
assert.equal(newSkillTree.recommendedNextSkill.id, 'cyber-what-is-cybersecurity', 'new user should start at cybersecurity foundations');
const beginnerSession = await mockApi.get<any>('/learning/practice/session?mode=learn');
assert.ok(beginnerSession.session.exercises.length >= 1, 'beginner practice session should load');

await assertRoutes(['/auth/me', '/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/learning/skills', '/learning/skill-tree', '/learning/practice/session', '/learning/review', '/learning/mastery', '/learning/portfolio', '/learning/mistakes', '/learning/projects', '/learning/assignments', '/platform/plans', '/platform/subscription', '/platform/my-feedback']);

resetMockDemoData(false);
const resetPaths = await mockApi.get<any>('/learning/paths');
assertPathQuality(resetPaths);

await login('student@cyberpath.local', 'Student123!');
const dashboard = await mockApi.get<any>('/learning/dashboard');
for (const key of ['practiceHub', 'dueReviews', 'assignments', 'learnerProjects', 'portfolio', 'certificates', 'mastery', 'recommendations']) {
  assert.ok(key in dashboard, `dashboard missing ${key}`);
}
assert.ok(dashboard.analytics, 'dashboard missing analytics');
assert.ok(Array.isArray(dashboard.analytics.topicAccuracy), 'analytics.topicAccuracy must be an array');
assert.ok(Array.isArray(dashboard.analytics.skillRadar), 'analytics.skillRadar must be an array');
assert.ok(dashboard.practiceHub.dailyQuest, 'practiceHub.dailyQuest missing');
assert.ok('continueLesson' in dashboard.practiceHub, 'practiceHub.continueLesson missing');
assert.ok(Array.isArray(dashboard.practiceHub.reviewQueue), 'practiceHub.reviewQueue must be an array');
assert.ok(Array.isArray(dashboard.practiceHub.paths), 'practiceHub.paths must be an array');
assert.ok(dashboard.nextLessons.length >= 4, 'dashboard should include at least 4 next lessons');

await assertRoutes(['/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/learning/portfolio', '/learning/mistakes', '/learning/projects', '/learning/assignments', '/platform/plans', '/platform/subscription', '/platform/my-feedback']);

const skillTree = await mockApi.get<any>('/learning/skill-tree');
assert.equal(skillTree.categories.length, 9, 'mock skill tree should expose nine categories');
const exerciseCatalogResponse = await mockApi.get<any>('/learning/exercises');
assert.ok(exerciseCatalogResponse.count >= 15, 'mock exercise catalog route should expose seeded exercises');
const exerciseTypes = new Set(exerciseCatalogResponse.exercises.map((exercise: any) => exercise.type));
for (const type of ['multiple_choice', 'multi_select', 'true_false', 'matching', 'short_answer', 'scenario_classification', 'evidence_selection', 'risk_ranking', 'log_interpretation', 'policy_review', 'report_writing']) {
  assert.ok(exerciseTypes.has(type), `mock exercise catalog missing ${type}`);
}
assert.ok(skillTree.recommendedNextSkill, 'experienced user should receive next recommended skill');
const practiceSession = await mockApi.get<any>(`/learning/practice/session?skillId=${skillTree.recommendedNextSkill.id}&mode=practice`);
assert.ok(practiceSession.session.exercises.length >= 1, 'practice session loads');
const firstExercise = practiceSession.session.exercises[0];
const correctPractice = await mockApi.post<any>('/learning/practice/submit', { sessionId: practiceSession.session.id, exerciseId: firstExercise.id, answer: firstExercise.correctAnswer, mode: 'practice' });
assert.equal(correctPractice.feedback.isCorrect, true, 'correct answer submission works');
assert.ok(correctPractice.feedback.updatedMastery.score >= practiceSession.session.masteryBefore.score, 'correct answer increases mastery');
assert.ok(correctPractice.feedback.explanation, 'practice feedback explains why the answer is correct');
assert.ok(correctPractice.feedback.reviewRecommendation, 'practice feedback includes next recommended action');
const wrongPractice = await mockApi.post<any>('/learning/practice/submit', { sessionId: practiceSession.session.id, exerciseId: firstExercise.id, answer: '__wrong__', mode: 'practice' });
assert.equal(wrongPractice.feedback.isCorrect, false, 'wrong answer returns feedback');
assert.ok(wrongPractice.feedback.wrongAnswerReason, 'wrong answer explains missed concept');
assert.ok(wrongPractice.feedback.missedConcept, 'wrong answer identifies concept missed');
assert.ok(wrongPractice.feedback.reviewRecommendation, 'wrong answer recommends what to review');
const reviewBefore = await mockApi.get<any>('/learning/review');
assert.ok(Array.isArray(reviewBefore.review), 'review session loads');
const masteryChallenge = await mockApi.post<any>('/learning/practice/submit', { sessionId: practiceSession.session.id, exerciseId: firstExercise.id, answer: firstExercise.correctAnswer, mode: 'mastery_challenge' });
assert.ok(masteryChallenge.feedback.scoreDelta >= 8, 'mastery challenge has higher mastery impact');
const labs = await mockApi.get<any>('/learning/labs');
assert.ok(labs.labs.length >= 12, 'mock demo should expose at least 12 safe labs');
const labDetail = await mockApi.get<any>(`/learning/labs/${labs.labs[0].slug}`);
assert.ok(labDetail.lab.tasks.length >= 1, 'lab detail should include tasks');
const labSubmission = await mockApi.post<any>(`/learning/labs/${labDetail.lab.id}/submit`, { answers: Object.fromEntries(labDetail.lab.tasks.map((task: any) => [task.id, 'evidence risk safe authorized defensive next step'])) });
assert.ok(labSubmission.submission.score >= 0, 'lab submission should return a score');
assert.ok(labSubmission.submission.rubricResult?.categoryScores, 'lab feedback should include rubric category scores');
assert.ok(Array.isArray(labSubmission.submission.rubricResult?.missingEvidence), 'lab feedback should include missing evidence list');
assert.ok(labSubmission.submission.artifactSuggestion?.prompt, 'lab feedback should include artifact suggestion');
await mockApi.post('/platform/feedback', { name: 'Smoke Visitor', email: 'smoke@example.com', category: 'validation', message: 'Smoke feedback', usefulnessScore: 5, difficulty: 'right_level', willingnessToPay: 'maybe', audienceRole: 'teacher', goal: 'school pilot' });
await mockApi.post('/platform/pilot-leads', { contactName: 'Smoke Pilot', email: 'pilot@example.edu', phoneOrTelegram: '@smoke', role: 'teacher', organizationName: 'Smoke School', cityCountry: 'Tashkent, Uzbekistan', studentCount: 24, studentAgeRange: '14-17', currentCyberLevel: 'Beginner', needsMost: 'Safe labs and mentor reports', interestLevel: 'ready_for_pilot', wouldPay: 'maybe', message: 'Smoke pilot request' });

await login('mentor@cyberpath.local', 'Mentor123!');
const mentorDashboard = await mockApi.get<any>('/mentor/cohort-dashboard');
assert.ok(mentorDashboard.metrics.totalStudents >= 2, 'mentor dashboard missing cohort metrics');
assert.ok(Array.isArray(mentorDashboard.students), 'mentor dashboard missing student progress table');
assert.ok(Array.isArray(mentorDashboard.weakTopicHeatmap), 'mentor dashboard missing weak-topic heatmap');
assert.ok(Array.isArray(mentorDashboard.masteryHeatmap), 'mentor dashboard missing cohort mastery heatmap');
assert.ok(Array.isArray(mentorDashboard.studentsNeedingReview), 'mentor dashboard missing students needing review');
assert.ok(Array.isArray(mentorDashboard.studentsReadyForLab), 'mentor dashboard missing lab readiness list');
assert.ok(Array.isArray(mentorDashboard.labSubmissions), 'mentor dashboard missing lab submission review queue');
assert.ok(Array.isArray(mentorDashboard.artifactReviews), 'mentor dashboard missing artifact review queue');
assert.ok(Array.isArray(mentorDashboard.assignmentRecommendations), 'mentor dashboard missing assignment recommendations');
assert.ok(mentorDashboard.masteryHeatmap.length >= 1 && ((mentorDashboard.masteryHeatmap[0].cells ?? mentorDashboard.masteryHeatmap[0].skills)?.length >= 1), 'mentor heatmap needs rows and columns');
await assertRoutes(['/mentor/students', '/mentor/feedback', '/mentor/alerts', '/mentor/cohorts', '/mentor/assignments', '/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/learning/portfolio']);

await login('admin@cyberpath.local', 'Admin123!');
const admin = await mockApi.get<any>('/admin/overview');
assert.ok(admin.validationMetrics, 'admin overview missing validation metrics');
assert.ok(admin.pilotLeads.length >= 1, 'admin overview missing pilot lead pipeline');
assert.match(demoLocaleNotice, /locked to English/i, 'partial locales should be clearly marked as English-only');
assert.equal(resolveDemoLocale('uz'), 'en', 'UZ switch should fall back safely while translations are review-only');
assert.equal(translateDemoKey('uz', 'dashboard'), 'Dashboard', 'review-only locale should render English core labels instead of crashing');
assert.equal(translateDemoKey('en', 'smoke.missing.translation'), 'smoke.missing.translation', 'missing translation keys should fall back to the key name');
assert.ok(getMissingTranslationKeys().includes('en:smoke.missing.translation'), 'missing translation keys should be reported for QA');
const pilotAdmin = await mockApi.get<any>('/platform/pilot-leads');
assert.ok(pilotAdmin.pilotLeads.length >= 1, 'admin pilot lead review route missing');
await assertRoutes(['/admin/overview', '/platform/pilot-leads', '/mentor/cohort-dashboard', '/mentor/students', '/mentor/feedback', '/mentor/alerts', '/mentor/cohorts', '/mentor/assignments', '/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/learning/portfolio']);

resetMockDemoData(false);
const afterReset = await mockApi.get<any>('/auth/me');
assert.equal(afterReset.user.email, 'student@cyberpath.local', 'reset demo data should restore seeded student session');

console.log('Mock public demo smoke test passed.');
