# Task Collaboration Plan

Status: **plan only, not implemented.**

This document is the handoff for the remaining collaboration gap in the
Dealership Accountability layer. The accountability spine is done: tasks can be
created, assigned, updated, completed, tracked in Employee Today, summarized in
Manager Control Room, linked to promises/deals/cases, and included in scheduled
notification batches. What is still missing is the peer follow-up workflow:

- See tasks I sent to colleagues.
- See each sent task's current status without hunting through Today.
- Add a comment directly on a task.
- Send a manual reminder/nudge to the colleague responsible for the next action.

## Current System Reality

Implemented:

- `POST /tasks/quick-add`
- `GET /tasks/today`
- `GET /tasks/manager-rollup`
- `GET /tasks/promises`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- Owner, assignee, due date, status, next action, links, participants.
- Status history and audit for task create/update.
- Participant/manager/admin task access rules.
- Scheduled task digest/rollup notification batch infrastructure.

Not implemented:

- Dedicated `sent by me` task list.
- Task comments.
- Manual task nudge/reminder action.
- Task-linked in-app notification center wiring.

## Product Goal

Staff should be able to answer this without calling or remembering:

> Which tasks did I send to my colleagues, what state are they in, what did they
> reply, and can I remind the right person to follow up?

## Scope

Build only task collaboration. Do not add admin screens, AI, WhatsApp, mobile,
deployment work, workflow-builder work, or new Case/Deal behavior.

## P10A - Sent Tasks

Add a staff-owned view of tasks created by the actor and assigned/next-actioned
to others.

Backend:

- Add `GET /tasks/sent-by-me`.
- Server session owns actor identity; no client `ownerId`.
- Return open and recently completed tasks owned by the actor.
- Preserve existing confidentiality and participant rules.
- Include owner/assignee/next-action names and branch names.

UI:

- Add a Sent Tasks tab/page reachable from Today or Tasks.
- Show status, assignee, next action, due date, last update, and links.
- Use existing task cards/actions where possible.

Proof:

- API test: owner sees sent task.
- API test: unrelated user cannot see confidential/restricted task.
- Web shell/localization tests for the new nav/tab text.

## P10B - Task Comments

Add comments to tasks, separate from complaint comments.

Data:

- Add `TaskComment` with `taskId`, `authorId`, `body`, `createdAt`, optional
  `editedAt` only if editing is implemented in this slice.
- Do not reuse complaint `Comment`; task comments are not customer portal data.

Backend:

- Add `GET /tasks/:id/comments`.
- Add `POST /tasks/:id/comments`.
- Only task participants, owner, assignee, next-action user, and scoped
  managers/admins can read/write.
- Comment create writes audit in the same transaction.
- Denied read/write returns 403 and writes SECURITY audit where the existing
  pattern requires it.
- Customer portal must never receive task comments.

UI:

- Add a compact comment thread on task detail/cards where space allows.
- Add a small comment form.
- Keep loading, empty, error, and success states.

Proof:

- API allowed create + audit.
- API denied create/read for unrelated or different-branch user.
- Web smoke: add comment and see it appear.
- Portal privacy regression: task comments do not appear in customer portal.

## P10C - Manual Nudge

Add an explicit reminder action.

Backend:

- Add `POST /tasks/:id/nudge`.
- Recipient defaults to `nextAction.whoId`; fallback to `assigneeId`.
- Request body may include a short message, but no recipient override unless the
  recipient is already a task participant.
- Create an in-app notification via the existing notifications service.
- Write audit for the nudge action.
- Rate-limit or debounce only if existing infrastructure already supports it;
  otherwise record repeated nudges and let managers see abuse later.

UI:

- Add a `Remind` button on Sent Tasks and eligible task cards.
- Optional short message textarea.
- Show success/error state.
- Notification Center should show real task nudge/comment notifications, not
  only static preview rows.

Proof:

- API allowed nudge queues notification for next-action user.
- API denied nudge for unrelated user.
- Notification payload must not include secrets, internal portal tokens, or
  unrelated task data.
- Live smoke: user A nudges user B; user B sees notification.

## API Contract

Document these routes in OpenAPI:

- `GET /tasks/sent-by-me`
- `GET /tasks/:id/comments`
- `POST /tasks/:id/comments`
- `POST /tasks/:id/nudge`

Keep DTOs narrow. Do not expose raw audit logs or security internals.

## Tests

Minimum proof matrix:

- `corepack pnpm test:api -- tasks`
- `node --import tsx --test apps/api/src/modules/tasks/*.spec.ts`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`

Live smoke:

1. User A creates a task assigned to User B.
2. User A opens Sent Tasks and sees the task/status.
3. User A comments on the task.
4. User A nudges User B.
5. User B sees the task and the notification.
6. User B comments or marks it Waiting/Done.
7. User A sees the updated status/comment.
8. Different-branch unrelated user is denied.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- Open tasks still require next action `{ what, whoId, when }`.
- Task collaboration must not leak confidential/restricted tasks.
- Customer portal must not expose task comments, nudges, or internal
  notifications.
- Keep source files under 300 lines or split naturally.
- Prefer extending the existing Tasks and Notifications modules over adding new
  modules.
- No configurable workflow engine.
