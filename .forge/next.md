# Build Task: F5-05C - Add Admin Notification Template Routes With RBAC And OpenAPI

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 5 - Attachments And Notifications

## Scope

Add admin-only HTTP management for notification templates.

Do:
- Add notifications repository/service methods for listing, creating, updating,
  activating/deactivating notification templates.
- Add admin-only routes guarded by server session, RBAC, and CSRF where
  applicable.
- Enforce Admin-only access; include one allowed and one denied API test.
- Validate code, channel, locale, subject/body, version metadata, and activation
  state before writes.
- Write `CONFIG` audit entries for template create/update/activation changes in
  the same transaction as each mutation.
- Add OpenAPI paths/schemas for the admin template routes.
- Add focused `test:api -- notifications` coverage for allowed create/update,
  denied non-admin access, validation failure before write, audit write, and no
  provider credential exposure.

Do not add:
- Admin UI
- Dispatch behavior changes
- Provider behavior
- Delivery attempt log schema
- Template preview endpoint
- Template import/export

## Requirement IDs

- REQ-NOTIFY-001
- LOCALIZATION-001
- API-STANDARD-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm openapi:check`
- `git diff --check`

## Acceptance

- Admin can manage notification templates through documented backend routes.
- Non-admin roles are denied.
- Template mutations write same-transaction `CONFIG` audit entries.
- Validation rejects unsafe or invalid template data before persistence.
- OpenAPI documents every new route.
- No UI, dispatch behavior, provider behavior, delivery-attempt schema, preview,
  import, or export behavior is added.
