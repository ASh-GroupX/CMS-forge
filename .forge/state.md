# Current State

Status: Ready to Build
Phase: Phase 1 - Security Baseline
Next Task: F1-01 - Staff Auth With Argon2id And HttpOnly Sessions

## Notes

- The project currently contains `docs/CMS_AUTO_SRS.md`.
- No application code exists yet.
- This Forge was initialized cleanly from the CMS-Auto SRS.
- The legacy Buildra `.forge/prompts` folder was intentionally not copied.
- F0-00 is complete; the agent rulebook and architecture blueprint are wired into Forge.
- F0-08 now holds the coherent Prisma data model task before any feature migrations.
- F0-01 is complete; the pnpm workspace scaffold, package boundaries, OpenAPI shell, Prisma shell, and PostgreSQL/Redis compose file are in place.
- F0-02 is complete; baseline lint, typecheck, test, build, and OpenAPI checks are real and runnable.
- F0-03 is complete; Docker Compose defines all four services (postgres, redis, api, web). Images built successfully.
- F0-04 is complete; minimal Prisma schema with SRS-aligned role and complaint-state enums; idempotent seed script verified against live postgres in Docker. Migration file committed. Schema will be expanded in F0-08.
- F0-05 is complete; added design tokens, Tailwind config, and shadcn/ui foundation to apps/web.
- F0-06 is complete; Node-based lint enforces current architecture boundaries, tests enforce coverage thresholds, OpenAPI scaffold drift is checked, and pending UI/perf proof commands are tested fail-loud.
- F0-07 is complete; dependency-free module generator creates canonical API module skeletons, refuses invalid names/overwrites, and keeps `branches` as the future golden CRUD reference.
- F0-08 is complete; Prisma schema now drafts the MVP core data model with first-class complaint history, audit, SLA, portal verification/session, comments, attachments, approvals, notification, survey, and compensation storage.
- Known limitation: Prisma's Rust query engine cannot connect through Docker Desktop's Windows port-forwarding layer (P1000). DB operations must be run inside the Docker network (see evidence). This does not affect application code.
