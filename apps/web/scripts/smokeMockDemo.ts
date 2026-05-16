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
