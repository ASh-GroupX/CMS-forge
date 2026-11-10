# External data API

The deployed API reads its configured PostgreSQL database through Prisma when
each request arrives. Requests use `Authorization: Bearer <api-key>`. The key is
created by an administrator with `INTEGRATIONS_MANAGE` using the staff session
and CSRF token. Store the returned `secret` securely; it is shown only once.

An authorized administrator can manage keys in the website at
`/admin/api-keys`. This workspace uses the existing website sign-in; it does
not ask for an additional password. Choose resources and branches, create a
key, copy its one-time secret or ready request, test the selected resources,
and stop access later from the issued-key list. Previously issued secrets
cannot be recovered from the list.

## Key management

- `POST /api/integrations/data-api-keys` with `name`, `scopes`, and either
  `allBranches: true` or `branchIds: ["branch-id"]`. Supported scopes are
  `customers:read`, `complaints:read`, `tasks:read`, `appointments:read`.
- `GET /api/integrations/data-api-keys` lists key metadata without secrets.
- `POST /api/integrations/data-api-keys/{id}/revoke` immediately disables a key.

## Read endpoints

- `GET /api/external-data/customers`
- `GET /api/external-data/complaints`
- `GET /api/external-data/tasks`
- `GET /api/external-data/appointments`

Each endpoint accepts `limit` (1–100, default 100), `cursor`, and optional
`branchId`. The branch filter can narrow the key's stored scope. Use the
returned `nextCursor` for the next request until it is `null`. Records are
ordered by stable ID. Every successful page read writes a metadata-only audit
entry with resource, effective branch scope, and row count.

Example:

```http
GET /api/external-data/complaints?limit=100
Authorization: Bearer cms_live_<secret>
```

The response is `{ "items": [...], "nextCursor": "..." }`. Follow-up request:

```http
GET /api/external-data/complaints?limit=100&cursor=<nextCursor>
Authorization: Bearer cms_live_<secret>
```

Customer phone and email require `customers:read`. Appointment exports omit
phone numbers and internal notes. Task exports omit confidential and restricted
tasks. The API never returns audit logs, internal comments, attachments, API key
hashes, or provider credentials in these feeds.
