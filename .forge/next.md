# Repair Task: REPAIR-F4-03A-PROOF - Align Generator Manifest Test

Status: Blocked
Required model tier: BUILDER-STRONG
Risk: Medium
Phase: Phase 4 - Customer Portal
Repairs: F4-03A - Add portal-safe timeline read model

## Scope

Repair the required `corepack pnpm test` proof blocker before accepting `F4-03A`.

Keep the diff small and focused on the existing dirty generator-manifest proof
mismatch.

Required behavior:
- Do not change portal behavior unless a rerun exposes a portal-specific failure.
- Align `tools/generate-module.test.mjs` with the current generated `MODULE.md`
  frontmatter/sectioned format from `tools/generate-module.mjs`.
- Preserve `checkModuleManifests` coverage for generated manifests.
- Rerun the full `F4-03A` proof surface.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm openapi:check`

## Output

On pass, append repair evidence, update trust, mark `F4-03A` done in
`.forge/backlog.md`, write the next Phase 4 task to `.forge/next.md`, and set
`.forge/state.md` to `Ready to Build`.
