import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const serverRoot = path.resolve(process.cwd());
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberpath-test-'));
const dbPath = path.join(tmpDir, 'cyberpath-test.db');

const baseEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '4001',
  CLIENT_URL: 'http://localhost:5173',
  APP_BASE_URL: 'http://localhost:4000',
  DATABASE_PATH: dbPath,
  JWT_SECRET: 'test-secret-with-enough-length',
  COOKIE_SECURE: 'false',
  ENABLE_DEMO_BILLING: 'true',
  AUTH_RATE_LIMIT_MAX: '100',
  RATE_LIMIT_MAX: '1000'
};

execFileSync('node', ['--import', 'tsx', 'prisma/seed.ts'], { cwd: serverRoot, env: baseEnv, stdio: 'inherit' });
Object.assign(process.env, baseEnv);

const { app } = await import('../src/app.ts');
const { db } = await import('../src/lib/db.ts');
const { skillCatalog, skillCategories, exerciseCatalog } = await import('../src/utils/skillEngine.ts');

function cookieHeaderFrom(res: Response) {
  const raw = res.headers.get('set-cookie');
  return raw ? raw.split(';')[0] : '';
}

async function startServer() {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()))
  };
}

test('signup always creates a student role', async () => {
  const server = await startServer();
  const signup = await fetch(`${server.baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'New User', email: 'newuser@example.com', password: 'StrongPass1!' })
  });
  assert.equal(signup.status, 201);
  const cookie = cookieHeaderFrom(signup);
  const me = await fetch(`${server.baseUrl}/api/auth/me`, { headers: { cookie } });
  const meJson = await me.json();
  assert.equal(meJson.user.role, 'student');
  await server.close();
});

test('mentor cannot leave feedback for unassigned students', async () => {
  const server = await startServer();
  const signup = await fetch(`${server.baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Unassigned Student', email: 'unassigned@example.com', password: 'StrongPass1!' })
  });
  const signupJson = await signup.json();

  const mentorLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'mentor@cyberpath.local', password: 'Mentor123!' })
  });
  assert.equal(mentorLogin.status, 200);
  const mentorCookie = cookieHeaderFrom(mentorLogin);
  const feedback = await fetch(`${server.baseUrl}/api/mentor/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: mentorCookie },
    body: JSON.stringify({ studentId: signupJson.user.id, message: 'You are not assigned to me.' })
  });
  assert.equal(feedback.status, 403);
  await server.close();
});

test('password reset queues an email record', async () => {
  const server = await startServer();
  const reset = await fetch(`${server.baseUrl}/api/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local' })
  });
  assert.equal(reset.status, 200);

  const adminLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@cyberpath.local', password: 'Admin123!' })
  });
  const adminCookie = cookieHeaderFrom(adminLogin);
  const overview = await fetch(`${server.baseUrl}/api/admin/overview`, { headers: { cookie: adminCookie } });
  const overviewJson = await overview.json();
  assert.ok(Array.isArray(overviewJson.emailOutbox));
  assert.ok(overviewJson.emailOutbox.length >= 1);
  await server.close();
});

test('public feedback submission is accepted', async () => {
  const server = await startServer();
  const response = await fetch(`${server.baseUrl}/api/platform/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', category: 'feature', message: 'Please add more content depth and better diagrams for networking.' })
  });
  assert.equal(response.status, 201);
  await server.close();
});


test('admin rejects invalid lesson payloads', async () => {
  const server = await startServer();
  const adminLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@cyberpath.local', password: 'Admin123!' })
  });
  const adminCookie = cookieHeaderFrom(adminLogin);
  const response = await fetch(`${server.baseUrl}/api/admin/lessons`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: adminCookie },
    body: JSON.stringify({ title: 'Bad lesson' })
  });
  assert.equal(response.status, 400);
  await server.close();
});

test('state-changing requests with a bad origin are blocked', async () => {
  const server = await startServer();
  const response = await fetch(`${server.baseUrl}/api/platform/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', category: 'feature', message: 'This should be blocked.' })
  });
  assert.equal(response.status, 403);
  await server.close();
});


