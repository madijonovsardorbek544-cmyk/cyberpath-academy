# Real payments, email, monitoring, and launch notes

## Payment safety
Never store or display raw card numbers in source code, dashboards, docs, or databases. Use processor-hosted or tokenized checkout flows only.

## Uzbekistan-friendly launch architecture
- **Payme Business** for local Uzcard/Humo flows using Merchant API / Subscribe API.
- **Stripe Checkout** for international card subscriptions, with a 30-day trial on the premium plan.
- Premium plan target price: **$3 / 36,000 UZS** monthly after trial.

## Monitoring stack
This package now includes:
- request IDs
- health and readiness endpoints
- metrics endpoint
- persisted server error events in SQLite
- audit logs

To go further in production, connect:
- Sentry for frontend and backend exceptions/tracing
- uptime checks
- external log shipping / dashboards

## Email
This codebase still needs real SMTP or transactional-email credentials before password reset and billing emails become production-ready.

## Accessibility
Current pass improved keyboard focus styles and language switching. A full WCAG 2.2 audit still requires manual review and screen-reader testing.
