# Deployment Guide

This guide separates the current public demo target from a future full-stack production deployment.

## GitHub Pages public demo

CyberPath Academy can be deployed as a frontend-only GitHub Pages demo for portfolio visitors and product reviewers.

- **Hosting type:** static frontend only.
- **Frontend app:** `apps/web`.
- **API mode:** mock/demo mode with `VITE_API_MODE=mock`.
- **Best for:** quick product review, portfolio links, screenshots, and reviewer walkthroughs.
- **Not for:** real users, real authentication, real billing, or durable production data.
- **Project Pages URL format:** `https://<github-username>.github.io/<repository-name>/`.
- **This repository demo URL:** `https://madijonovsardorbek544-cmyk.github.io/cyberpath-academy/`.

The GitHub Pages workflow builds the Vite app with `VITE_GITHUB_PAGES=true`, which sets the Vite base path to `/cyberpath-academy/`. The frontend uses `HashRouter`, so static refreshes and direct route sharing work without requiring server-side rewrites.

## How to enable GitHub Pages in repository settings

Enable GitHub Pages once in the GitHub repository UI:

1. Open the GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Click **Save** if GitHub shows a save action.

After this setting is enabled, pushes to `main` can publish through `.github/workflows/deploy-pages.yml`.

## How deployment works

The GitHub Pages workflow does the following:

1. A push to `main` or a manual `workflow_dispatch` starts the workflow.
2. GitHub Actions checks out the repository.
3. Node.js 22 is installed with npm caching enabled.
4. Dependencies are installed with `npm ci`.
5. The frontend workspace is built with:

   ```bash
   npm run build --workspace web
   ```

   The build step sets:

   ```bash
   VITE_API_MODE=mock
   VITE_GITHUB_PAGES=true
   ```

6. The workflow uploads `apps/web/dist` as the GitHub Pages artifact.
7. GitHub Pages deploys the artifact to the repository's Pages URL.

## Local full-stack mode

Use local full-stack mode when you need the real Express API, SQLite persistence, backend auth/session behavior, and backend scoring routes.

```bash
npm install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
npm run db:setup
npm run dev
```

Local defaults:

- Web app: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Web API mode: `VITE_API_MODE=api`
- SQLite database path: configured by `apps/server/.env`

## Full production deployment later

A future full-stack deployment should host the backend separately from, or together with, the frontend. Render, Railway, Fly.io, and similar platforms are reasonable backend options. Vercel, Netlify, Render static sites, or other static hosting providers can host the frontend when configured with the deployed API URL.

Minimum production configuration checklist:

- Deploy the Express backend to Render, Railway, Fly.io, or similar hosting.
- Use persistent storage or move SQLite data to a managed production database plan.
- Run database setup/migrations during release and plan regular backups.
- Configure the frontend with `VITE_API_URL=https://<api-host>/api`.
- Configure `COOKIE_SECURE=true` for HTTPS deployments.
- Configure `CLIENT_URL` to the deployed frontend origin.
- Configure `APP_BASE_URL` to the deployed app origin used in emails/links.
- Configure CORS/origin checks for only trusted frontend origins.
- Configure a real email provider before sending production account emails.
- Configure a real payment provider before accepting payments.
- Use hosted/tokenized checkout only.
- Do not store raw card data.
- Add a real domain and enforce HTTPS.
- Add monitoring, uptime alerts, structured logs, and error tracking.
- Review privacy policy, terms, billing language, and any student/school data obligations with qualified counsel.

This repository already includes Docker-oriented deployment assets (`Dockerfile`, `docker-compose.yml`) and a Render manifest (`render.yaml`) that can be used as starting points, but they still require production review before real users are onboarded.

## Limitations of GitHub Pages

GitHub Pages is static hosting. It cannot run the full CyberPath Academy backend.

Limitations include:

- No server-side Express API.
- No real SQLite persistence.
- No secure production authentication/session backend.
- No backend audit logs, email delivery, or payment processing.
- Mock data only.
- Browser-side demo state may reset.

Use GitHub Pages for the public demo, not for production users or sensitive data.

## Troubleshooting: public demo application error

If the GitHub Pages demo shows **“Application Error — Something broke in the interface”**, deployment may be working while the frontend is crashing at runtime.

Use this checklist:

1. Open browser developer tools and inspect the Console for the first runtime error.
2. Click **Reset demo data** on the error page when available. In mock mode this clears CyberPath demo `localStorage` keys and reloads the page.
3. If the button is unavailable, manually remove old `cyberpath-demo-db-*` localStorage entries for the Pages origin.
4. Confirm the latest GitHub Pages workflow completed successfully.
5. Confirm the app was built with `VITE_API_MODE=mock` and `VITE_GITHUB_PAGES=true`.
6. Confirm any page used in the public demo has a matching mock handler in `apps/web/src/api/mock.ts`.

Remember:

- The GitHub Pages demo is frontend-only.
- Full backend features require a deployed API and `VITE_API_MODE=api`.
- Mock data is simulated, browser-local, and can reset between demo database versions.
