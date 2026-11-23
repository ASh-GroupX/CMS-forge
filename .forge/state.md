# Current State

Date: 2026-11-23
Status: Internal ticket draft attachment removal deployed successfully
Risk: Medium

- Production revision 6fc7f3a033afcc2709fd1a1198783b3c1ea164bd is live. GitHub Actions run 45125200459 passed Validate and Test and Deploy to VPS. Public landing and API health returned 200 with the exact revision; the signed-out new-ticket route returned 307.
- New ticket drafts show each selected file with a localized Remove action. Removal updates the browser file input, in-memory draft files, and persisted names before submission. No submitted ticket deletion path, schema migration, or data mutation was added.
- Passed locally: EN/AR browser proof, web tests 250/250, root tests 79/79 with coverage thresholds, production build, typecheck, lint, OpenAPI, security, and diff check. English desktop and Arabic mobile screenshots were inspected. The workflow backup gate passed; independent backup listing/restore and authenticated live UAT were Not Run.
