-- Add missing TICKETS_COMPLETED board stage for ComplaintStatus.COMPLETED
INSERT INTO "board_stages" (
  "id", "code", "scope", "name_en", "name_ar", "color", "position",
  "is_default", "mapped_task_status", "mapped_complaint_status", "updated_at"
) VALUES (
  'board_stage_tickets_completed', 'TICKETS_COMPLETED', 'TICKETS',
  'Customer Contacted', 'تم التواصل مع العميل', 'teal', 6,
  true, NULL, 'COMPLETED', CURRENT_TIMESTAMP
) ON CONFLICT ("code") DO UPDATE SET
  "is_default" = true,
  "name_en" = EXCLUDED."name_en",
  "name_ar" = EXCLUDED."name_ar",
  "color" = EXCLUDED."color",
  "mapped_complaint_status" = 'COMPLETED',
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "board_stages" SET "position" = 7 WHERE "code" = 'TICKETS_CLOSED';
UPDATE "board_stages" SET "position" = 8 WHERE "code" = 'TICKETS_REOPENED';
UPDATE "board_stages" SET "position" = 9 WHERE "code" = 'TICKETS_REJECTED';
