# Mobile QA Checklist

_Last updated: 2026-05-17._

## Viewports to test

- 320x568 small phone
- 390x844 modern phone
- 414x896 large phone
- 768x1024 tablet portrait
- 1024x768 tablet landscape

## Pages audited

Landing, signup/login, onboarding, dashboard, skill tree, practice session, lab page, portfolio, teacher dashboard, admin dashboard, and school pilot form.

## Fixes made

- App-shell sidebar becomes horizontally scrollable mobile navigation instead of crushing content.
- Header actions wrap instead of causing horizontal overflow.
- Forms use mobile-readable input sizes and touch targets.
- Teacher student table now has mobile summary cards before the full horizontally scrollable table.
- Teacher mastery heatmap now has mobile summary cards while keeping the full desktop heatmap.
- Global styles reduce heavy shadows on very small screens and preserve minimum 320px layout.
- Beta action card gives mobile testers immediate feedback/bug-report actions without hunting through navigation.

## Manual checks

For every page, mark Pass/Fail/Notes:

| Check | Pass | Fail | Notes |
|---|---|---|---|
| No unexpected horizontal page scroll | | | |
| Primary CTA visible without founder explanation | | | |
| Buttons are at least 44px tall | | | |
| Forms stack cleanly | | | |
| Error text is readable and near the field | | | |
| Tables have mobile cards or a clear scroll affordance | | | |
| Heatmaps/charts have a readable mobile summary | | | |
| Sticky/header elements do not cover content | | | |
| Beta feedback/report-bug is reachable | | | |
| Page still works at 200% browser zoom | | | |

## Known mobile risks

- The lab terminal should be tested on real phones; text terminals are inherently cramped.
- Some admin content-management JSON editors are operational tools, not ideal phone workflows.
- Recharts visualizations still need real-device testing for touch labels and screen-reader alternatives.
