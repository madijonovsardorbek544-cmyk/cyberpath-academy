# CyberPath Academy

CyberPath Academy is a full-stack cybersecurity learning platform built as a mobile-first PWA. It teaches learners from absolute beginner to specialization readiness through structured lessons, quizzes, safe defensive labs, analytics, a mistake notebook, support flows, and role-based dashboards.

This package is no longer just a polished MVP shell. It now includes the operational pieces that make a beta launch defensible.

## What is now materially stronger

- Real SQLite persistence with seeded demo data
- Public sign-up locked to `student`
- Stronger password rules and rate limiting
- Origin checks for state-changing requests
- Audit logging for auth, mentor actions, admin actions, billing demo actions, and platform feedback updates
- Email outbox for password reset delivery workflow
- Support / user feedback queue with admin review status changes
- Metrics, health, and readiness endpoints
- Billing and subscription scaffolding with honest demo checkout mode
- Backup script for the SQLite database
- Server integration tests for critical auth and authorization flows
- Privacy, terms, and safety pages in the web app
- Built frontend served by Express in production

## Stack

- Frontend: React + TypeScript + Tailwind + Vite
- Backend: Node.js + Express + TypeScript
- Database: SQLite via Node.js `node:sqlite`
- Auth: bcrypt password hashing + signed httpOnly session cookie
- Charts: Recharts
- PWA: vite-plugin-pwa

## Core product features

- Landing page with clear positioning, CTA, features, testimonials placeholder, and level overview
- Secure auth: sign up, login, logout, password reset
- Roles: student, mentor, admin
- Onboarding: goals, experience level, short diagnostic, personalized roadmap
- Learning paths: 24 seeded lessons across 5 phases
- Lesson pages with objectives, concept explanation, glossary, examples, quick checks, common mistakes, why it matters, and quizzes
- Quiz engine with multiple choice, multi-select, true/false, matching, short response, and scenario-based support
- Safe labs limited to defensive, fictional, authorized simulations only
-  Interactive defensive terminal labs with a browser-based simulated shell, fictional datasets, task files, hints, answer saving, and backend scoring
- AI tutor interface with simple/deep modes and offensive-safety guardrails
- Mistake notebook with notes, adaptive remediation, and generated review quiz
- Role-mapped specialization tracks with NICE / OWASP-style framing
- Mastery engine with readiness scoring, recommendations, certificates, and portfolio artifacts
- Progress analytics: completion rate, quiz accuracy, weak topics, time studied, streaks, readiness, radar chart
- Mentor dashboard for assigned students, intervention alerts, cohorts, and feedback
- Admin dashboard for users, lessons, labs, support queue, email outbox, and audit logs
- Support page for real user feedback collection
- Billing page with plans and demo subscription activation

## Seeded content

- 24 lessons
- 96 quiz questions
- 8 safe labs
- 5 capstone ideas
- 30 glossary terms

## Demo accounts

- Student: `student@cyberpath.local` / `Student123!`
- Student 2: `student2@cyberpath.local` / `Student123!`
- Mentor: `mentor@cyberpath.local` / `Mentor123!`
- Admin: `admin@cyberpath.local` / `Admin123!`

## Requirements

- Node.js 22+
- npm 10+

Node 22 is required because the backend uses the built-in `node:sqlite` runtime.

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Create env files

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

### 3) Seed the database

```bash
npm run db:setup
```

### 4) Start the full stack app

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`

## Production build

```bash
npm run db:setup
npm run build
npm run start
```

The Express server serves both the API and the built frontend in production.

## Tests

```bash
npm test
```

Current coverage is focused on high-risk flows:

- sign-up creates only `student`
- student dashboard exposes mastery and adaptive recommendations
- mentor alerts can be listed and resolved
- mentor cannot leave feedback for unassigned students
- password reset queues an email outbox record
- public feedback submission works

## Backups

```bash
npm run backup
```

Creates a timestamped copy of the SQLite database in `apps/server/data/backups/`.

## Environment variables

### `apps/server/.env`

```env
PORT=4000
CLIENT_URL=http://localhost:5173
APP_BASE_URL=http://localhost:4000
DATABASE_PATH=./data/cyberpath.db
JWT_SECRET=change-me-to-a-long-random-secret
NODE_ENV=development
COOKIE_SECURE=false
RATE_LIMIT_MAX=250
AUTH_RATE_LIMIT_MAX=10
MAIL_MODE=console
MAIL_FROM=noreply@cyberpath.local
ENABLE_DEMO_BILLING=true
SUPPORT_EMAIL=support@cyberpath.local
LOG_LEVEL=info
```

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:4000/api
VITE_API_MODE=api
```

## Operational endpoints

- `GET /api/health` → service health
- `GET /api/ready` → readiness check
- `GET /api/platform/metrics` → platform metrics snapshot


## GitHub-ready project hygiene

This package now includes:

- GitHub Actions CI workflow
- issue templates
- pull request template
- CONTRIBUTING guide
- SECURITY policy
- MIT license
- EditorConfig
- Dockerfile and docker-compose setup
- Render deployment manifest
- launch checklist

## Fast verification

```bash
npm run verify
```

This runs the production build and the server test suite.

## Docker

```bash
docker compose up --build
```

That starts the production server on `http://localhost:4000` with persistent SQLite storage in a Docker volume.

## Replit deployment

1. Import the project into Replit.
2. Run `npm install`.
3. Copy `.env.example` files into `.env` files.
4. Run `npm run db:setup`.
5. Deploy with `npm run build && npm run start`.

The included `.replit` file already points to the production flow.

## Honest launch status

This package is now much stronger than the earlier MVP, but still call it **Beta** or **Early Access** if you publish it publicly.

Why? Because the following still need real-world maturity work:

- counsel-reviewed privacy and terms language
- live payment provider integration and webhooks
- SMTP or transactional email provider integration
- deeper automated test coverage
- accessibility audit with real assistive-tech validation
- long-run monitoring and alerting integration
- broader content expansion and educator review
- load testing at meaningful traffic levels

## Safety model

The labs and tutor are explicitly defensive:

- no credential theft guidance
- no persistence guidance
- no malware deployment guidance
- no live-target exploitation flows
- no harmful offensive workflows
- all exercises use toy or fictional datasets and authorized simulation framing

## Project structure

```text
cyberpath-academy/
  apps/
    android-shell/
    server/
      data/
      prisma/
      scripts/
      src/
      tests/
    web/
      dist/
      src/
```

## What was actually verified in this pass

- `npm run build` passes
- `npm run db:setup` passes
- `npm test` passes
- database backup script is present
- admin overview includes support queue, email outbox, and audit log data
- pricing/support/legal routes build into the web app successfully
