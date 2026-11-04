# Report board column selection
Status: Implemented; available independent review found no blocker
Risk: Medium
SRS: REQ-REPORT-001, UI-DESIGN-001

Localized status checkboxes now sit above every report status board. All columns
are shown by default; any subset, select-all and clear-to-zero guidance work.
Visibility only filters rendered columns; data filters and loaded pages remain.
Generated checkbox using shadcn CLI, then adapted its mixed icon/aria treatment.

Passed: lint, typecheck, diff check; hydrated browser 38 assertions (EN/AR);
accessibility 24/24 previews. EN desktop and AR mobile two-column screenshots
rendered and inspected. Independent GPT-6.1 review found no confirmed blocker;
it is not the policy-named phase acceptance reviewer. No push for this follow-up.
