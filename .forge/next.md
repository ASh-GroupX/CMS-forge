# Next Task: F1-01 - Staff Auth With Argon2id And HttpOnly Sessions

Status: Ready to Build
Required model tier: BUILDER-STRONG (auth is high-risk; see `.forge/models.md`)
Risk: High

## Requirement IDs

- ARCH-AUTH-001 (Argon2id, HttpOnly cookie, server-side session validation; forbids
  localStorage tokens, plaintext passwords, client-trusted roles, external SSO)
- NFR-SEC-001 (AC1 Argon2id; AC2 HttpOnly + Secure-in-prod + SameSite cookies;
  AC5 CSRF on session-authenticated mutations)
- REQ-AUTH-001 / FR-001 staff login (AC1 login with username or email; AC2 generic
  error; AC3 logout invalidates session; AC4 locked/inactive cannot log in;
  AC5 login success/failure/logout/lock/reset are audit logged)
- METHOD-AUDIT-001 (audit entry written in the same transaction as the state change)
- METHOD-API-001 (every route documented in OpenAPI; `openapi:check` passes)
- METHOD-TEST-001 (trust-boundary tests; one allowed + one denied case)

## Prerequisites — Definition of Ready (from PHASE-0-REVIEW)

These Phase 0 carry-forward conditions block auth and MUST be handled first. If
together with auth they exceed the 1–5 file scope budget, **escalate to PLANNER**
to split this into ordered sub-tasks rather than sprawling one task.

1. **Database migration from the F0-08 schema.** The committed migration only covers
   the minimal F0-04 model. Generate and apply a Prisma migration so `User.passwordHash`,
   `User.lockedAt`, `User.lastLoginAt`, `User.departmentId`, and the audit/session
   tables exist. On Windows, run migrations inside the Docker network (see F0-04
   evidence) — Prisma's Rust engine cannot auth through Docker Desktop port-forwarding.
2. **NestJS application baseline + core kernel.** `apps/api` is currently a `node:http`
   liveness server. Stand up the real NestJS app and the shared kernel pieces auth
   depends on — at minimum: `core/prisma` (PrismaService + `withTransaction`),
   `core/errors` (AppException + global ExceptionFilter rendering the OpenAPI error
   envelope), `core/audit` (append-only `AuditService.record`), `core/correlation`
   (correlationId middleware). Use the canonical patterns in `docs/ARCHITECTURE.md` §5–6.

## Task

Implement staff authentication: login, logout, and server-side session validation,
following `docs/ARCHITECTURE.md` §6.1–6.3. Generate the `auth` module from the F0-07
generator skeleton (do not hand-roll its shape). `auth` is a special-case module, not
the golden CRUD reference.

- Login: validate username-or-email + password against active DB users; verify with
  Argon2id. Reject locked/inactive users. Return a generic error that does not reveal
  which field failed.
- Session: issue an HttpOnly, SameSite cookie (Secure in production). Sessions are
  server-side validated; roles and branch scope load from the DB on the server, never
  from client input. No tokens in localStorage.
- Logout: invalidate the active session.
- Audit: login success, login failure, logout, and lockout each write an `AUTH`
  (or `SECURITY` for lockout) audit entry. Never log passwords, OTPs, tokens, or hashes.
- OpenAPI: document `POST /auth/login`, `POST /auth/logout`, and the session/me route;
  responses use the canonical error envelope. `openapi:check` must pass.
- Out of scope here: self-service password reset (AC6) and full RBAC enforcement
  (F1-02) — only the session-derived role/branch loading needed for login. Note them
  as follow-ups; do not implement.

## Scope

Allowed (expect to escalate to PLANNER if this list cannot stay near 1–5 files + tests):

- `apps/api/src/modules/auth/**` (generated skeleton)
- `apps/api/src/core/**` (kernel pieces listed in Prerequisites)
- `apps/api/src/main.ts` (NestJS bootstrap)
- `apps/api/package.json` (nestjs, argon2, cookie/session deps)
- `packages/database/prisma/**` (migration only; schema already drafted in F0-08)
- `packages/contracts/openapi.json` (auth routes + canonical generation)
- `apps/api/test/**` or co-located `*.spec.ts`
- `package.json` / `pnpm-lock.yaml` (deps)

Do not modify:

- `docs/CMS_AUTO_SRS.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`
- `.forge/forge.md`, `.forge/policy.md`, `.forge/models.md`

## Must Pass — run, never assume

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- auth` (implement this suite for real; it currently
  fail-loud via `pending-proof.mjs` — replace with a passing auth API suite)
- `corepack pnpm openapi:check`
- `corepack pnpm build`
- `docker compose config --quiet`
- Migration applied successfully (record how it was run).

## Exit Criteria

- Active staff user logs in; locked/inactive and wrong credentials are rejected with a
  generic error; logout invalidates the session.
- Roles and branch scope come from the server session, never client input.
- AUTH/SECURITY audit entries written in the same transaction; no secrets logged.
- One allowed and one denied trust-boundary case tested (`RBAC-MATRIX-001` AC1 spirit).
- New routes in OpenAPI; `openapi:check` passes.
- Required proof commands pass and actually ran (honest labels).
- Cite SRS IDs in `.forge/evidence.md`; update `.forge/trust.md`, `.forge/backlog.md`,
  `.forge/state.md`, and `.forge/next.md` before finishing.
