# Beta Readiness

_Last updated: 2026-05-16._

## Current readiness

CyberPath Academy is now closer to a serious controlled beta: the backend seed meets the minimum content-count gate, mock/server quality gates are stronger, and teacher/student contract checks are broader. It is still **not** ready for unsupervised school-wide use or public launch.

## Passed gates

- Mock smoke test covers public demo, student signup/onboarding/dashboard/skill tree/practice/review/labs/portfolio, mentor cohort dashboard, admin validation metrics, pilot leads, feedback, and reset behavior.
- Backend tests cover auth, role permissions, feedback, pilot leads, dashboards, labs, tutor safety, skill tree contracts, exercise contracts, content-count gates, lab guardrails, teacher roster scope, heatmap rows/columns, and CSV export.
- Backend seed now creates 53 lessons, 318 quiz questions, 27 safe labs, 10 guided projects, 157 glossary terms, and all 9 skill-tree categories.
- Localization is honest: English is the only enabled public beta locale; Uzbek/Russian remain disabled/review-only until complete.
- Production builds complete in mock GitHub Pages mode and full monorepo mode.

## Still missing for 10 real students

- Real browser E2E is still blocked by package registry policy for `@playwright/test`; route smoke is a fallback, not browser coverage.
- Mobile viewport QA.
- Accessibility review with keyboard/screen-reader checks.
- Real monitoring/error tracking in deployed environments.
- Human content review and classroom trial feedback on the expanded seed.
- Teacher/mentor support playbook and escalation process.

## Recommendation

Ready for a **moderated 10-learner beta only if** a mentor is present, the team watches errors manually, and content feedback is collected after every session. Do not run this as an unsupervised school deployment yet.
