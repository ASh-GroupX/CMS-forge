# Current State

Date: 2026-11-18
Status: Department manager dashboard restored; release pending
Risk: High

- The manager dashboard again shows its analysis filters, export, four metric
  cards, and employee performance panel.
- Counts and destination lists use the department from the authenticated server
  session and exclude tickets still awaiting sender approval.
- Both cards open the matching filtered internal-ticket board in English/Arabic.
- Passed web 249/249, typecheck, lint, and EN/AR browser proof. The changed
  card links passed focused Axe checks and screenshots were inspected.
- Production deployment and signed-in live card drill-down are Not Run.
- The Amman periodic live preflight remains untouched: 69 ready, 59 already
  imported, 0 review. No production booking was created in this task.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
