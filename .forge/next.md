# Release booking closure calendar without data loss

Status: In Progress
Date: 2026-11-19
Risk: Critical
SRS: REQ-BOOK-CALENDAR-001, NFR-DATA-001, NFR-AVAIL-001

Scope: Verify production state and pending migrations. Create a fresh database dump, validate the archive and restore it into an isolated temporary database, and preserve an independent recovery copy before deploying. Run production checks, verify record counts and booking closure behavior, and record proof. Do not run imports or alter existing appointments.

Release gate: Stop before any migration if the backup/restore proof fails, if unexpected pending migrations appear, or if an independent recovery copy cannot be secured. Production deployment must retain the existing data and attachment storage.
