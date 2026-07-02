# Phase 2 Security Implementation

Phase 2 adds defense-in-depth controls around authentication without changing the existing cookie-based login flow.

## Implemented controls

- **CSRF:** authenticated cookie requests must include the `X-CSRF-Token` header matching the readable `cyberpath_csrf` cookie. Bearer-token API clients remain supported.
- **Session revocation:** every new login/sign-up records a server-side session ID. Logout revokes the active session and `POST /api/auth/sessions/revoke-all` revokes all sessions for the current user.
- **MFA foundation:** accounts with `users.mfa_enabled = 1` receive a short-lived login challenge. Verify with `POST /api/auth/mfa/verify` using `{ challengeId, code }`. Development responses include `devMfaCode` for local testing only.
- **Better rate limiting:** general API traffic is IP-limited, while auth endpoints use an IP + email key, skip successful requests, and emit audit events on throttling.
- **Security audit logs:** login failures, lockouts, MFA events, CSRF blocks, origin blocks, and rate-limit events are written to `audit_logs`.
- **Strict Origin validation:** unsafe HTTP methods require an allowed `Origin` (`CLIENT_URL` or `APP_BASE_URL`).
- **Dependency scanning:** run `npm run scan:deps` or `npm run security:scan`.
- **Secret scanning:** run `npm run scan:secrets` or `npm run security:scan`.
- **Login protection:** repeated password failures lock an account for 15 minutes after five failures.

## Migration notes

The SQLite bootstrap adds the following tables and columns automatically on startup:

- `user_sessions`: tracks token IDs, expiry, revocation time, creation time, and last-seen time.
- `mfa_challenges`: stores hashed six-digit MFA codes and challenge expiry/usage timestamps.
- `users.mfa_enabled`: opt-in MFA flag, default `0`.
- `users.failed_login_count`: consecutive failed password attempts, default `0`.
- `users.locked_until`: temporary lockout timestamp after repeated failures.

Existing sessions that were issued before Phase 2 do not include a `sessionId` claim. They continue to verify until normal JWT expiry to avoid breaking existing authentication. New sessions are revocable server-side.

## Operational checklist

1. Deploy the server so `initDb()` applies additive schema changes.
2. Confirm `CLIENT_URL` and `APP_BASE_URL` exactly match production origins.
3. Ensure frontend clients send `X-CSRF-Token`; the web app does this automatically.
4. Run `npm run security:scan` in CI before release.
5. Review admin audit logs after deployment for blocked origins, CSRF failures, and auth lockouts.
