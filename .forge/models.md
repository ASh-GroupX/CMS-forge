# Model Tiers

Use tiers, not vendor-specific names.

## BUILDER-SMALL

Use for:
- docs
- copy
- small mechanical edits
- one-file changes without logic

Do not use for business logic.

## BUILDER-STANDARD

Use for:
- normal features
- 1 to 5 files
- clear acceptance criteria
- ordinary UI/API work

Escalate if verification fails.

## BUILDER-STRONG

Use for:
- auth
- RBAC
- branch scope
- complaint workflow
- SLA jobs
- customer portal privacy
- attachments
- reporting permissions
- migrations
- cross-module changes

## PLANNER

Use for:
- breaking SRS requirements into tasks
- architecture choices
- high-risk review
- repair diagnosis

Do not use PLANNER for routine coding.

## PHASE-REVIEWER

Use only for phase-end acceptance gates after every task in a backlog phase is
complete.

Preferred model choices:
- Opus 4.8 Max
- GPT-5.5 Extra High

Rules:
- Use a fresh context or a different reviewer from the phase builders.
- Review evidence, backlog status, trust notes, source changes, and all failed or
  Not Run checks.
- Do not implement feature work while reviewing; write a repair task if the phase
  should not advance.

## Default Mapping

| Work | Tier |
|---|---|
| Docs/copy | BUILDER-SMALL |
| Normal feature | BUILDER-STANDARD |
| Security/workflow/data | BUILDER-STRONG |
| Planning/review | PLANNER |
| Phase completion review | PHASE-REVIEWER |
