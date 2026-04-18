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
  ENABLE_DEMO_BILLING: 'true'
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
