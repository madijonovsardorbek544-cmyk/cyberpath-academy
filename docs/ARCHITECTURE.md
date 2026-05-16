# Architecture

## Runtime modes

CyberPath Academy has two supported modes:

1. **Mock demo mode** (`VITE_API_MODE=mock`, optionally `VITE_GITHUB_PAGES=true`): the frontend uses `apps/web/src/api/mock.ts`, browser localStorage, seeded demo accounts, resettable data, and no backend.
2. **Full-stack mode**: the React app calls the Express API under `/api`, backed by SQLite through `apps/server/src/lib/db.ts` and seeded by `apps/server/prisma/seed.ts`.

Both modes must expose the same user-facing learning contracts for the routes used by the UI. The smoke and backend tests assert parity for the skill tree, exercise catalog, practice session, dashboard, mentor, admin, feedback, and pilot flows.

## Frontend

- `apps/web/src/app/App.tsx` owns route composition and role-gated route boundaries.
- `apps/web/src/components/AppShell.tsx` owns authenticated navigation.
- `apps/web/src/contexts/AuthContext.tsx` owns current-user state and demo login behavior.
- `apps/web/src/api/client.ts` routes API calls to either backend mode or mock mode.
- `apps/web/src/types/index.ts` is the frontend contract source for users, lessons, labs, mastery, skill tree, exercises, practice sessions, cohorts, reports, pilot leads, and feedback.

## Backend

- `apps/server/src/app.ts` composes middleware and route modules.
- `apps/server/src/middleware/security.ts` applies CORS/origin/rate-limit/security headers.
- `apps/server/src/routes/learning.ts` owns learner-facing lessons, labs, mastery, practice, review, portfolio, and skill-tree APIs.
- `apps/server/src/routes/mentor.ts` owns cohort, report, assignment, alert, and mentor feedback APIs.
- `apps/server/src/routes/admin.ts` owns admin overview, validation metrics, and content operations.
- `apps/server/src/routes/platform.ts` owns public feedback, plans, subscriptions, pilot leads, health-oriented platform data.
- `apps/server/src/utils/skillEngine.ts` owns skill-tree, mastery-state, exercise-catalog, session, and practice feedback logic.
- `apps/server/src/utils/learningIntelligence.ts` owns recommendations, review debt, certificates, cohorts, assignments, and portfolio projections.

## Contracts

The canonical UI shape is represented in `apps/web/src/types/index.ts`. Backend routes and mock routes should return the same top-level shapes for the same route family:

- `User`
- `Skill`, `SkillTree`, `MasteryRecord`
- `Exercise`, `PracticeSession`
- `Lesson`, `Lab`, `LabSubmission`
- `PortfolioArtifact`
- `Cohort`, `MentorReport`
- `Feedback`, `PilotLead`

Current gap: contracts are TypeScript types, not generated from a shared package or OpenAPI schema. The next architecture step is a workspace package such as `packages/contracts` exporting Zod schemas used by both Express and React.

## Defensive-only safety boundary

The platform must only teach authorized defensive work on fictional data. Labs and tutor responses must avoid real-target exploitation, credential theft, malware, evasion, persistence, phishing creation, and unauthorized access. Unsafe content is blocked by route validation, curriculum verification patterns, tutor refusal tests, lab guardrails, and review docs.

## Testing strategy

- `npm run smoke:mock --workspace web`: mock public demo and role-route smoke coverage.
- `npm test`: backend API contract, authorization, platform, mentor, admin, safety, skill-tree, and exercise catalog tests.
- `npm run build`: TypeScript and production bundle checks.
- Future required work: Playwright browser E2E, accessibility tests, mobile viewport tests, and production preflight tests.