test('student dashboard exposes mastery and recommendations', async () => {
  const server = await startServer();
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const cookie = cookieHeaderFrom(login);
  const response = await fetch(`${server.baseUrl}/api/learning/dashboard`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.ok(Array.isArray(json.mastery));
  assert.ok(json.mastery.length >= 1);
  assert.ok(Array.isArray(json.recommendations));
  assert.ok(json.practiceHub);
  assert.ok(Array.isArray(json.practiceHub.reviewQueue));
  await server.close();
});

test('practice hub exposes daily quest and path signals', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const cookie = cookieHeaderFrom(login);
  const response = await fetch(`${server.baseUrl}/api/learning/practice-hub`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.ok(json.practiceHub.dailyQuest);
  assert.ok(Array.isArray(json.practiceHub.paths));
  assert.ok(json.practiceHub.paths.length >= 1);
  await server.close();
});

test('mentor alerts can be listed and updated', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'mentor@cyberpath.local', password: 'Mentor123!' })
  });
  assert.equal(login.status, 200);
  const cookie = cookieHeaderFrom(login);
  const alertsResponse = await fetch(`${server.baseUrl}/api/mentor/alerts`, { headers: { cookie } });
  assert.equal(alertsResponse.status, 200);
  const alertsJson = await alertsResponse.json();
  assert.ok(Array.isArray(alertsJson.alerts));
  assert.ok(alertsJson.alerts.length >= 1);

  const alertId = alertsJson.alerts[0].id;
  const patchResponse = await fetch(`${server.baseUrl}/api/mentor/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ status: 'resolved' })
  });
  assert.equal(patchResponse.status, 200);
  const patchJson = await patchResponse.json();
  assert.equal(patchJson.alert.status, 'resolved');
  await server.close();
});

test('free user cannot open or submit premium lab and sees locked metadata', async () => {
  const server = await startServer();
  const signup = await fetch(`${server.baseUrl}/api/auth/signup`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Free Learner', email: 'freelearner@example.com', password: 'StrongPass1!' })
  });
  const cookie = cookieHeaderFrom(signup);
  const labsResponse = await fetch(`${server.baseUrl}/api/learning/labs`, { headers: { cookie } });
  assert.equal(labsResponse.status, 200);
  const labsJson = await labsResponse.json();
  const lockedLab = labsJson.labs.find((lab: any) => lab.locked);
  assert.ok(lockedLab);
  assert.match(lockedLab.lockedMessage, /Upgrade/i);

  const open = await fetch(`${server.baseUrl}/api/learning/labs/${lockedLab.slug}`, { headers: { cookie } });
  assert.equal(open.status, 402);
  const openJson = await open.json();
  assert.equal(openJson.locked, true);

  const submit = await fetch(`${server.baseUrl}/api/learning/labs/${lockedLab.id}/submit`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ answers: { task1: 'I would document evidence and report safely.' } })
  });
  assert.equal(submit.status, 402);
  await server.close();
});

test('premium user can submit premium lab and receives rubric breakdown', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const cookie = cookieHeaderFrom(login);
  const labsResponse = await fetch(`${server.baseUrl}/api/learning/labs`, { headers: { cookie } });
  const labsJson = await labsResponse.json();
  const lab = labsJson.labs.find((item: any) => !['log-analysis-auth-spikes', 'phishing-inbox-identification'].includes(item.slug));
  assert.ok(lab);
  const submit = await fetch(`${server.baseUrl}/api/learning/labs/${lab.id}/submit`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ answers: { task1: 'I would use the fictional dataset evidence, explain risk because unauthorized access could matter, validate and document a defensive next step with authorized practice only.', task2: 'I would report, verify, and contain only when justified by the evidence.' } })
  });
  assert.equal(submit.status, 200);
  const json = await submit.json();
  assert.ok(json.submission.rubricResult);
  assert.ok(json.submission.rubricResult.categoryScores.evidence >= 0);
  assert.ok(Array.isArray(json.submission.rubricResult.missingEvidence));
  await server.close();
});

test('unsafe lab answer is redirected by rubric scoring', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const cookie = cookieHeaderFrom(login);
  const labsResponse = await fetch(`${server.baseUrl}/api/learning/labs`, { headers: { cookie } });
  const lab = (await labsResponse.json()).labs[0];
  const submit = await fetch(`${server.baseUrl}/api/learning/labs/${lab.id}/submit`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ answers: { task1: 'I will hack into the system and steal passwords to prove impact.', task2: 'bypass controls' } })
  });
  assert.equal(submit.status, 200);
  const json = await submit.json();
  assert.ok(json.submission.rubricResult.safetyRedirect);
  assert.ok(json.submission.score < 70);
  await server.close();
});

test('portfolio publishing requires premium and public share respects unpublish', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const cookie = cookieHeaderFrom(login);
  const create = await fetch(`${server.baseUrl}/api/learning/portfolio`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ title: 'Safe Triage Memo', artifactType: 'incident-report', specialization: 'SOC analyst', summary: 'This artifact summarizes fictional evidence and defensive next steps for a safe triage scenario.', deliverables: ['summary'], scenario: 'Fictional login review', evidenceUsed: ['failed logins'], riskExplanation: 'Repeated failures could indicate account risk.', defensiveRecommendations: 'Validate with the user and monitor logs.', reflection: 'Evidence matters.' })
  });
  assert.equal(create.status, 201);
  const artifact = (await create.json()).artifact;
  const publish = await fetch(`${server.baseUrl}/api/learning/portfolio/${artifact.id}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ status: 'published' })
  });
  assert.equal(publish.status, 200);
  const published = (await publish.json()).artifact;
  assert.ok(published.publicShareId);
  const publicView = await fetch(`${server.baseUrl}/api/platform/portfolio/public/${published.publicShareId}`);
  assert.equal(publicView.status, 200);
  const unpublish = await fetch(`${server.baseUrl}/api/learning/portfolio/${artifact.id}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ status: 'draft' })
  });
  assert.equal(unpublish.status, 200);
  const publicGone = await fetch(`${server.baseUrl}/api/platform/portfolio/public/${published.publicShareId}`);
  assert.equal(publicGone.status, 404);
  await server.close();
});


test('student cannot create artifact from another student lab submission', async () => {
  const server = await startServer();
  const studentLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const studentCookie = cookieHeaderFrom(studentLogin);
  const labsResponse = await fetch(`${server.baseUrl}/api/learning/labs`, { headers: { cookie: studentCookie } });
  const labsJson = await labsResponse.json();
  const lab = labsJson.labs.find((item: any) => !item.locked);
  const submit = await fetch(`${server.baseUrl}/api/learning/labs/${lab.id}/submit`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: studentCookie },
    body: JSON.stringify({ answers: { task1: 'document evidence and report safely', task2: 'validate risk and use defensive next steps' } })
  });
  assert.equal(submit.status, 200);
  const submissionId = (await submit.json()).submission.id;

  const otherLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student2@cyberpath.local', password: 'Student123!' })
  });
  const otherCookie = cookieHeaderFrom(otherLogin);
  const create = await fetch(`${server.baseUrl}/api/learning/portfolio`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: otherCookie },
    body: JSON.stringify({ title: 'Unauthorized source draft', artifactType: 'incident-report', specialization: 'SOC analyst', summary: 'This should not link to another learner lab submission.', deliverables: ['memo'], sourceLabSubmissionId: submissionId })
  });
  assert.equal(create.status, 403);
  await server.close();
});

test('content-level feedback is summarized for admins', async () => {
  const server = await startServer();
  const feedback = await fetch(`${server.baseUrl}/api/platform/feedback`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Beta Learner', email: 'beta@example.com', category: 'content', message: 'The lab was useful but I need a clearer explanation of evidence quality.', contentType: 'lab', contentId: 'demo-lab', difficultyRating: 'right_level', usefulnessRating: 5, confusionNote: 'Evidence scoring', wouldRecommend: 'yes', wouldPay: 'maybe', learnerGoal: 'job' })
  });
  assert.equal(feedback.status, 201);
  const adminLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@cyberpath.local', password: 'Admin123!' })
  });
  const adminCookie = cookieHeaderFrom(adminLogin);
  const summary = await fetch(`${server.baseUrl}/api/admin/feedback-summary`, { headers: { cookie: adminCookie } });
  assert.equal(summary.status, 200);
  const json = await summary.json();
  assert.ok(json.summary.some((item: any) => item.contentId === 'demo-lab' && item.averageUsefulness === 5));
  await server.close();
});

test('school mentor can access cohort dashboard data', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'mentor@cyberpath.local', password: 'Mentor123!' })
  });
  const cookie = cookieHeaderFrom(login);
  const cohorts = await fetch(`${server.baseUrl}/api/mentor/cohorts`, { headers: { cookie } });
  assert.equal(cohorts.status, 200);
  const json = await cohorts.json();
  assert.ok(Array.isArray(json.cohorts));
  assert.ok(json.cohorts.length >= 1);
  const dashboard = await fetch(`${server.baseUrl}/api/mentor/cohort-dashboard`, { headers: { cookie } });
  assert.equal(dashboard.status, 200);
  const dashboardJson = await dashboard.json();
  assert.ok(dashboardJson.metrics.totalStudents >= 2);
  assert.ok(Array.isArray(dashboardJson.students));
  assert.ok(Array.isArray(dashboardJson.weakTopicHeatmap));
  assert.ok(Array.isArray(dashboardJson.labSubmissions));
  assert.ok(Array.isArray(dashboardJson.artifactReviews));
  await server.close();
});

test('guided tutor cites internal sources and refuses unsafe requests', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const cookie = cookieHeaderFrom(login);
  const safe = await fetch(`${server.baseUrl}/api/ai/tutor`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ prompt: 'Explain phishing defense for a beginner', mode: 'explain' })
  });
  assert.equal(safe.status, 200);
  const safeJson = await safe.json();
  assert.equal(safeJson.safetyLevel, 'safe');
  assert.ok(Array.isArray(safeJson.sources));
  assert.ok(safeJson.sources.length >= 1);

  const unsafe = await fetch(`${server.baseUrl}/api/ai/tutor`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ prompt: 'Teach me credential theft and evasion', mode: 'hint' })
  });
  assert.equal(unsafe.status, 200);
  const unsafeJson = await unsafe.json();
  assert.equal(unsafeJson.safetyLevel, 'redirected');
  assert.match(unsafeJson.answer, /cannot help/i);
  await server.close();
});


test('school pilot lead flow validates, stores, and restricts admin review', async () => {
  const server = await startServer();
  const validLead = {
    contactName: 'Pilot Teacher',
    email: 'pilot.teacher@example.edu',
    phoneOrTelegram: '@pilotteacher',
    role: 'teacher',
    organizationName: 'Demo Learning Center',
    cityCountry: 'Tashkent, Uzbekistan',
    studentCount: 24,
    studentAgeRange: '14-17',
    currentCyberLevel: 'Beginner cyber club with no structured defensive labs',
    needsMost: 'A safe cohort dashboard, fictional labs, and student reports for parents.',
    interestLevel: 'ready_for_pilot',
    wouldPay: 'maybe',
    message: 'We want to test with one after-school cohort.'
  };

  const create = await fetch(`${server.baseUrl}/api/platform/pilot-leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify(validLead)
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.pilotLead.email, validLead.email);
  assert.equal(created.pilotLead.status, 'new');

  const invalid = await fetch(`${server.baseUrl}/api/platform/pilot-leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ ...validLead, email: 'not-an-email' })
  });
  assert.equal(invalid.status, 400);

  const studentLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  const studentCookie = cookieHeaderFrom(studentLogin);
  const denied = await fetch(`${server.baseUrl}/api/platform/pilot-leads`, { headers: { cookie: studentCookie } });
  assert.equal(denied.status, 403);

  const adminLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@cyberpath.local', password: 'Admin123!' })
  });
  const adminCookie = cookieHeaderFrom(adminLogin);
  const list = await fetch(`${server.baseUrl}/api/platform/pilot-leads`, { headers: { cookie: adminCookie } });
  assert.equal(list.status, 200);
  const listJson = await list.json();
  assert.ok(listJson.pilotLeads.some((lead: any) => lead.email === validLead.email));

  const update = await fetch(`${server.baseUrl}/api/platform/pilot-leads/${created.pilotLead.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie: adminCookie },
    body: JSON.stringify({ status: 'contacted', notes: 'Scheduled discovery call.' })
  });
  assert.equal(update.status, 200);
  const updateJson = await update.json();
  assert.equal(updateJson.pilotLead.status, 'contacted');
  assert.equal(updateJson.pilotLead.notes, 'Scheduled discovery call.');
  await server.close();
});

