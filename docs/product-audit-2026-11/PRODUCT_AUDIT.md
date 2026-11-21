# CyberPath Academy — Product Audit

Date: 2026-11-13 · Commit audited: `ed33ead` (main) · Author: Claude, for the founder

This audit is about whether CyberPath is something a learner in Uzbekistan would trust and pay for. Severity uses the P0 to P3 scale defined in [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

## 1. Baseline (what I actually ran)

| Check | Command | Result |
| --- | --- | --- |
| Install | `npm ci` | OK (Node 22.23) |
| Build (contracts, server, web) | `npm run build` | OK |
| Server tests | `npm test` | 76/76 pass before changes, 78/78 after |
| Mock demo smoke test | `npm run smoke:mock -w web` | pass |
| Curriculum check | `npm run curriculum:verify` (after `db:setup:full`) | pass |
| Dependency audit | `npm audit` | 10 advisories: 1 high (vite, dev only), 7 moderate, 2 low. Production-only: 1 moderate (react-router) |
| Lint | none configured | No ESLint or Prettier in the repo |
| Browser check | Playwright on the mock build, 1366px and Pixel 5 | No horizontal overflow, no page errors |

The stack described in the brief is accurate: npm workspaces, Express 4 + TypeScript with raw SQL on `node:sqlite`, React 18 + Vite 5 + Tailwind with HashRouter, shared zod contracts. There is also a Kotlin Android WebView shell (`apps/android-shell`) that wraps an old copy of the web build.

## 2. The honest summary

The engineering is ahead of the product. There are 23 feature areas (lessons, labs, skill tree, spaced review, investigations, SOC simulator, SIEM lab, browser shell, exam, events, leagues, badges, discussions, community cases, teams, jobs board, talent list, portfolio, certificates, tutor, mentor dashboard, admin CMS, billing) and zero confirmed paying users. The thing a learner pays for, the lessons, is the weakest part.

## 3. Findings

### PA-1 · P1 · Production lessons are template filler
Evidence: `apps/server/prisma/seed.ts:206-207` builds every lesson from one sentence template. On a fresh production seed (`npm run db:setup`, which is what `scripts/docker-start.sh` runs), **53 of 53 lessons** use it, for example:

> "What Is Cybersecurity? teaches the learner to think defensively, distinguish core terminology, and connect abstract cyber ideas to day-to-day work…"

The glossary entries read "`<term>` explained in beginner-friendly language with defensive framing." Quizzes are generated too: 53 of 318 production questions have the right answer labelled "`<concept>` as the directly relevant concept" next to "A loosely related but incorrect idea".

The better, hand-written lessons in `scripts/seedPhase1Curriculum.ts` and `scripts/seedPremiumLessons.ts` (about 100 more) are **not loaded in production**. Even those are short: the average lesson across all 152 is about 710 characters, roughly 120 words. That is a paragraph, not a lesson.

Business impact: a learner who opens a lesson sees within a minute that it is generated text. Nobody pays for that, and anyone who shares the link will hurt the brand. This is the main reason the product is not ready to charge for, ahead of any security or payment issue.

Fix: stop adding features. Write (or commission and review) 8 to 12 real lessons for one paid course first, each 1,500 to 3,000 words with worked examples, a diagram where it helps, a practical activity and 8 to 10 real questions. Load the existing hand-written lessons into production only after you read them. Hide or remove the templated ones rather than showing them.

Please verify on the live site: I could only check what the code seeds. If you loaded more content by hand, the live numbers differ.

### PA-2 · P1 · "Uzbek-first" is not true yet
Evidence: the UI dictionary in `apps/web/src/contexts/LocaleContext.tsx` has about 50 keys (mostly navigation). Only 5 source files use it, out of 51 pages. Six free lessons have UZ/RU text (`packages/contracts/src/lessonTranslations.ts`), quizzes are English only, and `DEFAULT_LOCALE` is `en` in `render.yaml`. The app itself shows the notice "Other pages are still in English".

Impact: the positioning is the Uzbek language, and the product is English. TryHackMe and HTB already serve English-speaking learners far better.

Fix: decide that the first paid course is in Uzbek, write it in Uzbek first, and translate the core flows (sign-up, dashboard, lesson page, quiz, billing, errors). Have a native speaker with security knowledge review terminology. Keep standard English names for technical terms (SIEM, phishing, firewall) with a short Uzbek explanation.

### PA-3 · P2 · Feature sprawl before product-market fit
Evidence: 16 sidebar items for a student (Dashboard, Beta checklist, Streak & League, Practice Hub, Skill Tree, Learning Paths, Investigations, SOC Simulator, 12 Days of Defense, Analyst exam, Teams, Jobs, Safe Labs, …). The jobs board and talent list need employers you do not have; leagues need many concurrent learners; community cases need contributors.

Impact: new learners do not know where to start, and every feature is code you maintain alone. The mock API (`apps/web/src/api/mock.ts`, 2,126 lines plus `mockFeatures.ts`, 656 lines) duplicates server logic, so every change is done twice.

Fix: keep the features, but hide the ones that need scale (jobs, talent, leagues, community cases, events) behind a flag until you have 100 active learners. Put one clear path in front: "Start course → lesson → practice → quiz → next lesson".

### PA-4 · P2 · Practical labs are keyword-graded text answers
Evidence: `apps/server/src/utils/labRubric.ts` scores answers by keyword overlap. The investigations, SOC and SIEM simulations are better (structured choices against fictional evidence), and the browser shell is real interaction.

Impact: keyword grading rewards listing words, not reasoning. It is fine for practice, weak for certificates.

Fix: keep keyword labs as practice. For anything that feeds a certificate, use structured questions (choose the evidence, choose the action) or mentor review, which the exam flow already supports.

### PA-5 · P2 · Certificates are honest but thin
Evidence: no accreditation or job-guarantee language anywhere (searched for "accredit", "guarantee", "job-ready"). The CPA-1 exam has mentor grading and public verification (`/verify/:code`). Good.

Risk: a certificate built on templated lessons and keyword labs says little. Keep the wording "Certificate of completion, issued by CyberPath Academy" and never imply industry recognition.

### PA-6 · P2 · The AI tutor is a keyword matcher named "AI Tutor"
Evidence: `apps/server/src/routes/ai.ts`. It does not use a language model (by your earlier choice, to stay free).

Impact: calling it "AI Tutor" sets an expectation it cannot meet. Rename it "Study helper" or "Hint search", or build a real one later with cost limits.

### PA-7 · P2 · Admins edit lessons as raw JSON
Evidence: `apps/web/src/pages/AdminDashboardPage.tsx` uses a textarea with a JSON lesson object. There is lesson revision history on the server.

Impact: writing the content PA-1 needs will be painful. Fix: a simple lesson form (title, objectives list, Markdown body, questions) before you write the paid course.

### PA-8 · P2 · Two production deployments
Evidence: `.github/workflows/deploy.yml` pushes `main` to a Hugging Face Space, and `render.yaml` defines the Render service. The Space has no persistent storage, so sign-ups there are lost on restart.

Impact: learners may sign up on the wrong one and lose their data. Fix: retire the Space or make it redirect to the Render URL. This is your decision because it is public.

### PA-9 · P3 · Android shell is stale
`apps/android-shell` wraps an old web build. The PWA already installs on Android. Recommend archiving it until there is a reason to publish in a store.

### PA-10 · P3 · 37 planning documents in `docs/`
Many describe plans, not the current state (for example `KHAN_ACADEMY_LEVEL_ROADMAP.md`, `EXCELLENCE_ROADMAP.md`). They make it hard to know what is true. Move old ones to `docs/archive/`.

## 4. What is genuinely good

- Security basics are better than most early products (see SECURITY_AUDIT.md).
- The investigation cases, SOC simulator, SIEM lab and browser shell are real interactive learning, run fully in the browser and cost nothing to host. This is the right lab strategy for the first 1,000 users.
- Safety framing is consistent: fictional data, defensive-only, no real targets.
- Mentor/teacher tooling (cohorts, assignments, CSV export, at-risk alerts) is a real basis for paid cohorts and schools.
