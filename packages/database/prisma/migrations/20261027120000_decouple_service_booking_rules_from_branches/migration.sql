-- Decouple service_booking_rules from branches table so independent service centers can own booking rules
ALTER TABLE "service_booking_rules" ALTER COLUMN "branch_id" DROP NOT NULL;
ALTER TABLE "service_booking_rules" DROP CONSTRAINT IF EXISTS "service_booking_rules_branch_id_fkey";
DROP INDEX IF EXISTS "service_booking_rules_branch_id_day_of_week_key";

-- Ensure unique constraint on (service_center_id, day_of_week)
CREATE UNIQUE INDEX IF NOT EXISTS "service_booking_rules_service_center_id_day_of_week_key" 
ON "service_booking_rules"("service_center_id", "day_of_week");

-- Ensure service_center_id foreign key constraint to service_centers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_booking_rules_service_center_id_fkey') THEN
    ALTER TABLE "service_booking_rules" 
    ADD CONSTRAINT "service_booking_rules_service_center_id_fkey" 
    FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Decouple service_appointments from branches table so appointments can be booked directly for service centers
ALTER TABLE "service_appointments" ALTER COLUMN "branch_id" DROP NOT NULL;
ALTER TABLE "service_appointments" DROP CONSTRAINT IF EXISTS "service_appointments_branch_id_fkey";

-- Ensure service_center_id foreign key constraint on service_appointments to service_centers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_appointments_service_center_id_fkey') THEN
    ALTER TABLE "service_appointments" 
    ADD CONSTRAINT "service_appointments_service_center_id_fkey" 
    FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
