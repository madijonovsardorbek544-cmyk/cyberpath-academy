# CyberPath Academy — Prioritised Roadmap and Launch Checklist

Date: 2026-11-13. Priorities:
- **P0** critical security, data loss or production blocker
- **P1** stops a reliable paid product
- **P2** important educational, UX or business improvement
- **P3** optional

## 1. Prioritised findings

No open **P0** was found in code. One item becomes P0 if it is true on the live site: if the `LITESTREAM_*` variables are not set on Render, every deploy wipes all accounts (SECURITY_AUDIT S-5). Please check that first.

| Priority | ID | Item | Status |
| --- | --- | --- | --- |
| P0? | S-5 | Confirm Render backup variables are set; do one restore drill | **You** (needs Render access) |
| P1 | S-1 | Paid/trial access never expired | **Done (this PR)** |
| P1 | S-2 | No payment ledger, refunds or purchase history | **Done (this PR)** |
| P1 | UX-1 | Developer and misleading copy on login and pricing | **Done (this PR)**; landing still open |
| P1 | PA-1 | Production lessons are template filler | Open: content work |
| P1 | PA-2 | First paid course must be in Uzbek | Open: content work |
| P1 | S-3 | Data stored in the US; check Uzbek localisation law | **You**: legal advice |
| P1 | S-4 | Account deletion and export | Open |
| P1 | — | Real privacy policy, terms and refund policy (current pages are placeholders) | Open: draft + legal review |
| P1 | UX-2 | Mobile first screen is all navigation | Open |
| P1 | PA-8 | Two production deployments (Render and Hugging Face) | **You**: retire one |
| P2 | PA-3, UX-3 | Hide scale-dependent features (jobs, talent, leagues, events, community cases) | Open |
| P2 | PA-7 | Lesson editor form instead of raw JSON | Open |
| P2 | S-6 | Malformed JSON returned 500 | **Done (this PR)** |
| P2 | S-8 | Vite / react-router major upgrades | Open, separate PR |
| P2 | S-10 | MFA toggle in the UI (at least for admins) | Open |
| P2 | UX-5 | Button and Badge variants, colour tokens | Open |
| P2 | UX-9 | Contrast of hint text; axe and keyboard pass | Open |
| P2 | UX-10 | Lazy-load dashboard charts | Open |
| P2 | PA-4 | Certificates based on structured or mentor-graded work only | Open |
| P2 | PA-6 | Rename "AI Tutor" to what it is | Open |
| P2 | S-12 | Add ESLint and secret scan to CI | Open |
| P3 | PA-9 | Archive the Android shell | Open |
| P3 | PA-10 | Archive old planning docs | Open |
| P3 | S-11 | Mentor alerts without an owner | Open |

## 2. What this PR changed

1. `payments` table and admin ledger (record, list, refund) with server-side access grants; learner payment history on the billing page.
2. Access ends at `current_period_end`.
3. Malformed or oversized JSON returns 400/413.
4. Login page: removed "seeded demo accounts / dev-mode reset token" text in production; shows real password rules.
5. Pricing page: removed claims of recurring billing and card checkout that do not exist; school plan no longer shows "Free"; plan payment methods describe what really happens.
6. These five audit documents.

No database data is deleted or rewritten. The new table is created with `CREATE TABLE IF NOT EXISTS` on start. With `ALL_FEATURES_FREE=true` (your current live setting) learners see no difference except the honest pricing copy.

## 3. Next 30 days

**Week 1: safety and decisions**
- Check Render backup variables; restart once and confirm a test account survives.
- Decide: retire the Hugging Face Space or redirect it.
- Decide the first paid product and price to test (BUSINESS_STRATEGY §4).
- Book a short consultation on data location and the privacy policy.
- Start 30 learner interviews.

**Week 2: content**
- Write lessons 1 to 4 of the Uzbek cohort course (I can draft structure and English/Uzbek text for your review; a native speaker must review terminology).
- Build the simple lesson editor form so you are not editing JSON (P2, but it speeds up everything after).

**Week 3: trust and first sale**
- Rewrite the landing page in Uzbek around the cohort offer; hide jobs/talent/leagues/events.
- Publish privacy, terms and refund pages (after review).
- Add account deletion.
- Run the free taster session; take the first payments through the ledger.

**Week 4: run and learn**
- Start the cohort. Track attendance and submissions weekly.
- Fix the mobile navigation (UX-2).
- Write lessons 5 to 8 based on what the first sessions showed.

## 4. Launch checklist

Tick each item only after checking it on the live site.

**Functionality**
- [ ] Sign up, log in, log out, reset password (email actually arrives with `MAIL_MODE=brevo`)
- [ ] Onboarding → dashboard → first lesson → quiz → next lesson works on a phone
- [ ] Admin can record a payment and the learner immediately gets access; refund removes it
- [ ] `ALL_FEATURES_FREE` set deliberately (`false` once you charge; decide what existing free users keep)

**Content**
- [ ] Every lesson in the paid course is hand-written, reviewed, and in Uzbek
- [ ] Templated lessons hidden or replaced
- [ ] Quizzes checked for obvious answers
- [ ] Certificate text says exactly what was completed; no accreditation claims

**Security**
- [ ] `JWT_SECRET` generated, `COOKIE_SECURE=true`, `ENABLE_DEMO_BILLING=false` (already in `render.yaml`)
- [ ] Admin password strong and unique; MFA enabled for admin
- [ ] `npm audit --omit=dev` has no high or critical findings
- [ ] Demo accounts do not exist in production (or have random passwords, as the seed does in production)

**Reliability**
- [ ] Litestream variables set; restore drill done and dated
- [ ] Always-on instance decided (free tier sleeps)
- [ ] One production deployment only

**Privacy and legal**
- [ ] Privacy policy names what is collected, where it is stored, for how long, and how to delete it
- [ ] Terms of service and refund policy published
- [ ] Data-location question answered by a lawyer
- [ ] Rule for learners under 18 decided (for example parent consent for under-16s) **[needs advice]**

**Payments**
- [ ] Business registration that allows you to accept payments
- [ ] Payment instructions and receipts ready; every payment recorded in the ledger
- [ ] Refund rule written and applied the same way to everyone

**Support**
- [ ] A support contact that is answered within a day (Telegram plus email)
- [ ] Business email address instead of a personal Gmail on the pricing page (`BillingPage.tsx` fallback)
