CREATE TABLE "service_booking_lanes" (
  "id" TEXT NOT NULL,
  "service_center_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "max_daily_appointments" INTEGER NOT NULL DEFAULT 80,
  "max_per_hour" INTEGER NOT NULL DEFAULT 5,
  "max_per_slot" INTEGER NOT NULL DEFAULT 2,
  "position" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_booking_lanes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_booking_lanes_capacity_check" CHECK (
    "max_daily_appointments" > 0 AND "max_per_hour" > 0 AND "max_per_slot" > 0
  )
);

CREATE UNIQUE INDEX "service_booking_lanes_service_center_id_code_key"
  ON "service_booking_lanes"("service_center_id", "code");
CREATE INDEX "service_booking_lanes_service_center_id_is_active_position_idx"
  ON "service_booking_lanes"("service_center_id", "is_active", "position");

ALTER TABLE "service_booking_lanes"
  ADD CONSTRAINT "service_booking_lanes_service_center_id_fkey"
  FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "service_booking_lanes" (
  "id", "service_center_id", "code", "name_en", "name_ar",
  "max_daily_appointments", "max_per_hour", "max_per_slot", "position"
)
SELECT
  'lane_general_' || substr(md5("id"), 1, 16), "id", 'GENERAL',
  'General bookings', 'الحجوزات العامة', 80, 5, 2, 0
FROM "service_centers"
ON CONFLICT ("service_center_id", "code") DO NOTHING;

ALTER TABLE "service_appointments" ADD COLUMN "booking_lane_id" TEXT;

UPDATE "service_appointments" AS appointment
SET "booking_lane_id" = lane."id"
FROM "service_booking_lanes" AS lane
WHERE lane."service_center_id" = appointment."service_center_id"
  AND lane."code" = 'GENERAL';

ALTER TABLE "service_appointments" ALTER COLUMN "booking_lane_id" SET NOT NULL;
CREATE INDEX "service_appointments_booking_lane_id_date_start_time_idx"
  ON "service_appointments"("booking_lane_id", "date", "start_time");
ALTER TABLE "service_appointments"
  ADD CONSTRAINT "service_appointments_booking_lane_id_fkey"
  FOREIGN KEY ("booking_lane_id") REFERENCES "service_booking_lanes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
