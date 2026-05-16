# E2E Testing Plan — CyberPath Academy

_Last updated: 2026-05-16._

## Current status

Playwright is the preferred browser E2E runner, but installing `@playwright/test` was blocked in this environment by registry policy:

```text
403 Forbidden - GET https://registry.npmjs.org/@playwright%2ftest
```

Because the dependency could not be installed, this upgrade does **not** claim real browser E2E coverage. The beta proof now uses the required mock route smoke test as a fallback until the package policy allows Playwright.

## Fallback route-smoke strategy in CI

The fallback is `npm run smoke:mock --workspace web`. It exercises the mock API contracts behind the GitHub Pages demo, including:

- public feedback and school pilot lead submission,
- student signup, onboarding, dashboard, skill tree, practice, review, labs, portfolio, support-style validation routes, and reset behavior,
- mentor dashboard contract checks for cohort metrics, heatmaps, student rows, lab submissions, and artifact reviews,
- admin validation metrics and pilot lead visibility,
- localization honesty checks for English default behavior and disabled partial locales.

This is not a substitute for browser automation because it does not verify DOM rendering, routing transitions, accessibility states, or form interactions in Chromium/WebKit/Firefox.

## How to enable Playwright later

When registry access allows installing Playwright:

1. Install the test runner in the web workspace:

   ```bash
   npm install -D @playwright/test --workspace web
   npx playwright install --with-deps chromium
   ```

2. Add `apps/web/playwright.config.ts` with `VITE_API_MODE=mock` and `VITE_GITHUB_PAGES=true` in the web server environment.
3. Add `apps/web/e2e/public-demo.spec.ts` covering the public, student, mentor, and admin route flows listed in `docs/FULL_PROJECT_AUDIT.md`.
4. Change the web workspace scripts so `npm run test:e2e --workspace web` runs `playwright test` and `npm run test:e2e:ui --workspace web` runs `playwright test --ui`.
5. Add a CI step after the mock smoke test and before the production build:

   ```yaml
   - name: Browser E2E demo flows
     run: npm run test:e2e --workspace web
   ```

6. Keep `npm run smoke:mock --workspace web` in CI and the Pages deploy workflow as a fast contract guard even after browser E2E is enabled.

## Required first browser spec

Create `apps/web/e2e/public-demo.spec.ts` and cover:

- public landing, student/mentor/admin demo CTAs, school pilot form, safety, pricing;
- student signup, onboarding diagnostic, dashboard, skill tree, practice, review, paths, lesson, labs, lab submission, portfolio, feedback/support, reset;
- mentor dashboard, cohort heatmap, student table, lab review, artifact review;
- admin dashboard, pilot leads, validation metrics, bug reports when implemented.
