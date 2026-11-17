# One-time Irbid periodic booking import

Status: Complete
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
4. Deployed and used the signed-in admin flow to import all 160 ready Irbid rows.
   The completion readback showed Created 160, Already imported 160, Ready 0,
   and Needs review 0. The separate 10 ambiguous source rows remain isolated for
   manual review and were not imported.

Do not bypass the existing create-appointment API, server-session permissions,
lane capacity, branch ownership, duplicate checks, or transactional audit.
Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
