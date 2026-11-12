# Current State

Date: 2026-11-12
Status: In progress — redirected portal subject and vehicle repair locally verified; production release pending
Risk: High

- Current production revision: e23804d4847035df109e2605a85c544f974a70d0. Non-SMS QR intake, Admin field configuration, redirect workflow, and scoped customer export were deployed previously.
- The user's screenshots of CMS-2026-KHALDA-000004 show the car make/model as subject and a blank Vehicle Data card after redirect. New public submissions and intake redirects now use the customer name as subject. Existing redirected portal rows with the exact generated car subject receive a filtered, audited correction; rows missing both car snapshots recover a unique booking catalog match first. Staff-edited and unrelated subjects are excluded.
- The staff API mapper now retains submitted vehicle snapshots and current added-field answers. The receiving page shows submitted make/model/VIN with the unverified identity reason. Phone layout and detail-page definition-list accessibility were repaired.
- Passed locally: production build, typecheck, lint, OpenAPI, security, portal API 29/29, web API client 112/112, shell 232/232, root 78/78 (89.36% line coverage), migration sanity/index checks, real isolated PostgreSQL application of 63 migrations, 13 audited subject repairs plus one synthetic legacy snapshot recovery, and EN/AR browser proof at 390/1440 with zero serious/critical axe findings. Screenshots inspected. Independent GPT-6.1 Sol review: Accept with proof conditions met by builder. Preferred policy reviewer model unavailable.
- Production record cannot be read directly without an authenticated staff session. The supplied screenshot and public booking catalog confirm the legacy car string is a unique catalog match. The release migration and live read-only smoke remain.
- Preserve user tmp/ and uploads/. SMS remains deferred.
