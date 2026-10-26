-- Create service_centers table for independent service booking centers
CREATE TABLE IF NOT EXISTS "service_centers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default service centers
INSERT INTO "service_centers" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES
  ('center_main', 'MAIN_CENTER', 'Main Service Center', 'مركز الصيانة الرئيسي', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('center_north', 'NORTH_CENTER', 'North Service Center', 'مركز صيانة الشمال', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Add service_center_id to service_booking_rules and service_appointments
ALTER TABLE "service_booking_rules" ADD COLUMN IF NOT EXISTS "service_center_id" TEXT NOT NULL DEFAULT 'center_main';
ALTER TABLE "service_appointments" ADD COLUMN IF NOT EXISTS "service_center_id" TEXT NOT NULL DEFAULT 'center_main';

-- Create indexes on service_center_id
CREATE INDEX IF NOT EXISTS "service_booking_rules_service_center_id_idx" ON "service_booking_rules"("service_center_id");
CREATE INDEX IF NOT EXISTS "service_appointments_service_center_id_date_idx" ON "service_appointments"("service_center_id", "date");

-- Seed new granular admin permissions
INSERT INTO "permissions" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES
  ('perm_booking_settings_manage', 'BOOKING_SETTINGS_MANAGE', 'Manage service booking centers and working hours', 'إدارة مراكز وساعات حجز الصيانة', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_settings_manage', 'COMPLAINT_SETTINGS_MANAGE', 'Manage complaint settings, root causes, and sales advisors', 'إدارة إعدادات الشكاوى والأسباب الجذرية ومستشاري المبيعات', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_ticket_settings_manage', 'TICKET_SETTINGS_MANAGE', 'Manage ticket settings and routing rules', 'إدارة إعدادات التذاكر وقواعد التوجيه', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Grant permissions to default roles
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE (
  (r."code" = 'ADMIN' AND p."code" IN ('BOOKING_SETTINGS_MANAGE', 'COMPLAINT_SETTINGS_MANAGE', 'TICKET_SETTINGS_MANAGE')) OR
  (r."code" = 'CR_MANAGER' AND p."code" IN ('COMPLAINT_SETTINGS_MANAGE', 'TICKET_SETTINGS_MANAGE')) OR
  (r."code" = 'BRANCH_MANAGER' AND p."code" IN ('BOOKING_SETTINGS_MANAGE'))
)
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
