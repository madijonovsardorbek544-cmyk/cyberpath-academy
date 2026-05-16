# Production Readiness

## Required environment variables

- `NODE_ENV=production`
- `PORT`
- `CLIENT_URL`
- `APP_BASE_URL`
- `DATABASE_PATH` or managed database URL in a future adapter
- `JWT_SECRET` with high entropy
- `COOKIE_SECURE=true`
- `RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`
- Email provider credentials when real email is enabled
- Monitoring/error tracking DSNs when configured

## Security controls

- Use secure cookies in production.
- Restrict CORS to the deployed frontend origin.
- Keep origin checks enabled for state-changing requests.
- Keep rate limits enabled for auth and general API traffic.
- Never store secrets in git.
- Never collect raw card data; use a PCI-compliant payment provider checkout flow.

## Operations plan

- Run migrations/seed scripts in a controlled deployment step.
- Run health checks after deployment.
- Run scheduled backups and quarterly restore drills.
- Add structured logs, uptime monitoring, and error tracking before school pilots.
- Maintain an incident response runbook and data-retention policy.

## Current status

The repo has a production-readiness path, but it is not production proven. Real monitoring, restore drills, provider integrations, and school consent workflows remain launch blockers.
