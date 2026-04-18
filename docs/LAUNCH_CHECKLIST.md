# Launch Checklist

Use this before calling the product public-ready.

## Must pass

- [ ] `npm install`
- [ ] `npm run db:setup`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] demo accounts can log in
- [ ] onboarding works
- [ ] lessons load
- [ ] quizzes submit
- [ ] labs submit
- [ ] mentor feedback works
- [ ] admin dashboard loads
- [ ] privacy / terms / safety pages are reachable

## Production settings

- [ ] strong `JWT_SECRET`
- [ ] `COOKIE_SECURE=true` behind HTTPS
- [ ] real `CLIENT_URL` and `APP_BASE_URL`
- [ ] SMTP configured or password reset intentionally disabled
- [ ] backups scheduled
- [ ] logs collected
- [ ] monitoring attached

## Honest launch label

Use **Beta** or **Early Access** until real users validate learning outcomes and operational stability.
