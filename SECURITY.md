# Security Policy

## Threat model

ArenaFlow is a public, read-mostly demo: the only user inputs are a free-text
question to the fan assistant and a button that requests an operations
briefing. The assets worth protecting are the Gemini API key, the Firestore
dataset, and service availability. The realistic threats are prompt-injection
attempts through the question field, abuse of the LLM endpoints (cost/DoS),
and leakage of stack traces or credentials.

## Controls in place

- **Secrets**: the Gemini API key lives in Google Secret Manager and is
  mounted into Cloud Run via `--set-secrets`. Nothing sensitive exists in the
  repo, the image, or git history; CI runs a gitleaks scan on every push.
- **Input validation**: every request body and query string is parsed with a
  strict zod schema before any logic runs; unknown keys are rejected and the
  assistant question is capped at 500 characters.
- **HTTP hardening**: helmet (CSP restricted to self), an explicit CORS
  origin allowlist, `express.json` body limit of 100 kB, and layered rate
  limits — a general API limit plus a stricter limit on the two
  Gemini-backed endpoints.
- **Prompt containment**: user text is embedded in a system-framed prompt
  that instructs the model to answer only from the venue dataset; model
  output is rendered as plain text, never as HTML.
- **Error hygiene**: one central error handler returns sanitized
  `{ code, message }` bodies; internal messages and stack traces are logged
  server-side only.

## Authentication decision

The demo is deliberately account-free: it exposes no personal data, no write
APIs beyond the rate-limited briefing trigger, and no privileged actions.
Adding accounts would enlarge the attack surface (credential storage,
session handling) without protecting anything. Firestore is reached only from
the server through its service account; no database credentials or rules are
exposed to clients.

## Reporting a vulnerability

Open a GitHub issue titled `[security]` (no exploit details), or email
usy.joseph@gmail.com. You will get a response within 48 hours.
