# Current State

Date: 2026-11-11
Status: Ready for release — booking lookup
Risk: Medium

- Previous booking polish is live at 2ec14c9; release evidence is recorded in `.forge/evidence.md`.
- Implemented search of the existing protected appointment list by name or normalized phone, including Arabic numerals and local/international phone formats. Results show status/date/time/center and open the selected booking in its day and branch. Load failure shows localized error and retry instead of false no-match.
- Passed: EN desktop/AR mobile browser proof with axe, web 231/231, booking API 34/34, root 78/78 with 89.95% line coverage, typecheck, lint, OpenAPI, security, build, diff check. Independent GPT-6.1 Sol review accepted with conditions: preferred named reviewer unavailable; signed-in production UAT and calendar past-hour expansion after closing detail remain. Next: release and verify. Preserve `tmp/` and `uploads/`.
