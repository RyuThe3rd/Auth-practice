# Auth Lab 01 — Document vault

A deliberately incomplete backend exercise. Implement **only `src/security.js`**.
The Express API, login, session issuance, fixture database, browser UI, and tests are provided.
Protected endpoints initially return **501**, not insecure success. No solution is included.

## Run

Node.js 22+ and npm:

```sh
npm install
npm start
# open http://localhost:3000
npm run test:smoke
npm run test:challenge
```

Smoke tests should pass immediately. Challenge tests should fail until you implement the middleware.
`npm test` runs both. Tests start their own API on a random local port; no running server is needed.

## Scenario

Alpha and Beta share one document platform. Every user belongs to exactly one organisation.
A tenant is an organisation. Admins are organisation administrators, never global administrators.

All fixture accounts use `Practice-only-123!`:

| Email | Role | Tenant | Own document |
|---|---|---|---|
| alice@alpha.test | member | alpha | doc-alice |
| bob@alpha.test | member | alpha | doc-bob |
| vera@alpha.test | viewer | alpha | doc-vera |
| ada@alpha.test | admin | alpha | none |
| ben@beta.test | admin | beta | doc-beta |
| disabled@alpha.test | member (inactive) | alpha | none |

## Your contract

### 1. authenticate(req, res, next)

Only accept an `Authorization: Bearer <token>` header. Scheme matching is case-insensitive;
allow surrounding whitespace and whitespace between the scheme and token, but exactly two parts.
Never accept identity, role, tenant, or tokens from query strings, request bodies or custom headers.

Tokens are opaque random strings, **not JWTs**. Import `tokenDigest`, `sessions`, and `users`
from `store.js`. The sessions Map is keyed by SHA-256 digest, not the raw token.
Each session has `{userId, expiresAt, revoked}`; expiry is Unix time in milliseconds.
Reject missing/malformed/unknown/expired/revoked sessions with **401**.
A session with `expiresAt <= Date.now()` is expired.
Reject a missing or inactive user with **401**. Load the current user on EVERY request:
role changes and disabling an account must affect already-issued sessions.
Set `req.user` to the authoritative user record and call `next()` only on success.
Errors return JSON with an `error` string; exact wording is your choice. Never echo tokens.

### 2. requireRole(...allowedRoles)

Return middleware. Missing `req.user`: **401**. A role outside the allowlist: **403**.
Otherwise call `next()`. Empty allowlists must deny. Never call `next()` after sending a response.

### 3. authorizeDocument(action)

Return middleware. `req.document` is already loaded by the API.
Missing `req.user`: **401**. Missing document: **404**.
Any document from another tenant: **404**, even for an admin, to hide its existence.
Within the same tenant apply this policy:

| Role | Read own | Read another user's | Write own | Write another user's |
|---|---|---|---|---|
| viewer | yes | no | no | no |
| member | yes | no | yes | no |
| admin | yes | yes | yes | yes |

Same-tenant policy denials: **403**. Unknown roles and actions: deny with **403**.
Known actions are exactly `read` and `write`. Success: call `next()`.

## API already wired

| Method/path | Access |
|---|---|
| GET /api/health | public |
| POST /api/login | public; body `{email,password}`; returns `{token}` |
| GET /api/me | authenticated |
| POST /api/logout | authenticated; revokes current token |
| GET /api/admin/users | admin; lists only own tenant |
| GET /api/documents/:id | document read policy |
| PATCH /api/documents/:id | document write policy; body `{title}` only |

## How to work

1. Read the contract and try a protected endpoint to observe 501.
2. Implement authentication; test valid, missing, expired and revoked credentials.
3. Implement role checks, then document authorization.
4. Use the UI as Alice, Vera, Ada and Ben. Try requests outside their permissions.
5. Run the full suite and add your own edge cases. Existing tests are examples, not the complete grading rubric.
6. Commit your work to GitHub and share the repository URL plus commit hash for review.

Keep the fixture, route wiring and existing assertions unchanged. Add tests freely.
An independent review should check code AND exercise the API, including cases not in this suite.
Review results should identify severity, affected code, a reproducible request, and a fix hint.
Ask for hints first if you don't want the solution revealed.

## What this exercise deliberately leaves out

This is a local, in-memory learning fixture, not a production authentication service.
Login/session issuance are supplied to keep your work focused on middleware.
No registration, database setup, JWT signing, refresh tokens, OAuth, password reset,
TLS, distributed session persistence, login rate limiting or cookie/CSRF lifecycle is included.
Tokens live only in browser memory; refreshing loses the local token, while logout revokes it server-side.
The server binds to loopback. Use fixture credentials only.

## Next challenges

02: cookie sessions, CSRF protection and logout lifecycle.
03: JWT validation (signature, issuer, audience, expiry), rotation and revocation tradeoffs.
04: multi-tenant permissions with teams, document sharing and privilege changes.
05: password reset tokens, single use, expiry and account enumeration.

SAST can find some code patterns. Dependency auditing is separate. Neither proves that
business authorization rules are correct: use adversarial API tests as well.
