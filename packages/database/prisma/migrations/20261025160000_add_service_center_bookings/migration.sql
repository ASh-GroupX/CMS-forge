-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceAppointmentStatus') THEN
    CREATE TYPE "ServiceAppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
  END IF;
END $$;

-- CreateTable service_car_models
CREATE TABLE IF NOT EXISTS "service_car_models" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'Nissan',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_maintenance_types
CREATE TABLE IF NOT EXISTS "service_maintenance_types" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "estimated_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_maintenance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_booking_rules
CREATE TABLE IF NOT EXISTS "service_booking_rules" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT NOT NULL DEFAULT '08:00',
    "end_time" TEXT NOT NULL DEFAULT '18:00',
    "max_daily_appointments" INTEGER NOT NULL DEFAULT 24,
    "max_per_hour" INTEGER NOT NULL DEFAULT 3,
    "max_per_slot" INTEGER NOT NULL DEFAULT 1,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_booking_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable service_appointments
CREATE TABLE IF NOT EXISTS "service_appointments" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "vin" TEXT,
    "car_model_id" TEXT,
    "car_model_name" TEXT NOT NULL,
    "maintenance_type_id" TEXT,
    "maintenance_type_name" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" "ServiceAppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_appointments_pkey" PRIMARY KEY ("id")
);

-- Unique index on service_booking_rules (branch_id, day_of_week)
CREATE UNIQUE INDEX IF NOT EXISTS "service_booking_rules_branch_id_day_of_week_key" ON "service_booking_rules"("branch_id", "day_of_week");
CREATE INDEX IF NOT EXISTS "service_booking_rules_branch_id_idx" ON "service_booking_rules"("branch_id");

-- Unique and standard indexes on service_appointments
CREATE UNIQUE INDEX IF NOT EXISTS "service_appointments_reference_number_key" ON "service_appointments"("reference_number");
CREATE INDEX IF NOT EXISTS "service_appointments_branch_id_date_idx" ON "service_appointments"("branch_id", "date");
CREATE INDEX IF NOT EXISTS "service_appointments_customer_phone_idx" ON "service_appointments"("customer_phone");

-- Foreign key constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_rules_branch_id_fkey') THEN
    ALTER TABLE "service_booking_rules" ADD CONSTRAINT "service_booking_rules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_appointments_branch_id_fkey') THEN
    ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_appointments_car_model_id_fkey') THEN
    ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_car_model_id_fkey" FOREIGN KEY ("car_model_id") REFERENCES "service_car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_appointments_maintenance_type_id_fkey') THEN
    ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_maintenance_type_id_fkey" FOREIGN KEY ("maintenance_type_id") REFERENCES "service_maintenance_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_appointments_created_by_id_fkey') THEN
    ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed initial Nissan models if empty
INSERT INTO "service_car_models" ("id", "name_en", "name_ar", "brand", "is_active", "created_at", "updated_at")
VALUES
  ('car_model_patrol', 'Patrol', 'باترول', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_sunny', 'Sunny', 'صني', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_altima', 'Altima', 'ألتيما', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_maxima', 'Maxima', 'مكسيما', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_kicks', 'Kicks', 'كيكس', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_x_trail', 'X-Trail', 'إكس-تريل', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_pathfinder', 'Pathfinder', 'باثفايندر', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_navara', 'Navara', 'نافارا', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('car_model_urvan', 'Urvan', 'أورفان', 'Nissan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Seed initial maintenance types if empty
INSERT INTO "service_maintenance_types" ("id", "name_en", "name_ar", "estimated_duration_minutes", "is_active", "created_at", "updated_at")
VALUES
  ('maint_periodic_10k', 'Periodic Maintenance (10,000 KM)', 'صيانة دورية (10,000 كم)', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_periodic_20k', 'Periodic Maintenance (20,000 KM)', 'صيانة دورية (20,000 كم)', 45, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_oil_filter', 'Oil and Filter Change', 'تغيير زيت وفلتر', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_brake_pads', 'Brake Pads & Discs Inspection/Replacement', 'فحص واستبدال فحمات وفرامل', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_ac_service', 'A/C System Service & Check', 'فحص وصيانة التكييف', 45, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_battery', 'Battery Check & Replacement', 'فحص واستبدال البطارية', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maint_general_check', 'Comprehensive Inspection', 'فحص شامل وفحص كمبيوتر', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
