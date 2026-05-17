# E2E Testing Plan — CyberPath Academy

_Last updated: 2026-05-16._

## Current status

Playwright is still the preferred browser E2E runner. I re-checked package access during this audit with:

```bash
npm view @playwright/test version --workspace web
```

The registry policy still blocks `@playwright/test`:

```text
403 Forbidden - GET https://registry.npmjs.org/@playwright%2ftest
```

Because the dependency cannot be installed, CyberPath Academy does **not** claim real browser E2E coverage yet. The beta proof uses the required mock route smoke test as the documented fallback until the package policy allows Playwright.

## Fallback route-smoke strategy in CI

The fallback command is:

```bash
npm run smoke:mock --workspace web
```

It exercises the mock API contracts behind the GitHub Pages demo, including:

- public validation paths: feedback submission and school pilot lead submission;
- student account creation, onboarding, dashboard readiness cards, skill tree, practice feedback, review queue, learning paths, labs, lab submission feedback, portfolio states, support-style validation routes, and reset behavior;
- mentor routes for cohort metrics, mastery heatmap, student rows, lab submissions, artifact reviews, review debt, lab readiness, and assignment recommendations;
- admin routes for validation metrics and pilot lead visibility;
- localization honesty checks: English remains the only enabled locale, Uzbek falls back safely instead of crashing, and missing translation keys are reported for QA.

This is not a substitute for browser automation because it does not verify DOM rendering, routing transitions, accessibility states, or form interactions in Chromium/WebKit/Firefox.

## Required browser coverage when Playwright is unblocked

Create `apps/web/e2e/public-demo.spec.ts` and cover these route-level flows in GitHub Pages/mock mode:

### Public

1. landing page opens;
2. Try Student Demo works;
3. Try Mentor Demo works;
4. Try Admin Demo works;
5. school pilot page opens;
6. pilot form submits;
7. safety page opens;
8. pricing page opens.

### Student

1. create new account;
2. onboarding renders;
3. answer diagnostic;
4. submit onboarding;
5. dashboard opens with continue learning, next best skill, daily practice, review due, next lab, portfolio suggestion, and mastery progress;
6. skill tree opens;
7. practice session opens;
8. answer one exercise and see correct/incorrect feedback, why, concept missed, mastery change, and next action;
9. review page opens;
10. learning paths opens;
11. lesson page opens;
12. labs page opens;
13. lab detail opens;
14. lab submission returns score, rubric category scores, missing evidence, safe next step, and artifact suggestion;
15. portfolio page opens with draft, in-review, and published states;
16. support/feedback opens;
17. reset demo data works.

### Mentor

1. mentor demo login;
2. teacher/mentor dashboard opens;
3. cohort dashboard visible;
4. mastery heatmap visible;
5. student table visible with risk labels and recommended next action;
6. lab submission review visible;
7. artifact review visible;
8. CSV export downloads valid rows.

### Admin

1. admin demo login;
2. admin dashboard opens;
3. pilot leads visible;
4. feedback/validation metrics visible;
5. bug reports visible if implemented.

## How to enable Playwright later

When registry access allows installing Playwright:

1. Install the test runner in the web workspace:

   ```bash
   npm install -D @playwright/test --workspace web
   npx playwright install --with-deps chromium
   ```

2. Add `apps/web/playwright.config.ts` with `VITE_API_MODE=mock` and `VITE_GITHUB_PAGES=true` in the web server environment.
3. Add `apps/web/e2e/public-demo.spec.ts` covering the public, student, mentor, and admin route flows above.
4. Change the web workspace scripts so `npm run test:e2e --workspace web` runs `playwright test` and `npm run test:e2e:ui --workspace web` runs `playwright test --ui`.
5. Add a CI step after the mock smoke test and before the production build:

   ```yaml
   - name: Browser E2E demo flows
     run: npm run test:e2e --workspace web
   ```

6. Keep `npm run smoke:mock --workspace web` in CI and the Pages deploy workflow as a fast contract guard even after browser E2E is enabled.
