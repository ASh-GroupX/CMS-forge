# Current State

Date: 2026-11-16
Status: Role capability change verified locally; release pending
Risk: High

- Booking maintenance types release `3b93b09` reached `production`; GitHub run 43868804967 completed validation and VPS deployment successfully. The live catalog's active flags and a signed-in booking were not checked.
- Assignable permissions now cover CR manager/officer workflow and related task, deal, case, assignment, search, and report capabilities. The role editor has grouped English and Arabic explanations; built-in role grants are seeded by audited migration. Server sessions remain the authority.
- Passed the focused API suites (auth 41, admin 46, RBAC 2, portal 32, internal tickets 8, search 5, reports 46, tasks 46, deals 9, cases 29, assignments 9, complaints 101), web 243, EN/AR role editor browser proof, lint, typecheck, OpenAPI, security check. Live migration and signed-in role UAT Not Run locally.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
