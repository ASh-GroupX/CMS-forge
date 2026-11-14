# Current State

Date: 2026-11-14
Status: Complete — QR intake destination and customer navigation deployed and verified
Risk: High

- Current production revision: 1714138ce612a6cdd595a8be9f1134eed57ec68f; GitHub run 43566832522 completed success in Validate and Test and Deploy to VPS. Live health, portal options, EN/AR portal and protected Admin API smoke passed with matching deployment revision. The earlier named complaint still requires authenticated staff inspection.
- Public QR page now shows Submit Complaint only; success keeps the reference and copy action without a Track action. Verified tracking and surveys remain available to the existing workflow through their dedicated routes.
- Admin settings now store a versioned, audited suggested redirect branch/department and show each eligible intake member's department. Claimed intake editor preselects the suggestion. Saving corrections retains source-branch queue scope; final redirect can transfer to an active different branch/department with the dedicated assignment command and atomic status history/audit.
- Passed locally: Prisma validation/generation, typecheck, lint, OpenAPI, security, build, root 78/78, portal API 30/30, assignments 8/8, settings 3/3, shell 232/232, customer portal submit smoke, visual 96 previews, accessibility 24 previews, web perf 5 previews, fresh isolated PostgreSQL 64 migrations/indexes and real HTTP/Admin→claim→cross-branch redirect/rollback proof. Real local QR, authenticated Admin settings, and claimed editor browser proof passed EN/AR 390/1440 with zero serious/critical axe findings; screenshots inspected. Independent GPT-6.1 Sol review accepted after OpenAPI gap repair; preferred policy model unavailable. Production public QR EN/AR 390/1440 and protected Admin denial checks passed. No live complaint was submitted in production; Admin must configure actual destination/team values. SMS remains deferred.
- Preserve user tmp/ and uploads/. SMS remains deferred.
