# Build Task: F6-03D1-STAFF-COMPLAINT-CREATE-WRITE-CLIENT

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 6 - Staff UI

## Goal

Add the smallest staff web write-client slice for `POST /complaints` so the next
UI task can submit the complaint create form without inventing request or error
mapping inside React.

## Scope

- Extend `apps/web/src/lib/staff-complaints-api.ts` with a typed
  `createStaffComplaint(...)` helper for the existing OpenAPI `POST /complaints`
  contract.
- Use a relative `/complaints?branchId=...` request, `credentials: "include"`,
  JSON body, and `x-csrf-token` copied only from the readable
  `cms_csrf_token` cookie.
- Map successful responses to the existing safe result shape, including complaint
  `id`, `referenceNumber`, and `status`.
- Preserve validation field errors from the standard API envelope so the UI can
  show field-level messages later.
- Extend `apps/web/test/api-client/staff-complaints-api.test.ts` with focused
  tests for success, branch query encoding, CSRF header behavior, validation
  field-error mapping, network failure, and no client-supplied role/actor/
  workflow authority.

## Out Of Scope

- Do not wire the create form UI to submit yet.
- Do not add attachment upload behavior, file reads, object URLs, or storage
  URLs.
- Do not add backend routes, API behavior, OpenAPI changes, generated clients, or
  new dependencies.
- Do not add role, actor, owner, branch-scope override, workflow, token, or
  credential parameters beyond the required `branchId` query and CSRF header.
- Do not read or expose the session cookie; only the readable CSRF cookie may be
  parsed for the CSRF header.

## Acceptance Criteria

- The helper sends the documented complaint create fields:
  `customerName`, `customerPhone` or `customerNumber`, `categoryId`,
  `subcategoryId`, `description`, `incidentAt`, `subject`, `severity`, and
  optional vehicle fields.
- The helper does not decide complaint state or authorization in the frontend.
- API error mapping keeps `code`, `message`, `correlationId`, HTTP status, and
  validation `fieldErrors` when present.
- Missing CSRF cookie is handled by omitting the header and letting the backend
  return the standard denial.
- Tests prove the write helper uses cookie credentials and does not accept client
  role/actor/workflow authority.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm openapi:check`
- `git diff --check`

## Requirement IDs

- UI-SCREEN-001
- UI-DESIGN-001
- REQ-COMPLAINT-001
- REQ-RBAC-001
- API-STANDARD-001
- METHOD-API-001
- METHOD-TEST-001
