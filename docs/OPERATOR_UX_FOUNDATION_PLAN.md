# Operator UX Foundation Plan

Status: **plan only, not implemented.**

Phase 10 made the accountability system work. The next phase must make it easy
for real dealership staff to use without training, copied IDs, or technical
language.

Core rule:

> If a busy employee cannot understand the field in three seconds, the UI is
> wrong.

## Product Position

The users are not system operators. They are sales, finance, registration,
delivery, service, customer relations, and managers working under pressure.
They should choose people and records by recognizable labels, not memorize IDs
or internal codes.

## Non-Negotiable UX Rules

- No raw IDs in normal forms.
- No free-text people fields.
- No free-text branch, case, deal, complaint, customer, category, department, or
  vehicle references when the system can search or list them.
- Arabic must be complete, not partial.
- Arabic screens must feel native in RTL, not translated after the fact.
- Field labels use staff language, not database language.
- Validation says what to fix, not what the system expected.
- Defaults should reduce typing: me, my branch, today, tomorrow, this week.
- Security stays real. Do not weaken production password rules just to make a
  demo easier.

## Language Rules

Use simple operational wording.

| Technical wording | English UI | Arabic UI |
| --- | --- | --- |
| Assignee | Who should do it? | مين المسؤول؟ |
| Next action | What is the next step? | ما الخطوة التالية؟ |
| Next action owner | Who follows up? | مين يتابع؟ |
| Linked entity | Related to | مرتبط بـ |
| Nudge | Remind | ذكّر |
| Case lifecycle | Case status | حالة الحالة |
| Blocker | What is blocking it? | ما سبب التعطيل؟ |

## Current Gaps

From the current staff UI:

- Login is still email-shaped instead of simple username/password.
- Quick Add Task asks for raw assignee ID.
- Linked record type and linked record ID are raw text fields.
- Deal holder, next-action owner, case owner, complaint owner, branch, customer,
  deal, case, and complaint references need searchable controls.
- Arabic coverage exists in many places but must be treated as a first-class
  acceptance gate for every screen touched.

## Build Order

### P11A - Username Login And Quick Add Picker

Small first slice. Fix the screen that staff use most.

Backend:

- Add `username` to staff users if it is not already present.
- Allow login by username or email, but label the UI as username.
- Seed simple dev usernames:
  - `admin`
  - `layla`
  - `omar`
  - `sara`
- Keep production password security. For local/demo, use seeded demo passwords
  or bootstrap overrides; do not globally allow one-digit production passwords.
- Add or reuse a staff lookup endpoint for assignable users.
- Lookup results must be server-session scoped.
- Return display label, role, branch, and user ID. The UI stores ID silently.

UI:

- Login form labels become `Username` / `Password` and Arabic equivalents.
- Quick Add Task `Assignee` becomes a searchable staff picker.
- Existing selected value displays name, role, and branch, never a raw ID.
- Keep keyboard navigation and visible focus.
- Arabic RTL smoke is required.

Proof:

- Login works with username.
- Login still works with email if backend already supports it.
- Invalid login stays generic.
- Quick Add creates a task with the selected staff member.
- User cannot assign outside allowed scope if backend rules forbid it.

### P11B - Related Record Picker For Tasks

Replace `Linked record type` and `Linked record ID`.

Backend:

- Add the smallest read-only lookup API needed for related records.
- Search by human terms:
  - customer name, phone, customer number
  - complaint reference, customer, phone
  - case reference/type/customer
  - deal label/customer/stage
- Respect RBAC and branch scope.
- Do not return staff-only or portal-private data to unauthorized users.
- Prefer existing module public services. Do not import another module's
  repository directly.

UI:

- `Related to` first chooses type from a dropdown.
- The second field becomes a searchable picker filtered by type.
- Show useful labels:
  - Customer: name + phone
  - Complaint: reference + customer + status
  - Case: type + status + owner
  - Deal: customer + stage + holder
