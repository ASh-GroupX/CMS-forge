# Next Task: F0-02 - Real Toolchain Proof Scripts

## Model Guidance

- Tier: BUILDER-STRONG
- Why: The toolchain gates become the baseline proof surface for every later task.
- Escalate to: PLANNER if a required check conflicts with the architecture rules or SRS proof contract.
- Do not use: BUILDER-SMALL.

## Requirement IDs

- CONTRACT-READINESS-001
- CONTRACT-READINESS-002
- ARCH-STACK-001
- ARCH-API-001
- METHOD-MODULAR-001
- METHOD-API-001
- UI-DESIGN-001

## Task

Replace the F0-01 scaffold-only checks with real baseline toolchain checks.

Keep this limited to repository tooling. Do not implement domain modules, UI screens,
auth, workflow behavior, database tables, or the module generator.

## Scope

Allowed files and directories:

- `package.json`
- `pnpm-lock.yaml`
- `.gitignore`
- `.prettierrc`
- `tsconfig.base.json`
- `apps/api/**`
- `apps/web/**`
- `packages/database/**`
- `packages/contracts/**`
- `packages/config/**`
- `tools/**`

Do not modify:

- `docs/CMS_AUTO_SRS.md`
- `docs/ARCHITECTURE.md`
- `CLAUDE.md`
- `AGENTS.md`
- `.forge/forge.md`
- `.forge/policy.md`
- `.forge/models.md`

## Implementation Requirements

- Keep `packageManager: pnpm@9.15.4`.
- Keep all SRS proof script names in root `package.json`.
- Make `lint` perform a real formatting or static check instead of only checking scaffold presence.
- Keep `typecheck` strict for every scaffold package.
- Keep `test` as the smallest real runnable test that proves the scaffold contract.
- Keep `openapi:check` as a real check of the committed OpenAPI shell.
- Keep not-yet-implemented proof commands honest; they must not produce fake passing coverage for API, E2E, visual, security, DB, backup, or performance gates.
- Do not add broad test framework scaffolding unless needed for these baseline checks.

## Must Pass

Run and report honestly:

- `corepack pnpm install --lockfile-only`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`

If a command cannot run on this machine, mark it `Not Run` and explain why.

## Exit Criteria

- Baseline toolchain checks are real and runnable.
- Placeholder proof scripts remain impossible to mistake for passed coverage.
- `.forge/evidence.md`, `.forge/trust.md`, `.forge/backlog.md`, `.forge/state.md`, and `.forge/next.md` are updated before finishing.
