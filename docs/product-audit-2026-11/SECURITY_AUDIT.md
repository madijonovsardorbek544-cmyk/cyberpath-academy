# CyberPath Academy — Security Audit

Date: 2026-11-13 · Commit audited: `ed33ead` (main) · Scope: this repository and a local build only. Nothing external was tested, including the live Render site.

References: [OWASP Top 10:2025](https://owasp.org/Top10/2025/), [OWASP ASVS 5.0.0](https://asvs.owasp.org/), [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final).

Passing tests and this review do **not** mean the platform is secure or compliant. They mean the specific things below were checked.

## 1. Where things stand

The 2026-10-26 audit found one critical and six high issues (startup seed wiping the database, self-granted Premium, quiz answers in lesson payloads, students writing their own mentor feedback, no real email, role taken from the JWT, vulnerable dependencies). All were fixed in PR #21 and have regression tests in `apps/server/tests/server.test.ts` (for example "re-running the seed never wipes an existing database", "lesson payload does not include quiz answers", "role changes end the user's existing sessions"). I re-checked each of these in code and they hold.

What is left is mostly about **money, personal data and operations**, which matter now that you want paying customers.

## 2. New findings

| ID | Priority | Finding | Status |
| --- | --- | --- | --- |
| S-1 | P1 | Paid and trial access never expired | **Fixed in this PR** |
| S-2 | P1 | No trustworthy record of who paid, and no way to refund | **Fixed in this PR** (manual ledger) |
| S-3 | P1 | Personal data is stored in the US; Uzbek data-localisation rules may apply | Needs legal advice |
| S-4 | P1 | No account deletion or data export | Open |
| S-5 | P1 | Backups exist but restore was never tested | Open (needs your Render/B2 access) |
| S-6 | P2 | Malformed JSON returned 500 and was stored as a server error | **Fixed in this PR** |
| S-7 | P2 | Future payment webhooks will be blocked by the Origin check | Design note |
| S-8 | P2 | react-router 6 has moderate advisories; fix needs v7 | Open |
| S-9 | P2 | Sign-up reveals whether an email is registered | Accept for now |
| S-10 | P2 | MFA exists on the server but there is no way to turn it on in the UI | Open |
| S-11 | P3 | A mentor can update alerts that have no mentor assigned | Open |
| S-12 | P3 | No linting, so some bug classes are not caught automatically | Open |

### S-1 · Paid access never expired (fixed)
Evidence: `apps/server/src/utils/accessControl.ts` `getUserPlan()` checked only `status IN ('trialing','active')` and ignored `current_period_end`. A 30-day trial or a paid month stayed active forever. Today this is hidden because `ALL_FEATURES_FREE=true` gives everyone Premium, but the moment you turn paid plans on, every past trial would have kept full access.
Fix: access now also requires `current_period_end` to be in the future. Test: "paid access: … access expires …".

### S-2 · No payment record (fixed with a manual ledger)
Evidence: the only way to get Premium was `POST /api/platform/subscription/demo-checkout`, disabled in production. There was no table of payments, no refund state and no admin view.
Fix: new `payments` table and admin-only endpoints `GET/POST /api/admin/payments`, `POST /api/admin/payments/:id/refund`, plus `GET /api/platform/payments` for a learner's own history. An admin records a payment only after the money has arrived; the server sets access for N days. Every action writes an audit log. No card data is touched. Tests cover: a student cannot record a payment, read the ledger or refund (403); unauthenticated requests get 401; negative amounts get 400; one learner cannot see another's payments; expiry and refunds remove access; double refunds get 409.

This is deliberately not a payment integration. A real provider (Payme, Click, Uzum) must confirm payments server-to-server with signed requests. See BUSINESS_STRATEGY.md for that decision.

### S-3 · Data localisation (legal question, not a code bug)
Evidence: `render.yaml` uses region `oregon`; backups go to Backblaze B2 (your bucket region, likely US). Uzbekistan's personal data law was amended in 2021 to require that personal data of Uzbek citizens be stored on servers located in Uzbekistan. I am fairly confident this rule exists, but I have **not** verified how it applies to a small education site, what counts as personal data here, or how it is enforced. Ask a local lawyer before charging customers or signing a school.
If it applies, options are a local VPS (cost) or minimising stored data. This affects pricing and infrastructure, so it is your decision.

### S-4 · No account deletion or export
Evidence: no route deletes a user or exports their data (searched `routes/` for delete/export of accounts). Foreign keys mostly use `ON DELETE CASCADE`, so deletion is feasible. Paying customers and schools will ask for this. Recommendation: `DELETE /api/auth/me` with password confirmation that removes the user and anonymises audit logs, plus a JSON export.

### S-5 · Restore never tested
Evidence: Litestream replicates to B2 (`litestream.yml`, `scripts/docker-start.sh`). I cannot see whether your B2 variables are set on Render. If `LITESTREAM_BUCKET` is empty, the free Render disk is wiped on every deploy and restart, with no backup. **Please confirm in Render → Environment that the five `LITESTREAM_*` values are set**, then do one restore drill (restart the service, confirm a test account still exists).

### S-6 · Malformed JSON gave 500 (fixed)
Evidence: `middleware/error.ts` turned every error, including body-parser's 400 and 413, into a 500 and stored it in `app_error_events`. Anyone could fill the error table. Now 4xx errors pass through with a generic message. Test: "malformed JSON gets a 400".

### S-7 · Webhooks and the Origin check
`middleware/security.ts` `enforceOrigin` blocks every POST without an allowed `Origin` header. Payment providers call webhooks server-to-server without one. When you add a provider, mount its webhook route **before** `enforceOrigin`, and verify the provider's signature or Basic-auth credentials on every call, using a constant-time comparison. Never mark a payment paid from a browser redirect.

### S-8 · Dependencies
`npm audit --omit=dev`: 1 moderate (react-router 6.x open-redirect and related advisories; fixed only in v7, a breaking upgrade). The app uses HashRouter with internal links only, so practical risk is low. Dev-only: vite (high, dev server path traversal), esbuild, glob, minimatch, workbox chain. Dev server issues matter only if you expose `npm run dev` to a network. Plan a Vite 6/7 + react-router 7 upgrade as its own change with full manual testing.

### S-9 · Sign-up enumeration
`POST /api/auth/signup` returns 409 "An account with that email already exists". Login and reset are correctly generic. For a learning site this is an acceptable trade-off for clear UX; rate limiting (`authLimiter`, 10 per 15 min per IP+email) limits harvesting.

### S-10 · MFA has no UI
Login supports emailed codes when `users.mfa_enabled = 1`, but nothing in the app lets a user or admin turn it on. At minimum, enable it for the admin account directly in the database, or add a settings toggle.

### S-11 · Mentor alerts without an owner
`routes/mentor.ts:342` lets any mentor update an alert whose `mentor_id` is null. Low impact (status field only).

## 3. Verification checklist (ASVS-based, tailored)

Legend: ✅ verified in code and/or test · ⚠️ partial · ❌ missing

**Authentication (ASVS V6)**
- ✅ bcrypt password hashing (cost 10); strong password rule on sign-up and reset (`packages/contracts/src/schemas.ts`)
- ✅ Generic login errors, constant bcrypt work for unknown users, lockout after 5 failures for 15 minutes
- ✅ Reset tokens: 32 random bytes, stored hashed, 30-minute expiry, single use, all sessions revoked after reset
- ✅ Auth rate limiting (`authLimiter`)
- ⚠️ MFA server-side only (S-10)
- ❌ No breached-password check (optional, P3)

**Sessions (V7)**
- ✅ JWT in `httpOnly`, `SameSite=Lax`, `Secure` in production cookie; server-side `user_sessions` row checked on every request; logout and "revoke all" work; role read from DB each request
- ✅ Production refuses to start with the default JWT secret or `COOKIE_SECURE=false`

**Authorization (V8)**
- ✅ `requireRole` on admin and mentor routers; ownership checks on attempts, posts, mistakes, portfolio, assignments, teams, community cases (reviewed each `/:id` route)
- ✅ Tests: student → admin endpoints 403, student → another student's lab submission refused, mentor → unassigned student refused, payments boundaries
- ✅ Entitlements enforced on the server, not only hidden in the UI

**Input and output (V1, V2)**
- ✅ zod validation on all write routes reviewed; parameterised SQL everywhere (`run`/`one`/`many` with `?`)
- ✅ No `dangerouslySetInnerHTML` with user content (React escapes by default)
- ✅ CSV export guards against formula injection (fixed in PR #21)

**Browser security (V3)**
- ✅ Helmet; strict CSP in production (`script-src 'self'`, `frame-ancestors 'none'`); CORS limited to `CLIENT_URL`
- ✅ Double-submit CSRF token plus Origin check on unsafe methods

**Errors and logging (V16)**
- ✅ Generic 500 responses with request id; audit log for auth, role, billing and moderation events
- ⚠️ Audit logs store IP and email for rate-limit events; set a retention period (for example 90 days)

**Data protection (V14) and privacy**
- ❌ Account deletion and export (S-4)
- ❌ Retention periods not defined
- ⚠️ Data location (S-3)

**Operations (SSDF PO/PS/RV)**
- ✅ CI runs build, tests, dependency scan; Hugging Face deploy gated on CI
- ⚠️ No lint, no secret scanning in CI (`scan:secrets` exists but is not in `ci.yml`)
- ❌ Backup restore drill (S-5)
- ✅ `SECURITY.md` exists with a reporting route

## 4. Tests added in this PR
- `paid access: only admins record payments, access expires, refunds revoke, history is private`
- `malformed JSON gets a 400, not a server error`

Result: `npm test` → 78 tests, 78 pass, 0 fail (run 2026-11-13).
