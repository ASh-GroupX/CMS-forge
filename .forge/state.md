# Current State

Date: 2026-11-23
Status: Internal Manager officer workload filters ready for release
Risk: Medium

- The Internal Manager department board now orders officer columns by their current active ticket count, highest first. All, Active, and Free filters select the officer columns; Team Tasks stays visible.
- Active means an assigned ticket that is not RESOLVED, CLOSED, or REJECTED. A free officer has zero such tickets. Completed cards can remain in a free officer's column while its active count is zero.
- Passed: web tests 254/254, typecheck, lint, production build, English desktop and Arabic mobile screenshot review, diff check. Deployment and signed-in manager UAT pending.
