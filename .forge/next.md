# CMS-Auto redesigned UI — live local review

Status: Redesigned production build live at `http://localhost:4000`
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Medium (local runtime handoff; presentation system)
SRS IDs: `UI-DESIGN-001`, `UI-SCREEN-001`, `REQ-LOCALIZATION-001`

## Current review task

Hard-refresh `http://localhost:4000` and review the live taste-skill redesign:
IBM Plex bilingual typography, carbon/cobalt operational cockpit, handoff-lane
identity, redesigned auth split, 64px command bar, 272px staff rail, semantic
components, responsive portal shell, and persisted light/dark themes.

The three-week-old Docker web image was the reason the previous UI remained
visible. It has been replaced; the rebuilt `cms-forge-web` container from
`codex/cms-auto-visual-redesign` now owns port 4000.

## Remaining operational follow-ups

1. Bootstrap the local admin with an operator-selected credential before login.
2. Repair the inherited canonical OpenAPI drift in a separate contract slice.

Do not overwrite the unrelated local change in `docs/operations/runbook.md`.
