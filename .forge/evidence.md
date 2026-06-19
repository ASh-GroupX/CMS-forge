# Evidence Log

Append build and verification evidence here, newest at the bottom. One entry per
task: ID, date, risk, status, requirement IDs, evidence, and honest verification
labels.

## Read and write rules (context hygiene)

- APPEND-ONLY. PLAN, VERIFY, and PHASE REVIEW read only the LATEST relevant entries
  (the active phase) - never load the whole file.
- History through Phase 7 / F7-02 is archived in
  `.forge/archive/evidence-archive.md` (and git). Do not load the archive unless a
  specific past entry is genuinely needed.
- When this log outgrows a phase, rotate the older phases into the archive.

---

(active-phase evidence appends below)