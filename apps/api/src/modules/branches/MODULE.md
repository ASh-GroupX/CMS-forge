# Branches Module

Agent context manifest. Read this before editing the module.

## Public surface

- `BranchesService` is the only service exported by `BranchesModule`.

## Owns tables

- `branches`

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for branch create/update/deactivate audit entries.
- `core/auth.guard` for Admin-only RBAC on HTTP routes.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-ADMIN-001
- METHOD-MODULAR-001
- NFR-MAINT-001
- METHOD-TEST-001
