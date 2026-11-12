-- Older redirected portal rows may have kept the car only in the generated
-- subject. Recover the make/model when it uniquely matches the booking catalog.
WITH catalog AS (
  SELECT DISTINCT btrim("brand") AS make, btrim("name_en") AS model
  FROM "service_car_models"
  WHERE NULLIF(btrim("brand"), '') IS NOT NULL
    AND NULLIF(btrim("name_en"), '') IS NOT NULL
), candidate AS (
  SELECT complaint."id", min(catalog.make) AS make, min(catalog.model) AS model
  FROM "complaints" AS complaint
  JOIN catalog ON complaint."subject" = catalog.make || ' ' || catalog.model
  WHERE complaint."created_by_id" IS NULL
    AND complaint."status" NOT IN ('DRAFT', 'SUBMITTED')
    AND NULLIF(btrim(complaint."customer_name_snapshot"), '') IS NOT NULL
    AND NULLIF(btrim(complaint."vehicle_make_snapshot"), '') IS NULL
    AND NULLIF(btrim(complaint."vehicle_model_snapshot"), '') IS NULL
    AND EXISTS (
      SELECT 1 FROM "complaint_status_history" AS history
      WHERE history."complaint_id" = complaint."id"
        AND history."request_source" = 'CUSTOMER_PORTAL'
        AND history."action" = 'SUBMIT'
    )
  GROUP BY complaint."id"
  HAVING count(*) = 1
), recovered AS (
  UPDATE "complaints" AS complaint
  SET "vehicle_make_snapshot" = candidate.make,
      "vehicle_model_snapshot" = candidate.model,
      "subject" = btrim(complaint."customer_name_snapshot"),
      "updated_at" = CURRENT_TIMESTAMP
  FROM candidate
  WHERE complaint."id" = candidate."id"
  RETURNING complaint."id", complaint."branch_id"
)
INSERT INTO "audit_logs" ("id", "event_type", "action", "branch_id", "target_type", "target_id", "metadata")
SELECT 'portal-vehicle-subject-repair-' || recovered."id", 'COMPLAINT', 'portal_vehicle_subject_repaired',
       recovered."branch_id", 'complaint', recovered."id",
       '{"changedFields":["subject","vehicleMakeSnapshot","vehicleModelSnapshot"],"reasonCode":"PORTAL_VEHICLE_SUBJECT_REPAIR"}'::jsonb
FROM recovered;