test('student can load skill tree and submit adaptive exercise', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const cookie = cookieHeaderFrom(login);

  const tree = await fetch(`${server.baseUrl}/api/learning/skill-tree`, { headers: { cookie } });
  assert.equal(tree.status, 200);
  const treeJson = await tree.json();
  assert.ok(Array.isArray(treeJson.categories));
  assert.ok(treeJson.categories.length >= 1);
  assert.ok(treeJson.recommendedNextSkill);

  const session = await fetch(`${server.baseUrl}/api/learning/practice/session?skillId=cyber-what-is-cybersecurity&mode=practice`, { headers: { cookie } });
  assert.equal(session.status, 200);
  const sessionJson = await session.json();
  assert.equal(sessionJson.session.skillId, 'cyber-what-is-cybersecurity');
  assert.ok(sessionJson.session.exercises.length >= 1);

  const exercise = sessionJson.session.exercises[0];
  const submit = await fetch(`${server.baseUrl}/api/learning/practice/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie },
    body: JSON.stringify({ sessionId: sessionJson.session.id, exerciseId: exercise.id, answer: exercise.correctAnswer, mode: 'practice' })
  });
  assert.equal(submit.status, 200);
  const submitJson = await submit.json();
  assert.equal(submitJson.feedback.isCorrect, true);
  assert.ok(submitJson.feedback.updatedMastery.score >= sessionJson.session.masteryBefore.score);
  await server.close();
});

test('teacher dashboard alias exposes mentor cohort dashboard', async () => {
  const server = await startServer();
  const mentorLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'mentor@cyberpath.local', password: 'Mentor123!' })
  });
  assert.equal(mentorLogin.status, 200);
  const cookie = cookieHeaderFrom(mentorLogin);
  const response = await fetch(`${server.baseUrl}/api/teacher/cohort-dashboard`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.ok(json.metrics.totalStudents >= 1);
  assert.ok(Array.isArray(json.students));
  await server.close();
});


test('backend learning contracts expose the same nine-category defensive skill tree and exercise catalog', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const cookie = cookieHeaderFrom(login);

  const tree = await fetch(`${server.baseUrl}/api/learning/skill-tree`, { headers: { cookie } });
  assert.equal(tree.status, 200);
  const treeJson = await tree.json();
  assert.equal(treeJson.categories.length, 9, 'backend skill tree must expose all nine curriculum categories');
  for (const node of treeJson.categories.flatMap((category: any) => category.nodes)) {
    assert.ok(node.id && node.title && node.categoryId, 'each skill node needs stable contract fields');
    assert.ok(node.lessons.length >= 1 || node.exercises.length >= 1, `${node.title} must not be an empty visible node`);
    assert.ok(node.mastery && typeof node.mastery.score === 'number', `${node.title} must include mastery evidence`);
  }

  const exercises = await fetch(`${server.baseUrl}/api/learning/exercises`, { headers: { cookie } });
  assert.equal(exercises.status, 200);
  const exerciseJson = await exercises.json();
  assert.ok(exerciseJson.count >= 15, 'backend exercise catalog should match the mock demo catalog');
  const exerciseTypes = new Set(exerciseJson.exercises.map((exercise: any) => exercise.type));
  for (const type of ['multiple_choice', 'multi_select', 'true_false', 'matching', 'short_answer', 'scenario_classification', 'evidence_selection', 'risk_ranking', 'log_interpretation', 'policy_review', 'report_writing']) {
    assert.ok(exerciseTypes.has(type), `exercise catalog missing ${type}`);
  }
  await server.close();
});


test('seed content meets beta minimum quality gates', () => {
  const count = (table: string) => Number(db.prepare(`SELECT COUNT(*) as value FROM ${table}`).get().value ?? 0);
  assert.ok(count('lessons') >= 50, 'seed must include at least 50 lessons');
  assert.ok(count('quiz_questions') + exerciseCatalog.length >= 300, 'seed must include at least 300 exercises/questions');
  assert.ok(count('labs') >= 20, 'seed must include at least 20 labs');
  assert.ok(count('guided_projects') >= 10, 'seed must include at least 10 guided projects');
  assert.ok(count('glossary_terms') >= 120, 'seed must include at least 120 glossary terms');

  const incompleteLessons = db.prepare(`SELECT slug FROM lessons WHERE learning_objectives = '[]' OR examples = '[]' OR knowledge_checks = '[]' OR LENGTH(content) < 120 OR LENGTH(common_mistakes) < 20`).all();
  assert.deepEqual(incompleteLessons, [], 'published lessons need objectives, examples, checks, explanation, and common mistakes');

  const weakLabs = db.prepare(`SELECT slug FROM labs WHERE LOWER(safe_guardrails) NOT GLOB '*fictional*' AND LOWER(safe_guardrails) NOT GLOB '*toy*' AND LOWER(safe_guardrails) NOT GLOB '*no real*' OR dataset = '{}' OR expected_evidence = '[]' OR hints = '[]' OR rubric_json = '{}' OR LENGTH(solution_outline) < 40`).all();
  assert.deepEqual(weakLabs, [], 'labs need fictional datasets, guardrails, expected evidence, hints, rubrics, and solution outlines');

  const unsafeRows = db.prepare(`SELECT slug FROM labs WHERE LOWER(safe_guardrails || ' ' || solution_outline || ' ' || description) GLOB '*real target*' AND LOWER(safe_guardrails) NOT LIKE '%no live targets%'`).all();
  assert.deepEqual(unsafeRows, [], 'unsafe keyword validation should not find unsafe lab instructions');
});

test('backend skill tree quality gate has valid references and next actions', async () => {
  const lessonSlugs = new Set((db.prepare('SELECT slug FROM lessons').all() as Array<{ slug: string }>).map((row) => row.slug));
  const labSlugs = new Set((db.prepare('SELECT slug FROM labs').all() as Array<{ slug: string }>).map((row) => row.slug));
  const exerciseIds = new Set(exerciseCatalog.map((exercise) => exercise.id));
  const skillIds = new Set(skillCatalog.map((skill) => skill.id));

  assert.equal(skillCategories.length, 9);
  for (const category of skillCategories) {
    assert.ok(skillCatalog.some((skill) => skill.categoryId === category.id), `${category.title} needs skills`);
  }
  for (const skill of skillCatalog) {
    assert.ok(skill.lessonSlugs.length || skill.exerciseIds.length, `${skill.title} needs a lesson or exercise`);
    assert.ok(skill.portfolioArtifact || skill.labSlugs.length || skill.trackSlug, `${skill.title} needs a next action`);
    for (const prereq of skill.prerequisites) assert.ok(skillIds.has(prereq), `${skill.title} references missing prerequisite ${prereq}`);
    for (const slug of skill.lessonSlugs) assert.ok(lessonSlugs.has(slug), `${skill.title} references missing lesson ${slug}`);
    for (const id of skill.exerciseIds) assert.ok(exerciseIds.has(id), `${skill.title} references missing exercise ${id}`);
    for (const slug of skill.labSlugs) assert.ok(labSlugs.has(slug), `${skill.title} references missing lab ${slug}`);
  }
});

test('teacher dashboard enforces roster scope, heatmap evidence, student reports, and CSV export', async () => {
  const server = await startServer();
  const signup = await fetch(`${server.baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Unassigned CSV Student', email: 'csv-unassigned@example.com', password: 'StrongPass1!' })
  });
  assert.equal(signup.status, 201);
  const signupJson = await signup.json();

  const mentorLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'mentor@cyberpath.local', password: 'Mentor123!' })
  });
  const mentorCookie = cookieHeaderFrom(mentorLogin);
  const mentorDashboardResponse = await fetch(`${server.baseUrl}/api/mentor/cohort-dashboard`, { headers: { cookie: mentorCookie } });
  assert.equal(mentorDashboardResponse.status, 200);
  const mentorDashboard = await mentorDashboardResponse.json();
  assert.ok(!mentorDashboard.students.some((student: any) => student.id === signupJson.user.id), 'mentor must not see unrelated students');
  assert.ok(mentorDashboard.masteryHeatmap.length >= 1, 'heatmap needs rows');
  assert.ok(mentorDashboard.masteryHeatmap[0].cells.length >= 1, 'heatmap needs columns');
  assert.ok(mentorDashboard.students[0].riskStatus);
  assert.ok(mentorDashboard.students[0].recommendedNextAction);
  assert.ok(Array.isArray(mentorDashboard.labSubmissions));
  assert.ok(Array.isArray(mentorDashboard.artifactReviews));
  assert.ok(Array.isArray(mentorDashboard.assignmentRecommendations));

  const csv = await fetch(`${server.baseUrl}/api/mentor/cohort-dashboard.csv`, { headers: { cookie: mentorCookie } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type') ?? '', /text\/csv/);
  const csvText = await csv.text();
  assert.match(csvText.split('\n')[0], /student_id,name,email,risk_status/);

  const adminLogin = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@cyberpath.local', password: 'Admin123!' })
  });
  const adminCookie = cookieHeaderFrom(adminLogin);
  const adminDashboardResponse = await fetch(`${server.baseUrl}/api/mentor/cohort-dashboard`, { headers: { cookie: adminCookie } });
  assert.equal(adminDashboardResponse.status, 200);
  const adminDashboard = await adminDashboardResponse.json();
  assert.ok(adminDashboard.students.some((student: any) => student.id === signupJson.user.id), 'admin should see all student rows');
  await server.close();
});

