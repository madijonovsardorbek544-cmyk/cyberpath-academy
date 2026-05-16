# Incident Response Runbook

## Severity levels

- SEV1: confirmed data exposure, account compromise, or production outage affecting most users.
- SEV2: suspected exposure, partial outage, or broken authentication/authorization flow.
- SEV3: isolated bug, content safety issue, or degraded non-critical feature.

## Response steps

1. Triage report and assign severity.
2. Preserve logs and relevant evidence.
3. Stop the bleeding: disable affected feature, rotate secrets, or block unsafe content.
4. Notify internal owner and school contact if real learner data may be affected.
5. Patch, test, deploy, and monitor.
6. Document timeline, root cause, impact, and prevention.
7. Add regression tests or content validation checks.

## Safety content incident

If unsafe cybersecurity content is reported, immediately unpublish or hide it, document the unsafe pattern, add validation coverage, and republish only after review.
