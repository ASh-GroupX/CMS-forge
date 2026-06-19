# Trust Log

Append review decisions (VERIFY / PHASE REVIEW) here, newest at the bottom.

## Read and write rules (context hygiene)

- APPEND-ONLY. Readers take only the LATEST relevant entries - never the whole file.
- History through Phase 7 / F7-02 is archived in
  `.forge/archive/trust-archive.md` (and git). Open carry-forward conditions are
  summarized in `.forge/state.md`.
- Rotate older phases into the archive as this log grows.

---

(active-phase review decisions append below)