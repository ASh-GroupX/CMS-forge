# Next Task: F0-05 - Frontend Design Tokens And Shared UI Component Foundation

## Model Guidance

- Tier: BUILDER-STANDARD
- Why: This is an ordinary UI setup task — Tailwind config, shared CSS tokens, and placeholder shadcn/ui wiring. No auth, RBAC, or workflow logic involved.
- Escalate to: BUILDER-STRONG if the token contract conflicts with RTL/LTR requirements from UI-DESIGN-001.
- Do not use: BUILDER-SMALL (multiple files with interconnected config).

## Requirement IDs

- UI-DESIGN-001
- ARCH-UI-001
- CONTRACT-READINESS-001

## Task

Add the shared design token foundation required by UI-DESIGN-001 to `apps/web`.
This is a configuration-only task: tokens, Tailwind setup, and a minimal shared
component entry point. Do not implement any UI screens, business logic, auth
flows, or complaint workflow components.

## Scope

Allowed files and directories:

- `apps/web/**`
- `packages/config/**` (shared Tailwind preset or Prettier config if needed)
- `package.json`
- `pnpm-lock.yaml`

Do not modify:

- `docs/CMS_AUTO_SRS.md`
- `docs/ARCHITECTURE.md`
- `CLAUDE.md`
- `AGENTS.md`
- `.forge/forge.md`
- `.forge/policy.md`
- `.forge/models.md`

## Implementation Requirements

- Add Tailwind CSS v3 with a shared preset in `packages/config` or inline in `apps/web/tailwind.config.ts`.
- Define design tokens as CSS custom properties (or Tailwind extend values) covering: color palette (brand, neutral, status — success, warning, error, info), typography scale, spacing, border radius, shadow, focus ring, and state colors (loading, empty, error, conflict).
- Tokens must support Arabic RTL and English LTR without layout changes (use logical CSS properties where applicable).
- Add shadcn/ui and Radix UI as dependencies; wire up the `cn()` utility helper.
- Add a minimal `packages/contracts/src/design-tokens.ts` or `apps/web/src/lib/tokens.ts` exporting the token map — this is not a UI component, just a typed constant map.
- Do not add any page routes, UI screens, or navigation yet.
- Verify the web scaffold still typechecks and lints after dependencies are added.

## Must Pass

Run and report honestly:

- `corepack pnpm install --lockfile-only`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `docker compose config --quiet`

## Exit Criteria

- Tailwind CSS is configured with a shared token set.
- shadcn/ui and Radix UI are installed; `cn()` helper is available.
- Token map is exported from a typed module.
- RTL/LTR token support is documented in comments or a brief note.
- Baseline proof commands still pass.
- `.forge/evidence.md`, `.forge/trust.md`, `.forge/backlog.md`, `.forge/state.md`, and `.forge/next.md` are updated before finishing.
