# Beta Readiness

_Last updated: 2026-05-17._

## Current readiness

CyberPath Academy is **ready for a moderated 10-student / 2-teacher beta session**, not a paid launch and not an unsupervised school deployment. The product now has clearer in-app next steps, accessible form primitives, mobile safeguards for teacher tables/heatmaps, beta feedback/bug affordances, and manual QA scripts.

## Honest scorecard

| Question | Score | Decision | Evidence |
|---|---:|---|---|
| Can 10 students use it for 30 minutes? | 7/10 | Yes, moderated | Student signup, onboarding, dashboard, skill tree, practice, review, lesson, lab, portfolio, feedback, and bug-report flows exist and are covered by mock smoke plus manual script. |
| Can 2 teachers understand the dashboard? | 7/10 | Yes, with observation | Teacher dashboard has cohort metrics, risk table, heatmap, lab review, artifact review, CSV export, and mobile summaries. |
| Can users recover from errors? | 6/10 | Mostly | Error states and labeled bug/feedback paths exist; production monitoring still missing. |
| Does mobile work? | 6.5/10 | Beta-usable | Navigation wraps/scrolls, forms use mobile-safe sizes, teacher tables/heatmaps have mobile summaries. Needs real-device pass. |
| Are feedback/bug reports easy? | 8/10 | Yes | Beta banner, app shell, page beta actions, support page, and bug-report page are visible. |
| Are unsafe cybersecurity paths blocked? | 8/10 | Yes for beta | Safety page, terms, tutor/lab guardrails, fictional datasets, and defensive-only copy are in place. |
| Is mock-only status clear? | 7/10 | Mostly | Beta banner and docs say demo data is local/mock; continue to repeat this during beta. |
| Ready for paid users? | 3/10 | No | Payments, monitoring, legal/school ops, content review, and support operations are not production-ready. |
| Ready for controlled beta? | 7/10 | Yes | Use the manual QA script, collect feedback after major actions, and keep founder/mentor observation active. |

## Passed gates

- Mock smoke test covers public demo, student signup/onboarding/dashboard/skill tree/practice/review/labs/portfolio, mentor cohort dashboard, admin validation metrics, pilot leads, feedback, and reset behavior.
- Backend tests cover auth, role permissions, feedback, pilot leads, dashboards, labs, tutor safety, skill tree contracts, exercise contracts, content-count gates, lab guardrails, teacher roster scope, heatmap rows/columns, and CSV export.
- Backend seed creates 53 lessons, 318 quiz questions, 27 safe labs, 10 guided projects, 157 glossary terms, and all 9 skill-tree categories.
- Public beta locale remains honest: English only; Uzbek/Russian are disabled/review-only.
- In-app beta observation now captures feedback, bug reports, confusing pages, beta journey completions, users stuck before first lab, artifact creators, and teacher pilot interest in mock admin metrics.
- Manual QA, mobile QA, accessibility audit, and editorial review docs now exist.

## Required operating mode for beta

- 10 students maximum for the first observed run.
- 2 teachers/mentors maximum for dashboard review.
- One facilitator watches without rescuing too early; record where users get stuck.
- Every student must submit feedback and one bug/confusion report even if nothing broke.
- Do not collect payment or represent the demo as production school software.

## Still missing before 30-student cohort

- Real browser E2E or a completed manual browser QA report across Chrome/Safari/Firefox.
- Real-device mobile QA on phones and Chromebooks.
- Screen-reader pass with at least one assistive technology.
- Monitoring/error tracking in deployed environment.
- Teacher support playbook and escalation workflow.
- Human editorial review of the expanded seed content.

## Still missing before school pilot

- Privacy, consent, retention, DPA, incident response, support SLA, and school admin procedures.
- Production persistence and backups with restore drill.
- Teacher onboarding guide and printable reports.
- More content review and classroom-specific lesson plans.

## Still missing before paid launch

- Production billing provider, invoices/refunds/taxes, and support.
- Production monitoring and incident response.
- Legal/privacy review.
- Validated outcomes and testimonials.
- Accessibility and mobile QA evidence, not just code-level hardening.

## Recommendation

Run a **controlled beta with 10 real student testers and 2 teachers**. Do not run a paid launch, school-wide pilot, or Khan Academy-level marketing claim.
