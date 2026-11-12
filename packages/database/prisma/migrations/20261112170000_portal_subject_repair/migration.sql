-- Restore customer-name subjects on redirected public complaints created before
-- the subject rule changed. Keep staff-edited subjects and unrelated complaints.
WITH corrected AS (
  UPDATE "complaints" AS complaint
  SET "subject" = btrim(complaint."customer_name_snapshot"),
      "updated_at" = CURRENT_TIMESTAMP
  WHERE complaint."created_by_id" IS NULL
    AND complaint."status" NOT IN ('DRAFT', 'SUBMITTED')
    AND NULLIF(btrim(complaint."customer_name_snapshot"), '') IS NOT NULL
    AND NULLIF(btrim(concat_ws(' ', complaint."vehicle_make_snapshot", complaint."vehicle_model_snapshot")), '') IS NOT NULL
    AND complaint."subject" = btrim(concat_ws(' ', complaint."vehicle_make_snapshot", complaint."vehicle_model_snapshot"))
    AND EXISTS (
      SELECT 1 FROM "complaint_status_history" AS history
      WHERE history."complaint_id" = complaint."id"
        AND history."request_source" = 'CUSTOMER_PORTAL'
        AND history."action" = 'SUBMIT'
    )
  RETURNING complaint."id", complaint."branch_id"
)
INSERT INTO "audit_logs" ("id", "event_type", "action", "branch_id", "target_type", "target_id", "metadata")
SELECT 'portal-subject-repair-' || corrected."id", 'COMPLAINT', 'portal_subject_repaired',
       corrected."branch_id", 'complaint', corrected."id",
       '{"changedFields":["subject"],"reasonCode":"PORTAL_SUBJECT_REPAIR"}'::jsonb
FROM corrected;
