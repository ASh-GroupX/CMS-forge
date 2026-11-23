# Current State

Date: 2026-11-23
Status: Internal ticket draft attachment removal implemented locally
Risk: Medium

- New ticket drafts show each selected file with a localized Remove action. Removal updates the actual file input, in-memory draft files, and persisted file names before submission. No submitted ticket or stored attachment deletion path was added.
- Passed: EN/AR browser proof with draft restoration, individual and last-file removal, persisted names, and submitted payload; web tests 250/250; typecheck; lint. English desktop and Arabic mobile screenshots were inspected.
- Prior Khalda Finance import remains completed: ten accounts created and verified through the backend service; production revision remains 9442880f35aeb1e056cd3aa6f465ae2e80a55fc2. This UI change has not been deployed.
