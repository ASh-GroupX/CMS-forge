# Forge

One prompt controls the project:

```text
Read .forge/forge.md and follow it.
```

This Forge is intentionally small. There is no `prompts/` folder because phase
prompts are just wrappers around the same entrypoint.

## Files

- `forge.md`: operating protocol
- `project.md`: project identity and hard rules
- `policy.md`: rules that apply to every task
- `models.md`: model tier guide
- `backlog.md`: planned work
- `next.md`: current task
- `state.md`: current status
- `evidence.md`: append-only verification log
- `trust.md`: append-only review log
- `retro.md`: lessons learned

## Truth Order

When files disagree, use this order:

1. `next.md`
2. `state.md`
3. latest entries in `evidence.md` and `trust.md`
4. `backlog.md`

If `backlog.md` disagrees with accepted evidence, reconcile the backlog before
planning more work.
