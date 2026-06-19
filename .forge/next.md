# Build Task: F5-01C - Add Attachment Storage Port And In-Memory Adapter

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 5 - Attachments And Notifications

## Scope

Add the backend attachment object-storage boundary needed before upload
persistence and routes.

Do:
- Add an attachment storage port owned by the attachments module.
- Add an in-memory adapter/test double for local tests.
- Wire the adapter into `AttachmentsModule` without provider credentials.
- Add focused `test:api -- attachments` coverage for storing bytes, generating a
  non-public download token/URL shape, missing object denial, and no provider
  credential exposure.

Do not add:
- Upload or download HTTP routes
- Attachment database persistence
- Audit entries
- Malware scan behavior
- Portal or staff UI
- OpenAPI attachment paths
- Schema or migration changes
- Real S3 SDK/provider calls
- Provider credentials or secrets

## Requirement IDs

- ARCH-FILES-001
- REQ-FILES-001
- ARCH-INTEGRATION-001
- METHOD-API-001
- METHOD-AUDIT-001
- METHOD-TEST-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- attachments`
- `corepack pnpm openapi:check`
- `git diff --check`

## Acceptance

- Attachment object bytes can be stored through the module-owned storage port.
- Retrieval/download preparation uses a non-public token or URL shape, not a
  public unauthenticated attachment URL.
- Missing storage objects fail with a stable safe error before route behavior
  exists.
- The implementation has no real provider call, secret, route, database write,
  audit write, schema change, or UI change.
