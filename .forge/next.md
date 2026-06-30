# P20C - Staff DMS Lookup UI

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: P20C
Risk: High
SRS IDs: REQ-CUSTOMER-001, DMS-MAP-001, DATA-AUTO-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002, API-STANDARD-001

## Scoped Task

Wire the P20B staff DMS lookup API into the staff intake and correction UI.

The UI must let staff search by phone, customer number, VIN, or name; show DMS
match, multiple-match, not-found, provider-down, and disabled outcomes; let
staff select a match with enough distinguishing fields; preserve manual fallback;
and keep DMS/local/manual source labels visible to staff. Use the typed API
client/same-origin proxy pattern already used by staff complaint screens.

## Scope

- Reuse existing staff complaint intake/detail/correction UI patterns and i18n
  dictionaries.
- Use the P20B backend route only through the existing typed client/proxy style.
- Cover loading, empty/not-found, provider-down/disabled warning, success,
  multiple-match selection, validation error, and manual fallback states.
- Keep frontend free of provider credentials, direct DMS calls, DMS writeback,
  workflow authority, raw provider payloads, portal exposure, or hardcoded
  user-facing strings.
- Update visual/accessibility proof cases for English and Arabic where the lookup
  UI appears.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at task
  end.

## Likely Files

- `apps/web/src/app/(staff)/complaints/**`
- `apps/web/src/components/**`
- `apps/web/src/lib/**`
- `apps/web/src/i18n/**`
- `apps/web/test/**` or repo-local web proof files
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No live DMS provider, provider SDK, provider credentials, or direct browser DMS
  call.
- No DMS writeback.
- No customer portal exposure.
- No backend workflow/correction rule change unless the UI cannot safely call the
  reviewed P19B/P20B contracts.
- No P18B/P19B/P19C reviewer catch-up inside this build commit.

## Required Proof

- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:visual-review`
- `git status --short`
- `git diff --check`

## Reviewer Rule

Stop after P20C build and Forge updates. Do not start the catch-up reviewer
slice until a fresh reviewer pass reviews P20C, unless the user explicitly skips
that review. If skipped, record P20C as built but not reviewed.
