# Current State

Date: 2026-11-23
Status: Department board receiving-ticket scope fix ready for release
Risk: High

- The Department Ticket Board combined receiving-department tickets with tickets sent by the current user, then displayed all unassigned cards as Team Tasks. An outbound ticket to ERP therefore appeared on the sender's department board.
- The board now keeps only tickets whose targetDepartmentId matches the department from the server session. My Work Sent still lists outgoing tickets; ERP's board retains the incoming team ticket.
- Passed: web tests 253/253, typecheck, lint, production build, English desktop and Arabic mobile screenshot review, diff check. Deployment and signed-in live review pending.
