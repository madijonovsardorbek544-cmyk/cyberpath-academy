# CyberPath Academy — UX, Design and Accessibility Audit

Date: 2026-11-13 · Evidence: the mock build rendered in Chromium at 1366×900 and on a Pixel 5 profile, plus a local production build for the admin and billing pages. Screens checked: landing, login, student dashboard, lesson, pricing, admin.

## 1. Summary

The visual base is clean and consistent: one dark palette, rounded cards, a shared `components/ui.tsx` (Card, Button, Input, Select, FormField, StatCard, EmptyState, ErrorState, Loader). Pages have no horizontal overflow on a phone. The problems are about **who the copy speaks to** and **how much is on screen**, not about colours.

## 2. Findings

### UX-1 · P1 · The site talks to investors and developers, not learners
Evidence (before this PR):
- Landing (`LandingPage.tsx`): "Help validate if this should become a real school product", "Next validation target: 100 demo users, 10 serious feedback interviews…", "Built for pilots, not fake scale."
- Login (`LoginPage.tsx`): "Use the seeded demo accounts… Password reset is available in dev mode with a visible reset token." shown in production.
- Pricing (`BillingPage.tsx`): "Pricing built for real launch architecture", "First 30 days free, then recurring billing starts" (no recurring billing exists), School plan badged "Free".
- Admin: "Founder beta validation dashboard".

Impact: a 17-year-old in Samarkand or a parent paying for them reads this as unfinished or as a project, not a school.
Fixed in this PR: login and pricing copy. Still open: the landing page needs a rewrite around one learner promise (see BUSINESS_STRATEGY.md), in Uzbek first.

### UX-2 · P1 · On a phone, the first screen is chrome, not learning
Evidence (Pixel 5, student dashboard): the beta banner takes about 270 CSS px, the brand card and a horizontal tab strip of 16 items follow, then a "Signed in as" block and Logout. The first dashboard content starts around 850 px down, below the fold.
Fix: shrink the beta banner to one line with a "details" link (or remove it for logged-in users), move navigation into a bottom bar with 4 to 5 items (Home, Learn, Practice, Progress, More), and put "Continue lesson" as the first thing on the dashboard.

### UX-3 · P1 · Too many destinations for a beginner
16 sidebar entries for a student (see PRODUCT_AUDIT PA-3). A beginner cannot tell the difference between Practice Hub, Skill Tree, Learning Paths, Investigations, Safe Labs and SOC Simulator.
Fix: group into **Learn** (course, lessons), **Practice** (labs, investigations, SOC, shell), **Progress** (skills, certificates, streak), **Community** (hidden until there is one). Hide jobs, talent, leagues and events behind a flag for now.

### UX-4 · P1 · Lessons look structured but the text is generic
The lesson page layout is good (objectives, cheat sheet, examples, lesson map, checks). But production lesson text is templated (PRODUCT_AUDIT PA-1), so the good layout makes the emptiness more obvious: the cheat sheet repeats "explained in beginner-friendly language with defensive framing" for every term.

### UX-5 · P2 · No reusable design tokens beyond Tailwind defaults
Colours are hard-coded Tailwind classes (`bg-slate-950`, `text-sky-300`, `border-slate-800`) repeated across 51 pages. Buttons are styled per call (`<Button className="bg-sky-400 text-slate-950">` vs `className="border border-slate-700 bg-slate-900 text-white"`).
Fix: add `variant` props to `Button` (`primary`, `secondary`, `ghost`, `danger`) and `Badge` (`neutral`, `success`, `warning`), define colour tokens in `tailwind.config` (`brand`, `surface`, `muted`), then replace the call sites gradually. Do not restyle everything at once.

### UX-6 · P2 · The light theme is unverified
A theme toggle exists (`ThemeContext.tsx`) but most pages hard-code dark colours. I did not audit light mode; assume it is partly broken until checked.

### UX-7 · P2 · Typography is oversized on mobile
Eyebrows use wide letter-spacing ("S T U D E N T  C O M M A N D  C E N T E R") which is hard to read and wraps badly in Uzbek and Russian, where words are longer. Landing H1 is 60 px on desktop and 5 lines tall. Reduce tracking, cap H1 at about 44 px desktop and 30 px mobile.

### UX-8 · P2 · Admin content editing is raw JSON
See PRODUCT_AUDIT PA-7. This is a UX problem for you as the main content author.

### UX-9 · P2 · Accessibility (WCAG 2.2 AA), partial check
Good: skip link (`skipToContent`), visible focus rings on many controls, `FormField` ties labels to inputs, buttons have `min-h-11` (44 px) targets in several places, `aria-pressed` on the login tabs, `aria-live` on new payment messages.
To check or fix:
- Contrast of `text-slate-500` on `bg-slate-950` (used for hints) is about 4.2:1, under the 4.5:1 for body text. Use `slate-400` or lighter.
- Language attribute: already updated on locale change (`LocaleContext.tsx:55`). Good, but most page text stays English, so screen readers will read English with Uzbek pronunciation rules.
- Charts in the dashboard (recharts radar and bar) need a text alternative.
- Run an automated check (axe) and a keyboard-only pass on lesson, quiz and lab pages before launch. I did not do a full manual pass.

### UX-10 · P2 · Heavy pages on slow connections
Production build: `StudentDashboardPage` chunk 415 KB (111 KB gzip, mostly recharts), `ShellTerminal` 346 KB (90 KB gzip, xterm), main bundle 308 KB (95 KB gzip). PWA precache is 1.4 MB. On a 3G connection the dashboard (the first page after login) waits on the charts.
Fix: lazy-load the charts below the fold, or replace the radar with a simple progress list. Exclude the shell from PWA precache.

### UX-11 · P3 · Free tier sleeps
Render free instances sleep after 15 minutes; the first visit then takes 30 to 60 seconds. For paying users that looks broken. Moving to a paid instance is a cost decision for you (see BUSINESS_STRATEGY.md).

## 3. Student journey check

| Step | State | Notes |
| --- | --- | --- |
| Discover (landing) | Weak | Founder-facing copy, English |
| Sign up | OK | Clear errors; password rules now shown |
| Onboarding | OK | Goal and level questions build a roadmap |
| Dashboard | Crowded | Many widgets; "next action" exists but is not first on mobile |
| Lesson | Layout good, content thin | See PA-1 |
| Quiz | Works | Answers hidden from lesson payload (fixed earlier) |
| Labs and cases | Good | The strongest part of the product |
| Progress, certificates | OK | Public verification works |
| Billing | Now honest | Shows plan, access end date and payment history |
| Support | Exists | Bug report and feedback forms; needs a real contact (Telegram) |
| Account settings | Weak | No delete account, no MFA toggle, no email change |
