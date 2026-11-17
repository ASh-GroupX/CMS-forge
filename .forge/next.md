# One-time Irbid periodic booking import

Status: In Progress
Date: 2026-11-17
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, METHOD-AUDIT-001, UI-DESIGN-001

Prepare and execute a reviewed one-time import from the `اربد` worksheet for
the North/Irbid service center General lane. Each clear source booking keeps its
full original cell entry in Notes, maps its mileage to the closest active
periodic-maintenance option, resolves an active catalog model, and is spread
across available 15-minute slots within the source hour.

Scope:

1. Extract every booking from the Irbid worksheet and produce clear/review JSON
   artifacts without modifying the source workbook.
2. Generalize the existing authenticated periodic import panel so an admin can
   target `center_north` with an exact reviewed-row count; keep Amman behavior
   unchanged.
3. Prove parsing, duplicate protection, catalog mapping, lane capacity, RBAC,
   API audit behavior, bilingual UI, and rendered import states.
4. Deploy, then use the signed-in admin flow to import only ready Irbid rows and
   report any remaining manual-review entries honestly.

Do not bypass the existing create-appointment API, server-session permissions,
lane capacity, branch ownership, duplicate checks, or transactional audit.
Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
