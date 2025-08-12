# Security and Secrets Policy

We take user trust and data protection seriously. This document outlines how we handle vulnerabilities and secrets, and what to do if sensitive information is exposed.

## Report a vulnerability

- Email: security@internly.example (replace with your address)
- Please include reproduction steps and impact. We aim to respond within 72 hours.

## Secrets management

- Never commit real secrets or credentials to the repository (including `.env`, API keys, database URLs, JWT/Session secrets, SMTP creds).
- Use environment variables in your hosting platform for all secrets.
- Local development: create a `.env` file that is ignored by Git (keep examples in `env.example`).
- CI/CD: configure secrets in the platform settings, not in code.

## Pre-commit protection

- A git pre-commit hook is installed to block common secret patterns (e.g., `mongodb+srv://`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, private keys).
- If the hook blocks your commit and it’s a false positive (e.g., documentation), move the example to `*.md` or replace with safe placeholders.

## Incident response (leaked secret)

1. Rotate and revoke the secret in its provider (e.g., MongoDB Atlas user password, OAuth client secret, SMTP app password).
2. Audit logs for unusual access since the leak (provider activity logs, app logs).
3. Remove the secret from repo history if it was committed (see checklist in `docs/SECURITY_CHECKLIST.md`).
4. Deploy new environment variables and verify systems after rotation.

## Data protection

- Minimal data retention aligned with product needs.
- Support for user data export and account deletion.
- TLS/HTTPS required in production; secure cookies enabled behind proxies.

## Monitoring

- Enable GitHub Secret Scanning and Push Protection on this repository.
- Consider adding Sentry or similar for error monitoring.
