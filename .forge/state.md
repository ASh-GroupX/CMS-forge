# Current State

Date: 2026-11-14
Status: In progress — QR intake destination and customer navigation verified locally; production release pending
Risk: High

- Current production revision: d407fcdf3a2e69b149d900d70d8a392ca5c566ab; its Validate and Test and Deploy to VPS jobs completed successfully and public health returned 200 with matching revision. The specific complaint remains unverified by authenticated staff.
- Public QR page now shows Submit Complaint only; success keeps the reference and copy action without a Track action. Verified tracking and surveys remain available to the existing workflow through their dedicated routes.
- Admin settings now store a versioned, audited suggested redirect branch/department and show each eligible intake member's department. Claimed intake editor preselects the suggestion. Saving corrections retains source-branch queue scope; final redirect can transfer to an active different branch/department with the dedicated assignment command and atomic status history/audit.
- Passed locally: Prisma validation/generation, typecheck, lint, OpenAPI, security, build, root 78/78, portal API 30/30, assignments 8/8, settings 3/3, shell 232/232, customer portal submit smoke, visual 96 previews, accessibility 24 previews, web perf 5 previews, fresh isolated PostgreSQL 64 migrations/indexes and real HTTP/Admin→claim→cross-branch redirect/rollback proof. Real local QR, authenticated Admin settings, and claimed editor browser proof passed EN/AR 390/1440 with zero serious/critical axe findings; screenshots inspected. Independent GPT-6.1 Sol review accepted after OpenAPI gap repair; preferred policy model unavailable. Push and production smoke remain.
- Preserve user tmp/ and uploads/. SMS remains deferred.
