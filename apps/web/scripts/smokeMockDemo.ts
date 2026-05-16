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

async function login(email: string, password: string) {
  const response = await mockApi.post<{ user: { email: string; role: string } }>('/auth/login', { email, password });
  assert.equal(response.user.email, email);
  return response.user;
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
assert.ok(Array.isArray(newDashboardAfter.nextLessons), 'new user nextLessons must be an array');
assert.ok(newDashboardAfter.nextLessons.length >= 1, 'new user should receive a first recommended lesson');

for (const route of ['/auth/me', '/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/learning/portfolio', '/platform/plans']) {
  await mockApi.get(route);
}

resetMockDemoData(false);

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

for (const route of ['/learning/dashboard', '/learning/paths', '/learning/labs', '/learning/practice-hub', '/platform/plans']) {
  await mockApi.get(route);
}

const labs = await mockApi.get<any>('/learning/labs');
assert.ok(labs.labs.length >= 12, 'mock demo should expose at least 12 safe labs');
await mockApi.post('/platform/feedback', { name: 'Smoke Visitor', email: 'smoke@example.com', category: 'validation', message: 'Smoke feedback', usefulnessScore: 5, difficulty: 'right_level', willingnessToPay: 'maybe', audienceRole: 'teacher', goal: 'school pilot' });
await mockApi.post('/platform/pilot-leads', { contactName: 'Smoke Pilot', email: 'pilot@example.edu', phoneOrTelegram: '@smoke', role: 'teacher', organizationName: 'Smoke School', cityCountry: 'Tashkent, Uzbekistan', studentCount: 24, studentAgeRange: '14-17', currentCyberLevel: 'Beginner', needsMost: 'Safe labs and mentor reports', interestLevel: 'ready_for_pilot', wouldPay: 'maybe', message: 'Smoke pilot request' });

await login('mentor@cyberpath.local', 'Mentor123!');
const mentorDashboard = await mockApi.get<any>('/mentor/cohort-dashboard');
assert.ok(mentorDashboard.metrics.totalStudents >= 2, 'mentor dashboard missing cohort metrics');
assert.ok(Array.isArray(mentorDashboard.students), 'mentor dashboard missing student progress table');
assert.ok(Array.isArray(mentorDashboard.weakTopicHeatmap), 'mentor dashboard missing weak-topic heatmap');
assert.ok(Array.isArray(mentorDashboard.labSubmissions), 'mentor dashboard missing lab submission review queue');
assert.ok(Array.isArray(mentorDashboard.artifactReviews), 'mentor dashboard missing artifact review queue');
await mockApi.get('/mentor/students');
await mockApi.get('/mentor/feedback');
await mockApi.get('/mentor/alerts');
await mockApi.get('/mentor/cohorts');
await mockApi.get('/mentor/assignments');

await login('admin@cyberpath.local', 'Admin123!');
const admin = await mockApi.get<any>('/admin/overview');
assert.ok(admin.validationMetrics, 'admin overview missing validation metrics');
assert.ok(admin.pilotLeads.length >= 1, 'admin overview missing pilot lead pipeline');
const pilotAdmin = await mockApi.get<any>('/platform/pilot-leads');
assert.ok(pilotAdmin.pilotLeads.length >= 1, 'admin pilot lead review route missing');

console.log('Mock public demo smoke test passed.');
