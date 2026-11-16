# Current State

Date: 2026-11-16
Status: Custom role navigation and view defaults deployed
Risk: High

- Custom staff roles can select one view preset or Custom view with specific navigation and Admin Hub pages. These choices are stored as active role permissions; the migration grants none to built-in roles. Server session claims derive role defaults only when the user has no explicit page override. Built-in role navigation remains unchanged.
- The existing Admin role endpoint still requires `ROLES_MANAGE` and CSRF, checks permission codes and optimistic version, and writes CONFIG audit in the role transaction. New validation rejects conflicting view choices, page selections without Custom view, and role navigation edits on built-in roles.
- Passed: auth API 41/41, admin API 45/45, RBAC 2/2, web 241/241, EN/AR permission browser flow with no serious/critical Axe findings, Prisma validation, migration SQL sanity, lint, typecheck, OpenAPI and security check. EN desktop/AR mobile screenshots inspected. CI validation and VPS deployment of `57f7621` passed; the live deployment header matched. Live creation of a sample role Not Run.
- Prior Amman periodic import: 62 bookings created in General; import UI showed 62 already imported and no conflicts. A fresh authenticated read confirmed 20 General periodic bookings on 19 November with mileage and original Notes text. Two six-month entries without kilometres remain in ignored local review output. Preserve `outputs/`, `tmp/`, and `uploads/`.
