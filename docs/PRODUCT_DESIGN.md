# CMS-Auto Product Design — Dealership Accountability System

Status: **design only (not implementation).** This is the target for the next Forge
phase (Phase 10). Precedence: the SRS (`docs/CMS_AUTO_SRS.md`) still governs the
complaint domain already built; this document extends it into a dealership
work-accountability system and is the clean target so Forge does not drift into
random features.

## What this product is (one sentence)

**Every promise and handoff becomes a tracked task with an owner, a deadline, and a
forced next step — and the system, not the person, remembers and chases it.**

## The real problem (a car-selling company)

Work comes from everywhere; nobody clearly owns it; people forget; managers find out
too late. The cost is forgotten customer calls, stuck deals, lost sales, angry
customers, and managers chasing by memory. This product attacks **that**, not
"complaints." Complaints are one input.

## The spine — three mechanisms (worth more than any feature)

1. **Next-Action Invariant** — no work item may sit open without a **Next Action =
   {what, who, when}**. The system refuses to leave work in limbo. This one rule is
   worth more than 20 features; reminders, escalation, and the manager view all key
   off it.
2. **Reminder + escalation engine** (already built — the Phase-8 BullMQ worker):
   ```
   due soon              -> remind assignee
   overdue 1 day         -> assignee + team leader
   overdue 2 days        -> branch manager
   high-severity overdue -> immediate manager alert
   ```
   Plus a daily "your day" digest and the manager rollup. **The system is the memory.**
3. **10-second capture, or it dies.** Quick-add = (customer/deal *or* free text) +
   what + who + when; everything else optional/inferred; email-to-task. The schema
   must allow a near-empty task. In a noisy dealership, a form = non-adoption.

## Object model (two tiers, not one blurry "work item")

- **Task** — the *atom*; the thing that gets forgotten. Fields: `title, owner,
  assignee, dueAt, nextAction {what, who, when}, status, proof/attachments, links[]`.
  Stands alone OR belongs to a Case/Deal ("call customer back" needs no heavy case).
- **Case** — a *container with a lifecycle* (state machine by type): customer
  complaint, employee grievance, generic incident. Spawns tasks. Carries
  `confidentialityLevel` + a participant ACL **from day one** (so confidential HR
  cases are not a retrofit).
- **Deal** — a *special long-running case* with **stage gates** (the revenue spine):
  Lead -> Booking -> Payment -> Finance -> Insurance -> Registration -> PDI ->
  Delivery -> Post-delivery. Each gate has an owner + deadline and spawns tasks.
- **Link table** — a task/case relates to customer / vehicle / deal / employee /
  branch (polymorphic, app-validated). Keep automotive value (VIN, job card,
  warranty) as a rich entity type, not flattened to key-value.
- **Timeline** — append-only events per task/case (status change, assignment,
  comment, escalation, block). **KPIs are DERIVED from this log, never stored as raw
  counters** (so "closed count" cannot be gamed).

## Lifecycles (by type — never one for everything)

- **Customer complaint:** Submitted -> Triage -> Assigned -> In Progress ->
  Waiting on Customer / Waiting on Internal -> Escalated -> Resolved ->
  Customer Confirmed -> Closed -> Reopened.
- **Employee grievance (confidential):** Submitted -> HR Review -> Investigation ->
  Decision -> Closed -> Appealed.
- **Task** (simple): Open -> In Progress -> Waiting -> Done — always with a next
  action while not Done.

## The five screens (each answers a question the owner actually asks)

1. **Employee Today** — due today / overdue / waiting-on-me / assigned / escalated.
   "What must I do now?" → fixes forgetting.
2. **Manager Control Room** — who is late / stuck / overloaded / blocking; promises at
   risk; high-risk cases. "Who is behind, what is stuck?" → fixes blind management.
3. **Deal Handoff Board** — each deal's current stage + who holds it + how long.
   "Which deals are stuck, in which department?" → fixes lost sales.
4. **Customer Promise Tracker** — every promise = a dated task; kept-on-time %.
   "Are we keeping our word?" → fixes reputation / repeat sales.
5. **Case Timeline** — one record of truth: who said/did what, who delayed, why
   blocked. → kills "I told him / he forgot."

## KPIs (derived from events; fair; team + trend)

on-time completion %, **customer-promise-kept %**, overdue count, average delay,
stuck-deals-by-department, first-response time, resolution time, reopened/repeat
rate, escalations per team. **Never** raw individual "tasks closed" — it breeds fake
productivity and hidden hard cases.

## Build order (start from the existing code — reuse ~80%)

1. **Task atom + Employee Today + Manager Control Room**, on top of the existing
   complaint/assignment/audit/notification code. *First win: stop forgetting;
   managers can see.*
2. **Next-Action invariant + the escalation ladder** wired to the Phase-8 worker.
3. **Deal Handoff Board** (sales -> delivery stage gates).
4. Reframe the existing complaint as **Case(type=customer_complaint)**; lifecycle polish.
5. **KPI dashboard** (derived) -> **root cause / corrective action (CAPA)** + repeat detection.
6. **Confidential employee cases** (the ACL already exists from step 1).
7. Capture channels later (email-to-task, then WhatsApp / mobile).

## Migration from what is built (do NOT rewrite)

The complaint domain, assignment, SLA, audit, notifications, and the BullMQ worker
already exist. Add the Task atom + the two home screens + the reminder ladder on top;
turn Complaint into `Case(type=customer_complaint)` with customer/vehicle as links.
The first deliverable reuses most of the codebase.

## Do NOT build yet

AI / smart suggestions, a configurable workflow/BPMN engine, a full HR system,
WhatsApp integration, a native mobile app. Add only after staff actually use the
task/deal flow.

## Definition of "it is working"

The owner can ask — and the app answers instantly — *"who is late, which deals are
stuck, who keeps promises, which department delays, which issues repeat?"* — and
**on-time % and promise-kept % trend up while overdue trends down.**
