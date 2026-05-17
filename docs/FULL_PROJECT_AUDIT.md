# Full Project Audit — CyberPath Academy

_Last audited: 2026-05-16._

## Scope audited

Reviewed the requested product surface: `apps/web/src/pages`, `apps/web/src/components`, `apps/web/src/api/mock.ts`, `apps/web/src/types`, `apps/web/src/app/App.tsx`, `apps/web/scripts/smokeMockDemo.ts`, `apps/server/src/routes`, `apps/server/src/lib/db.ts`, `apps/server/src/utils`, `apps/server/prisma/seed.ts`, `apps/server/tests`, `.github/workflows`, `README.md`, and `docs`.

## What currently works

- Public mock demo can run without a backend and passes the smoke script.
- Full-stack server tests pass against a seeded SQLite database.
- Student flows exist for onboarding, dashboard, learning paths, lessons, labs, portfolio, mistakes, review, skill tree, and practice sessions.
- Mentor/admin routes exist with cohort dashboard data, alerts, assignments, feedback, content validation metrics, pilot leads, billing metadata, and school-pilot administration.
- Safety framing exists in public pages, lab guardrails, tutor refusal tests, and curriculum verification.
- Production-oriented primitives exist: helmet/CORS/rate-limit middleware, health endpoints, seed scripts, backup script, Docker/Render config, and deployment documentation.

## What is mock-only

- GitHub Pages style demo data is entirely browser-local and can be reset; it is suitable for portfolio demos, not real schools.
- Mock accounts, mock payment/subscription state, mock artifacts, mock cohort activity, and mock pilot leads do not persist to a production database.
- Mock mastery and practice are deterministic approximations and should not be represented as learner-validated adaptive learning.
- Browser-only demo routes intentionally bypass real authentication and school data policies.

## What works in full-stack backend mode

- Authentication, password reset email queuing, role enforcement, CSRF/origin checks, public feedback, pilot lead storage, learning dashboard, paths, labs, lesson progress, quiz submission, lab submission scoring, portfolio artifacts, skill tree, exercise listing, adaptive practice submission, mentor dashboard, admin overview, and content feedback summary.
- The backend now exposes the same nine defensive skill-tree categories and exercise type catalog as mock mode.

## What is unstable

- The backend seed now reaches the beta minimum counts: 53 lessons, 318 quiz questions, 27 safe labs, 10 guided projects, and 157 glossary terms.
- Browser E2E is still not installed because the registry blocked `@playwright/test` with HTTP 403 during a 2026-05-16 re-check; route confidence depends on API tests, TypeScript builds, and an expanded mock smoke fallback.
- Localization is intentionally English-only in the public beta; Uzbek/Russian remain disabled and marked review-only until complete. Locale fallback and missing-key reporting are now covered by the mock smoke check.
- Some frontend pages are large chunks and need component splitting, accessibility review, and mobile QA.
- Real school privacy, consent, retention, and incident processes are documented but not implemented as enforceable workflows.

## What is incomplete

- Content-count target is met in the default backend seed, but the expanded content still needs human editorial review and real learner feedback.
- Teacher dashboard is useful for demo/pilot discovery but lacks polished assignment lifecycle UX, printable reports with signatures, scheduled exports, and real SIS/LMS integrations.
- Mastery uses meaningful signals but has not been validated with real learner outcome data.
- Exercise engine supports the target exercise types in contract/catalog form, but authoring/review tooling remains shallow.
- Production payments, email delivery, monitoring, backups, restore drills, and school consent are not wired to real providers.

## What is fake-looking or must be positioned carefully

- Any demo numbers, cohort activity, artifacts, and dashboards are seeded examples unless a real school deployment is connected.
- “AI tutor” is safe and scoped, but without a live provider integration it is primarily guided/static behavior.
- Billing/pricing should be shown as validation/planning, not live purchase readiness.
- Public artifacts are demo artifacts unless they come from a real learner submission.

## What blocks beta users

1. No real browser E2E coverage for 30–60 minute student sessions because Playwright installation is blocked by registry policy.
2. Limited accessibility/mobile validation.
3. Expanded backend content needs human review and learner validation before sustained cohorts.
4. No real monitoring/error tracking in deployed environments.
5. Teacher workflows need field testing with real mentors.

## What blocks public launch

1. Privacy, parent/school consent, retention, DPA, terms, and production incident processes are not implemented end-to-end.
2. Payments are not production-ready and should not collect card data.
3. No production monitoring/alerting/error tracking provider is configured.
4. Backups exist as a script but restore drills and managed database policy are not proven.
5. Content review pipeline needs accountable reviewers and versioned publishing gates.

## What blocks Khan Academy-level quality

- Content volume and depth must expand by at least 10x.
- Mastery algorithms need learner outcome validation and longitudinal data.
- Teacher dashboard needs repeated school pilots and export/reporting polish.
- Accessibility, localization, mobile reliability, and offline behavior need systematic QA.
- Exercise authoring, analytics, spaced review, and knowledge graph tooling need dedicated product cycles.

## Honest scores after this upgrade

| Category | Score | Evidence | Main blocker |
|---|---:|---|---|
| Architecture | 7/10 | Typed frontend contracts, backend route tests, mock smoke tests, shared skill tree parity improved, and teacher CSV/roster checks added. | Shared contracts still live mainly in web types; no generated OpenAPI/Zod contract package. |
| Demo/product idea | 8/10 | Strong public landing/safety/pilot/pricing/demo surfaces and mock reset flow. | Needs real user proof and browser E2E CTA coverage. |
| Learning depth | 7/10 | Backend seed now has 53 lessons with objectives, examples, checks, mistakes, and related practice coverage. | Human editorial review and learner evidence are still immature. |
| Exercise system | 7/10 | 318 backend quiz questions plus 11 exercise types represented in practice/review/mastery/lab-prep routes. | Authoring/review analytics and large calibrated item bank are immature. |
| Mastery system | 7/10 | Mastery states, weak skills, review debt, next skill, practice deltas, and dashboard next actions exist. | Needs validated weighting and real learner calibration. |
| Teacher dashboard | 7/10 | Cohort dashboard, heatmap rows/columns, roster scope tests, lab/artifact review, assignment recommendations, and CSV export exist. | Printable reports and field-tested assignment lifecycle need production polish. |
| Content quality | 7/10 | Seed validates 50+ lessons, 300+ questions, 27 labs, 10 projects, 120+ glossary terms, fictional datasets, and guardrails. | Human review workflow and classroom validation remain insufficient. |
| Reliability for beta users | 7/10 | Build/test/smoke pass; mock route coverage is broader and backend quality gates are stronger. | Browser E2E blocked by registry policy; no mobile/accessibility matrix. |
| Production readiness | 6/10 | Security middleware, health, Docker/Render, backup docs, and CI smoke/build/test exist. | Real providers, monitoring, restore drills, consent workflows absent. |
| Khan Academy-level maturity | 4/10 | Stronger beta vertical slice with minimum content counts. | Needs years of content, data, accessibility, localization, and school validation. |

## Bottom line

CyberPath Academy is a credible defensive cybersecurity learning platform prototype with a meaningful full-stack vertical slice. It is not yet a Khan Academy-level product, not ready for paid school launch, and not ready to claim production maturity. It is ready to keep iterating toward a controlled beta if the team treats the remaining roadmap as required work rather than marketing copy.
