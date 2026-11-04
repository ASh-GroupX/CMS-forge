# Notification visibility and unread feedback
Status: Tests passed; release authorized by user
Risk: Medium
SRS: REQ-NOTIFY-001, UI-DESIGN-001

Larger 48px bell with localized numeric unread badge (99+ at API limit), readable
desktop label and brand highlight when unread. Counter refreshes every30 seconds,
on focus and visibility; clears highlight at zero and pauses while hidden.
Full-page notification navigation retained. Unread activity cards have logical
accent border, larger titles and supplied message text.

Passed lint, typecheck, build, shell228/228, accessibility24/24, diff check;
hydrated EN desktop/AR mobile browser checks and inspected screenshots. Browser
proof covers zero/count/cap, failure recovery, polling, hidden suppression,
visibility/focus refresh, activity message and localized destination. Command:
pnpm test:notifications:browser. Full suite73/73, notifications API45/45 and web API-client101/101 passed. User authorized waleed push/production merge. Available independent
review found no confirmed blocker; named phase reviewer tier unavailable.
