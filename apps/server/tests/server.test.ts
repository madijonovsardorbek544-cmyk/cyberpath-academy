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
  await server.close();
});

test('guided tutor cites internal sources and refuses unsafe requests', async () => {
  const server = await startServer();
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
