-- Idempotent master data, booking rules, service centers, and appointments seeding
DO $$
BEGIN
  -- 1. Ensure Service Centers exist
  UPDATE "service_centers"
  SET "name_en" = 'AMMAN Service Center', "name_ar" = 'مركز صيانة عمان', "is_active" = true, "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'center_main' OR "code" = 'MAIN_CENTER';

  IF NOT EXISTS (SELECT 1 FROM "service_centers" WHERE "id" = 'center_main' OR "code" = 'MAIN_CENTER') THEN
    INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
    VALUES ('center_main', 'MAIN_CENTER', 'AMMAN Service Center', 'مركز صيانة عمان', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  UPDATE "service_centers"
  SET "name_en" = 'North Service Center', "name_ar" = 'مركز صيانة الشمال', "is_active" = true, "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'center_north' OR "code" = 'NORTH_CENTER';

  IF NOT EXISTS (SELECT 1 FROM "service_centers" WHERE "id" = 'center_north' OR "code" = 'NORTH_CENTER') THEN
    INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
    VALUES ('center_north', 'NORTH_CENTER', 'North Service Center', 'مركز صيانة الشمال', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  -- 2. Ensure Car Models exist
  INSERT INTO "service_car_models" ("id", "name_en", "name_ar", "brand", "is_active", "created_at", "updated_at")
  VALUES
    ('car_tiggo8_pro', 'Chery Tiggo 8 Pro', 'شيري تيجو 8 برو', 'Chery', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('car_tiggo7_pro', 'Chery Tiggo 7 Pro', 'شيري تيجو 7 برو', 'Chery', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('car_tiggo4_pro', 'Chery Tiggo 4 Pro', 'شيري تيجو 4 برو', 'Chery', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('car_arrizo6_pro', 'Chery Arrizo 6 Pro', 'شيري أريزو 6 برو', 'Chery', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('car_model_patrol', 'Nissan Patrol', 'نيسان باترول', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('car_model_sunny', 'Nissan Sunny', 'نيسان صني', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("id") DO UPDATE SET "is_active" = true;

  -- 3. Ensure Maintenance Types exist
  INSERT INTO "service_maintenance_types" ("id", "name_en", "name_ar", "estimated_duration_minutes", "is_active", "created_at", "updated_at")
  VALUES
    ('maint_periodic_10k', 'Periodic Maintenance 10,000 km', 'صيانة دورية 10,000 كم', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maint_periodic_20k', 'Periodic Maintenance 20,000 km', 'صيانة دورية 20,000 كم', 45, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maint_periodic_40k', 'Periodic Maintenance 40,000 km', 'صيانة دورية 40,000 كم', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maint_oil_filter', 'Oil and Filter Change', 'تغيير زيت وفلتر', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maint_brake_pads', 'Brake Pads & Discs Service', 'فحص واستبدال فحمات وفرامل', 45, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maint_general_check', 'Comprehensive Inspection', 'فحص شامل وفحص كمبيوتر', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("id") DO UPDATE SET "is_active" = true;

  -- 4. Ensure Service Booking Rules exist for center_main and center_north
  FOR i IN 0..6 LOOP
    INSERT INTO "service_booking_rules" ("id", "service_center_id", "day_of_week", "is_open", "start_time", "end_time", "max_daily_appointments", "max_per_hour", "max_per_slot", "slot_duration_minutes", "created_at", "updated_at")
    VALUES (
      'rule_main_' || i, 'center_main', i,
      CASE WHEN i = 5 THEN false ELSE true END,
      '08:00', CASE WHEN i = 5 THEN '14:00' ELSE '18:00' END,
      CASE WHEN i = 5 THEN 0 WHEN i = 6 THEN 18 ELSE 24 END,
      3, 1, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("service_center_id", "day_of_week") DO NOTHING;

    INSERT INTO "service_booking_rules" ("id", "service_center_id", "day_of_week", "is_open", "start_time", "end_time", "max_daily_appointments", "max_per_hour", "max_per_slot", "slot_duration_minutes", "created_at", "updated_at")
    VALUES (
      'rule_north_' || i, 'center_north', i,
      CASE WHEN i = 5 THEN false ELSE true END,
      '08:00', CASE WHEN i = 5 THEN '14:00' ELSE '18:00' END,
      CASE WHEN i = 5 THEN 0 WHEN i = 6 THEN 18 ELSE 24 END,
      3, 1, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("service_center_id", "day_of_week") DO NOTHING;
  END LOOP;

  -- 5. Ensure today's appointment (2026-10-28)
  UPDATE "service_appointments"
  SET "customer_name" = 'ببب',
      "customer_phone" = '0790000000',
      "service_center_id" = 'center_main',
      "car_model_id" = 'car_tiggo8_pro',
      "car_model_name" = 'Chery Tiggo 8 Pro',
      "maintenance_type_id" = 'maint_periodic_10k',
      "maintenance_type_name" = 'صيانة دورية 10,000 كم',
      "date" = '2026-10-28 00:00:00',
      "start_time" = '10:00',
      "end_time" = '11:00',
      "duration_minutes" = 60,
      "status" = 'BOOKED',
      "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'cmvrqy4gi001u7444m2r2roy0' OR "reference_number" = 'APT-20261028-0001';

  IF NOT EXISTS (SELECT 1 FROM "service_appointments" WHERE "id" = 'cmvrqy4gi001u7444m2r2roy0' OR "reference_number" = 'APT-20261028-0001') THEN
    INSERT INTO "service_appointments" (
      "id", "reference_number", "service_center_id", "customer_name", "customer_phone",
      "car_model_id", "car_model_name", "maintenance_type_id", "maintenance_type_name",
      "notes", "date", "start_time", "end_time", "duration_minutes", "status", "created_at", "updated_at"
    )
    VALUES (
      'cmvrqy4gi001u7444m2r2roy0', 'APT-20261028-0001', 'center_main', 'ببب', '0790000000',
      'car_tiggo8_pro', 'Chery Tiggo 8 Pro', 'maint_periodic_10k', 'صيانة دورية 10,000 كم',
      'حجز صيانة دورية', '2026-10-28 00:00:00', '10:00', '11:00', 60, 'BOOKED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
  END IF;

  -- 6. Ensure tomorrow's appointment (2026-10-29)
  UPDATE "service_appointments"
  SET "customer_name" = 'ببب',
      "customer_phone" = '0790000000',
      "service_center_id" = 'center_main',
      "car_model_id" = 'car_tiggo7_pro',
      "car_model_name" = 'Chery Tiggo 7 Pro',
      "maintenance_type_id" = 'maint_periodic_10k',
      "maintenance_type_name" = 'صيانة دورية 10,000 كم',
      "date" = '2026-10-29 00:00:00',
      "start_time" = '09:15',
      "end_time" = '10:15',
      "duration_minutes" = 60,
      "status" = 'BOOKED',
      "updated_at" = CURRENT_TIMESTAMP
  WHERE "id" = 'cmvrqy4gi001u7444m2r2royi' OR "reference_number" = 'APT-20261029-0001';

  IF NOT EXISTS (SELECT 1 FROM "service_appointments" WHERE "id" = 'cmvrqy4gi001u7444m2r2royi' OR "reference_number" = 'APT-20261029-0001') THEN
    INSERT INTO "service_appointments" (
      "id", "reference_number", "service_center_id", "customer_name", "customer_phone",
      "car_model_id", "car_model_name", "maintenance_type_id", "maintenance_type_name",
      "notes", "date", "start_time", "end_time", "duration_minutes", "status", "created_at", "updated_at"
    )
    VALUES (
      'cmvrqy4gi001u7444m2r2royi', 'APT-20261029-0001', 'center_main', 'ببب', '0790000000',
      'car_tiggo7_pro', 'Chery Tiggo 7 Pro', 'maint_periodic_10k', 'صيانة دورية 10,000 كم',
      'حجز صيانة دورية', '2026-10-29 00:00:00', '09:15', '10:15', 60, 'BOOKED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
  END IF;
END $$;
