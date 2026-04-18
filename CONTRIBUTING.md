# Contributing

Thanks for contributing to CyberPath Academy. Keep changes disciplined. This is a security learning product, so sloppy work compounds fast.

## Ground rules

- Keep labs defensive and safe.
- Do not add offensive, live-target, malware, credential theft, or persistence content.
- Validate inputs on both client and server.
- Keep seeded demo content realistic and instructional.
- Do not weaken role boundaries or auth protections.

## Local workflow

```bash
npm install
npm run db:setup
npm run build
npm test
```

## Pull requests

Before opening a PR:

- run `npm run build`
- run `npm test`
- verify the changed flow manually
- update docs if behavior changed

## Content quality bar

Educational content should be:

- accurate
- beginner-comprehensible
- professionally worded
- explicitly defensive
- free of unsafe real-world attack guidance