- Store IDs silently.

Proof:

- Customer promise validation still requires a related record.
- Search respects branch scope.
- Different-branch records do not appear.
- Arabic labels and validation pass.

### P11C - Roll Pickers Across Operational Forms

Apply the same pattern everywhere raw IDs or staff names appear.

Targets:

- Task update: assignee and next follow-up person.
- Sent Tasks: nudge recipient override if present.
- Deal Handoff Board: holder, branch, customer/deal references.
- Case and complaint detail: owner, assigned staff, related records.
- CAPA owner.
- Reports filters: branch, owner, category, status where applicable.

Rules:

- Fixed small option sets use dropdowns.
- Large option sets use searchable pickers.
- Free text remains only for actual text: title, description, comment,
  corrective action, blocker reason.

### P11D - Arabic Localization Completion Pass

Every touched flow must be Arabic-complete.

Coverage:

- Login.
- Today.
- Sent Tasks.
- Promises.
- Deals.
- Cases.
- Complaint detail.
- CAPA.
- Notifications.
- Reports filters.
- Validation and success/error states.

Rules:

- No hardcoded user-facing strings in components.
- Arabic labels must be natural, not literal database translations.
- RTL layout must be verified by screenshot.
- Long Arabic text must not overflow buttons, cards, table cells, or filters.

### P11E - Operator Polish

Only after the foundation works.

- Quick date buttons: Today, Tomorrow, This week.
- Default assignee to me only where sensible.
- Auto-fill related record when creating from a complaint, case, or deal page.
- Show recent/common staff first.
- Add empty-state guidance only where it helps the user act.

## Searchable Control Guidance

Use the simplest control that works:

- Small fixed list: Radix/shadcn Select.
- Searchable person/record list: existing input + popover/list pattern, or
  shadcn Command only if already available or generated cleanly.
- Do not add a new dependency for a combobox unless the existing stack cannot
  support keyboard search/accessibility.

Minimum behavior:

- Type to search.
- Arrow keys move.
- Enter selects.
- Escape closes.
- Loading state.
- Empty state.
- Error state.
- Selected item is clear and removable where optional.

## Data Display Rules

Every picker result should show enough context to avoid mistakes.

Staff:

- Name
- Role
- Branch

Customer:

- Name
- Phone
- Customer number when available

Complaint:

- Reference
- Customer
- Status
- Branch

Case:

- Case type
- Status
- Owner
- Branch

Deal:

- Customer
- Current stage
- Holder
- Branch

## Password Policy

Do not make production passwords one digit.

Acceptable:

- Simple local/demo credentials for seeded users.
- Username-first login.
- Admin-created initial password with a clear reset path.
- Later: PIN mode only if device trust, session lock, audit, and branch policy
  are explicitly designed.

Not acceptable:

- Globally weakening production password minimums.
- Logging or showing password values.
- Returning password hashes or reset tokens.

## Proof Matrix

For every implementation slice:

- `corepack pnpm test:api -- auth`
- `corepack pnpm test:api -- tasks`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`

Add focused suites as needed:

- lookup/search API tests
- RBAC/branch denied lookup test
- username login controller/service tests

Live smoke:

1. Login with username.
2. Switch to Arabic.
3. Create a task from Today using staff picker.
4. Link it to a customer/deal/case/complaint using a searchable picker.
5. Verify no raw ID typing was needed.
6. Verify selected records display human labels.
7. Verify unrelated different-branch records are not selectable.
8. Verify Arabic RTL layout does not break.

## Guardrails

- Backend owns authority.
- Roles and branch scope come from the server session.
- UI never decides authorization.
- Customer portal privacy is unchanged.
- No admin expansion unless the slice explicitly targets admin UX.
- No AI, WhatsApp, mobile, deploy, or workflow builder.
- Do not rebuild the app shell.
- Keep slices small. If a slice touches too many forms, stop after Quick Add and
  document the remaining form inventory.
