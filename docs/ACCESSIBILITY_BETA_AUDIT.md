# Accessibility Beta Audit

_Last updated: 2026-05-17._

## Scope checked

Checked the beta-critical surfaces requested for 10 students and 2 teachers: public landing/pricing/safety/school-pilot/support/bug-report/public artifact, student signup/onboarding/dashboard/skill tree/skill detail/practice/review/paths/lesson/labs/lab detail/portfolio/billing/feedback/logout, teacher demo/dashboard/cohort/heatmap/student table/lab review/artifact review/export/feedback, and admin demo/dashboard/pilot leads/bugs/feedback/validation/content/platform ops.

## Fixed for beta

- Added reusable accessible primitives: `FormField`, `ErrorMessage`, `AccessibleCardAction`, `PageHeader`, `EmptyState` with action support, and `LoadingRegion`.
- Loading regions now use `role="status"` and `aria-live="polite"`.
- Primary buttons have stronger focus and touch-target styling; critical form submit buttons now use explicit submit behavior where needed.
- Inputs, textareas, and selects use 16px mobile text, visible focus rings, clearer placeholder contrast, and minimum 44px touch targets.
- Login/signup and bug-report forms now have explicit labels, autocomplete hints, recoverable error messaging, and submit buttons with explicit type.
- The app shell already had skip-to-content; it now keeps keyboard-visible focus styling on icon controls and makes navigation usable as horizontal scroll on small screens.
- Beta feedback prompts now label all fields and provide clear optional wording.
- Major signed-in pages now include a lightweight beta action card with “Was this confusing?”, “Report bug”, and “Copy page name”.

## Still needs manual verification

- Screen-reader reading order for every large dashboard card group.
- Browser zoom at 200% and 400% on all pages.
- Color contrast measurement with tooling such as axe, Lighthouse, or Accessibility Insights.
- Full keyboard pass on the lab terminal; terminal widgets can be difficult for screen readers and should be tested with real assistive tech.
- Icon decorative state review across every lucide icon.

## Manual screen-reader checklist

For VoiceOver, NVDA, or ChromeVox:

1. Open the landing page and confirm the beta banner is announced once, not repeatedly.
2. Use the skip link to move directly to main content.
3. Tab through login, demo-login buttons, signup fields, and password reset.
4. Complete onboarding using only keyboard and confirm the completion message is understandable.
5. Open dashboard and confirm headings, stats, and next action are understandable without visual layout.
6. Start one practice question and confirm answer choices and feedback are announced.
7. Open one lab, read the safety guardrails, enter answers, and submit.
8. Create a portfolio artifact and confirm every field has a spoken label.
9. In teacher dashboard, verify mobile summary cards and full table/heatmap affordances are announced.
10. In admin dashboard, verify feedback, bugs, and pilot metrics are navigable by headings.

## Beta accessibility decision

Accessible enough for moderated beta observation, not enough for an accessibility compliance claim. The team should run axe/Lighthouse and one human screen-reader pass before any school pilot.
