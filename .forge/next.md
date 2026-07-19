# Radix dropdown and scrollbar convergence — complete

Status: Complete and live locally at `http://localhost:4000`
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Medium (shared form-control behavior and presentation)
SRS IDs: `UI-DESIGN-001`, `UI-SCREEN-001`, `REQ-LOCALIZATION-001`

## Delivered

- Replaced every remaining feature-level native `<select>` with the shared
  Radix/shadcn form select while preserving names, submitted values, required
  state, controlled values, defaults, disabled state, validation links, and
  localized labels.
- Standardized all menus on the requested Radix viewport geometry and Lucide
  `ChevronDown` treatment.
- Added semantic page and menu scrollbars with light/dark track, thumb, hover,
  active, horizontal, corner, and reduced-motion behavior.
- Improved select trigger, popup surface, checked item, focus, disabled, hover,
  logical RTL padding, and logical item-indicator placement.
- Preserved backend APIs, RBAC, workflow authority, and data contracts.

## Remaining operational follow-ups

1. Bootstrap the local admin with an operator-selected credential before login.
2. Repair inherited canonical OpenAPI drift in a separate contract slice.

Do not overwrite the unrelated local change in `docs/operations/runbook.md`.
