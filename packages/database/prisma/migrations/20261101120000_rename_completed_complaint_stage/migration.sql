UPDATE "board_stages"
SET "name_en" = 'Completed',
    "name_ar" = 'مكتملة',
    "updated_at" = CURRENT_TIMESTAMP
WHERE "code" = 'TICKETS_COMPLETED'
  AND "mapped_complaint_status" = 'COMPLETED';
