# CyberPath Academy excellence roadmap

This document exists to keep the product from becoming a random pile of features. CyberPath Academy should become excellent in this order: learning depth, practice quality, feedback quality, retention, safety, accessibility, then monetization.

## Current honest status

CyberPath Academy is a serious beta. It has a full-stack app, auth, dashboards, seeded lessons, quizzes, labs, analytics, support flows, admin tools, and operational scaffolding. It is not yet a best-in-class educational platform because the learning library, lab engine, production payment system, accessibility validation, monitoring, and test coverage still need major depth.

## North-star product standard

A learner should be able to arrive with zero cybersecurity background and leave with:

- clear beginner fundamentals
- measurable skill mastery
- safe defensive practice experience
- a mistake history and review queue
- portfolio artifacts that can be shown in applications
- role readiness signals for beginner cyber paths
- multilingual support in English, Uzbek, and Russian

## Non-negotiable product principles

1. Defensive-only cybersecurity education. No live-target exploitation, malware, credential theft, evasion, persistence, or real-user phishing guidance.
2. Every lesson must end with practice, not just reading.
3. Every wrong answer must produce a useful next action.
4. Every lab must be fictional, authorized, and safely scoped.
5. Premium claims must be earned by real depth, not UI polish.
6. Payments must use hosted/tokenized providers only. Raw card numbers must never be stored or displayed.
7. Accessibility must be validated manually, not assumed because Tailwind classes look clean.

## Phase 1: Learning depth

Target before serious public launch:

- 100 beginner-to-intermediate lessons
- 500 quiz questions
- 25 safe labs
- 10 guided portfolio projects
- 150 glossary terms
- 5 complete role paths

Initial role paths:

- Cyber Foundations
- Networking for Cybersecurity
- Linux and Terminal Basics
- Blue Team / SOC Analyst Level 1
- Web Security Defense
- Secure Coding Basics
- AI Security Awareness

Each lesson must include:

- learning objectives
- plain-language explanation
- visual/analogy section
- key terms
- worked example
- mini-check questions
- common mistakes
- defensive real-world connection
- final quiz
- remediation link for weak answers

## Phase 2: Real lab engine

Replace keyword-only lab grading with rubric-based scoring.

Each lab should support:

- scenario briefing
- fictional dataset
- step-by-step tasks
- structured answer fields
- hints
- rubric criteria
- evidence checklist
- retry attempts
- final report output
- mentor review mode

Priority labs:

- phishing email triage
- suspicious login log review
- password policy audit
- access-control review
- incident report writing
- secure code review for toy snippets
- network diagram risk review
- vulnerability prioritization from fictional findings

## Phase 3: Feedback and mastery intelligence

The platform should identify why the student is weak, not only show that they are weak.

Add mistake classification:

- knowledge gap
- vocabulary/term confusion
- careless reading
- wrong concept mapping
- weak evidence
- skipped prerequisite
- timing/attention issue

Add mastery signals:

- skill confidence
- review health
- forgetting risk
- prerequisite gaps
- role readiness
- proof-of-work strength
- recommended next action

## Phase 4: AI tutor upgrade

The tutor should become a controlled course assistant, not a generic chatbot.

Required upgrades:

- retrieve from lesson chunks and glossary
- cite lesson/source sections inside answers
- switch modes: explain, hint, quiz me, check my answer, give example, summarize
- adapt to beginner/intermediate/advanced level
- log unanswered questions as content gaps
- stronger safety classifier beyond keyword blocklists
- admin review queue for unsafe or low-confidence tutor interactions

## Phase 5: Monetization and access control

Plans:

- Free: limited lessons, limited labs, basic progress tracking
- Premium trial: first month free
- Premium paid: $3 / 36,000 UZS monthly

Production payment requirements:

- Stripe Checkout for international cards
- Payme Business or similar hosted/tokenized flow for Uzbekistan
- webhook signature verification
- server-side subscription enforcement
- billing email receipts
- failed-payment handling
- admin subscription audit view

Never store raw card numbers, Uzcard/Humo details, or personal payment credentials in the repository, database, frontend, or docs.

## Phase 6: Production operations

Before public launch:

- Sentry for frontend and backend errors
- uptime checks
- request tracing with request IDs
- daily backup and restore test
- database migration strategy
- structured logs
- admin error-event dashboard
- alerting for auth abuse, webhook failures, and 500-error spikes

## Phase 7: Accessibility and localization

Accessibility:

- keyboard-only navigation audit
- screen-reader pass
- color contrast pass
- focus order validation
- reduced-motion support
- form error announcement checks
- mobile tap-target validation

Localization:

- full UI strings in English, Uzbek, and Russian
- lesson content translations
- quiz translations
- lab translations
- email translations
- error-message translations
- Uzbek-first explanations, not only direct English translations

## Phase 8: Testing standard

Minimum before serious launch:

- 80+ backend integration tests
- 30+ frontend component/route tests
- auth and authorization regression tests
- quiz scoring tests
- lab scoring tests
- mistake ownership tests
- payment webhook tests
- subscription access tests
- AI tutor safety tests
- accessibility smoke tests

## Build order

Do not build randomly. Use this order:

1. Expand content.
2. Upgrade labs.
3. Improve feedback/mistake intelligence.
4. Enforce subscriptions.
5. Add real payments and email.
6. Add monitoring.
7. Complete localization.
8. Run accessibility audit.
9. Increase tests.
10. Launch as beta, then improve with real learner data.
