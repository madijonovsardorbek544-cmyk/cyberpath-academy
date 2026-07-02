import { execFileSync } from 'node:child_process';

const ignored = new Set(['package-lock.json', 'package.json', 'docs/PHASE_2_SECURITY.md']);
const allowedJwtValues = new Set(['change-me-to-a-long-random-secret', '${JWT_SECRET_PROD}']);
const patterns = [
  /sk_live_[A-Za-z0-9]+/,
  /pk_live_[A-Za-z0-9]+/,
  /BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/,
  /STRIPE_SECRET_KEY=(sk_|[^${]).+/,
  /JWT_SECRET=(.+)/
];

let output = '';
try {
  output = execFileSync('git', ['grep', '-nE', '(sk_live_|pk_live_|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|STRIPE_SECRET_KEY=.+|JWT_SECRET=.+)', '--', ...[...ignored].map((file) => `:!${file}`)], { encoding: 'utf8' });
} catch (error) {
  if (error.status === 1) process.exit(0);
  throw error;
}

const findings = output.split('\n').filter(Boolean).filter((line) => {
  const [file, , rest] = line.split(/:(.*)/s);
  if (ignored.has(file)) return false;
  const jwt = rest?.match(/JWT_SECRET=(.+)/)?.[1]?.trim();
  if (jwt && allowedJwtValues.has(jwt)) return false;
  return patterns.some((pattern) => pattern.test(rest ?? ''));
});

if (findings.length) {
  console.error(findings.join('\n'));
  process.exit(1);
}
