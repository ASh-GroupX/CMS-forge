# Auth Module

> Agent context manifest. Read this before editing the module.

- Public surface: `AuthService` - credential verification and, in later tasks, session lifecycle.
- Owns tables: `users` for credential reads; staff session table will be added in `F1-01C`.
- May depend on: `core/*` for Prisma and errors. No frontend, provider SDK, or other module repository imports.
- SRS: CONTRACT-READINESS-002, ARCH-AUTH-001, REQ-AUTH-001, NFR-SEC-001, API-STANDARD-001, METHOD-TEST-001.
