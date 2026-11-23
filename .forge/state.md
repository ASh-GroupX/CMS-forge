# Current State

Date: 2026-11-23
Status: Department board receiving-ticket scope fix deployed
Risk: High

- The Department Ticket Board combined receiving-department tickets with tickets sent by the current user, then displayed all unassigned cards as Team Tasks. An outbound ticket to ERP therefore appeared on the sender's department board.
- The board now keeps only tickets whose targetDepartmentId matches the department from the server session. My Work Sent still lists outgoing tickets; ERP's board retains the incoming team ticket.
- Passed: web tests 253/253, typecheck, lint, production build, English desktop and Arabic mobile screenshot review, diff check. GitHub Actions run 45133186347 deployed c649cd5 successfully; public landing and API health returned HTTP 200 with that revision. Signed-in live review of the specific ERP ticket remains pending.
