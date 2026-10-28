-- Idempotent restoration of Amman & North Service Centers and appointment APT-20261029-0001
DO $$
BEGIN
  -- First update any existing center_main or MAIN_CENTER
  UPDATE "service_centers"
  SET "name_en" = 'AMMAN Service Center',
      "name_ar" = 'مركز صيانة عمان',
      "is_active" = true,
      "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'center_main' OR "code" = 'MAIN_CENTER';

  -- If center_main doesn't exist, insert it
  IF NOT EXISTS (SELECT 1 FROM "service_centers" WHERE "id" = 'center_main' OR "code" = 'MAIN_CENTER') THEN
    INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
    VALUES ('center_main', 'MAIN_CENTER', 'AMMAN Service Center', 'مركز صيانة عمان', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  -- Update center_north
  UPDATE "service_centers"
  SET "name_en" = 'North Service Center',
      "name_ar" = 'مركز صيانة الشمال',
      "is_active" = true,
      "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'center_north' OR "code" = 'NORTH_CENTER';

  -- If center_north doesn't exist, insert it
  IF NOT EXISTS (SELECT 1 FROM "service_centers" WHERE "id" = 'center_north' OR "code" = 'NORTH_CENTER') THEN
    INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
    VALUES ('center_north', 'NORTH_CENTER', 'North Service Center', 'مركز صيانة الشمال', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  -- Ensure appointment APT-20261029-0001 exists
  UPDATE "service_appointments"
  SET "customer_name" = 'ببب',
      "service_center_id" = 'center_main',
      "date" = '2026-10-29 00:00:00',
      "start_time" = '09:15',
      "end_time" = '10:15',
      "duration_minutes" = 60,
      "status" = 'BOOKED',
      "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'cmvrqy4gi001u7444m2r2royi' OR "reference_number" = 'APT-20261029-0001';

  IF NOT EXISTS (SELECT 1 FROM "service_appointments" WHERE "id" = 'cmvrqy4gi001u7444m2r2royi' OR "reference_number" = 'APT-20261029-0001') THEN
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
    );
  END IF;
END $$;
