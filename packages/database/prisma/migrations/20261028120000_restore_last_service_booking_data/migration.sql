-- Ensure Amman and North Service Centers exist and are active
INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES
  ('center_main', 'MAIN_CENTER', 'AMMAN Service Center', 'مركز صيانة عمان', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('center_north', 'NORTH_CENTER', 'North Service Center', 'مركز صيانة الشمال', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name_en" = EXCLUDED."name_en",
  "name_ar" = EXCLUDED."name_ar",
  "is_active" = true,
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "service_centers"
SET "name_en" = 'AMMAN Service Center', "name_ar" = 'مركز صيانة عمان', "is_active" = true
WHERE "id" = 'center_main' OR "code" = 'MAIN_CENTER';

UPDATE "service_centers"
SET "is_active" = true
WHERE "id" = 'center_north' OR "code" = 'NORTH_CENTER';

-- Restore the last deleted/missing appointment APT-20261029-0001
INSERT INTO "service_appointments" (
  "id",
  "reference_number",
  "service_center_id",
  "customer_name",
  "customer_phone",
  "car_model_name",
  "maintenance_type_name",
  "notes",
  "date",
  "start_time",
  "end_time",
  "duration_minutes",
  "status",
  "created_at",
  "updated_at"
)
VALUES (
  'cmvrqy4gi001u7444m2r2royi',
  'APT-20261029-0001',
  'center_main',
  'ببب',
  '0790000000',
  'Chery Tiggo 7 Pro',
  'صيانة دورية 10,000 كم',
  'حجز صيانة دورية',
  '2026-10-29 00:00:00',
  '09:15',
  '10:15',
  60,
  'BOOKED',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("reference_number") DO UPDATE SET
  "customer_name" = EXCLUDED."customer_name",
  "service_center_id" = EXCLUDED."service_center_id",
  "date" = EXCLUDED."date",
  "start_time" = EXCLUDED."start_time",
  "end_time" = EXCLUDED."end_time",
  "duration_minutes" = EXCLUDED."duration_minutes",
  "status" = 'BOOKED',
  "updated_at" = CURRENT_TIMESTAMP;