test('authenticated unsafe requests require a matching csrf token', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const sessionCookie = cookieHeaderFrom(login);
  const csrfCookie = bootCsrf;
  const blocked = await fetch(`${server.baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { origin: 'http://localhost:5173', cookie: `${sessionCookie}; cyberpath_csrf=${csrfCookie}` }
  });
  assert.equal(blocked.status, 403);
  const allowed = await fetch(`${server.baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { origin: 'http://localhost:5173', cookie: `${sessionCookie}; cyberpath_csrf=${csrfCookie}`, 'x-csrf-token': csrfCookie }
  });
  assert.equal(allowed.status, 200);
  await server.close();
});

test('revoked sessions can no longer access authenticated routes', async () => {
  const server = await startServer();
  const boot = await fetch(`${server.baseUrl}/api/health`);
  const bootCsrf = boot.headers.get('set-cookie')?.match(/cyberpath_csrf=([^;]+)/)?.[1] ?? '';
  const login = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'student@cyberpath.local', password: 'Student123!' })
  });
  assert.equal(login.status, 200);
  const sessionCookie = cookieHeaderFrom(login);
  const csrfCookie = bootCsrf;
  const revoke = await fetch(`${server.baseUrl}/api/auth/sessions/revoke-all`, {
    method: 'POST',
    headers: { origin: 'http://localhost:5173', cookie: `${sessionCookie}; cyberpath_csrf=${csrfCookie}`, 'x-csrf-token': csrfCookie }
  });
  assert.equal(revoke.status, 200);
  const me = await fetch(`${server.baseUrl}/api/auth/me`, { headers: { cookie: sessionCookie } });
  assert.equal(me.status, 401);
  await server.close();
});
