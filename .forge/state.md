# Current State

Date: 2026-11-16
Status: New staff direct-send default implemented; release pending
Risk: High

- Admin staff user creation writes an explicit `user_ticket_rules` row with `canSendWithoutManagerApproval: true` as part of the existing user creation and CONFIG audit transaction. Existing users and their current ticket rules are untouched.
- The backend ticket creation service already reads this rule to bypass manager approval for cross-department tickets. Admin Hub's Internal Ticket Rules & Fields page already reads the saved row and can turn direct sending off per user.
- Passed: admin API 46/46, internal tickets API 8/8, lint, typecheck, OpenAPI. Security check passed. Live new-user creation Not Run.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
