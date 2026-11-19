# Current State

Date: 2026-11-19
Status: Booking closure release preflight passed; deployment pending
Risk: Critical

- Production is healthy at revision ce0669948d8a5a554040d3a0d9b37a0f6f08fd42.
- Live baseline: 885 service appointments, 2 centers, 5 complaints, 13 customers. Only the additive booking closure migration is pending.
- Fresh database and attachment backups exist on the VPS. A temporary database restore reproduced the baseline counts exactly. SHA-256 verified encrypted recovery copies are in untracked `outputs/booking-closure-backup/` on this computer.
- Root tests 78/78, focused API 51/51, EN/AR browser proof, security, backup, OpenAPI, typecheck, and lint passed.
- No production migration or booking change has run. The Amman periodic import remains paused.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
