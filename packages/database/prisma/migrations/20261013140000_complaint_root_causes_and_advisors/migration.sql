-- Production migration to ensure complaint_root_causes and complaint_sales_advisors tables
-- and their initial seeds exist, along with recent complaint columns.

-- 1. Create complaint_root_causes table
CREATE TABLE IF NOT EXISTS "complaint_root_causes" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_root_causes_pkey" PRIMARY KEY ("id")
);

-- 2. Create complaint_sales_advisors table
CREATE TABLE IF NOT EXISTS "complaint_sales_advisors" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_sales_advisors_pkey" PRIMARY KEY ("id")
);

-- 3. Seed default complaint root causes
INSERT INTO "complaint_root_causes" ("id", "name_en", "name_ar", "order", "is_active", "created_at", "updated_at")
VALUES
  ('root_cause_1', 'Delay in Service/Delivery', 'تأخير في الخدمة أو التسليم', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_2', 'Parts Unavailability', 'عدم توفر قطع الغيار', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_3', 'Staff Conduct / Rude Behavior', 'سوء تعامل أو سلوك الموظف', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_4', 'Pricing / Billing Dispute', 'خلاف حول الفاتورة أو التسعير', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_5', 'Quality of Repair / Recurrent Issue', 'جودة الإصلاح أو تكرار المشكلة', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_6', 'Poor Communication', 'ضعف التواصل والمتابعة', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('root_cause_7', 'Diagnostic Issue', 'خطأ في الفحص والتشخيص', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 4. Seed default complaint sales advisors
INSERT INTO "complaint_sales_advisors" ("id", "name_en", "name_ar", "order", "is_active", "created_at", "updated_at")
VALUES
  ('sales_advisor_1', 'Ahmed Al-Mansoor', 'أحمد المنصور', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sales_advisor_2', 'Faisal Al-Harbi', 'فيصل الحربي', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sales_advisor_3', 'Tariq Al-Otaibi', 'طارق العتيبي', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sales_advisor_4', 'Mohammed Al-Zahrani', 'محمد الزهراني', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sales_advisor_5', 'Khalid Al-Shammari', 'خالد الشمري', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 5. Add missing columns and foreign keys to complaints
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "alternative_car_provided" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "backup_officer_id" TEXT;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "collaborator_id" TEXT;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "is_justified" BOOLEAN;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "satisfaction_status" TEXT;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "investigation_notes" TEXT;
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "investigated_at" TIMESTAMP(3);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_backup_officer_id_fkey') THEN
    ALTER TABLE "complaints" ADD CONSTRAINT "complaints_backup_officer_id_fkey" FOREIGN KEY ("backup_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_collaborator_id_fkey') THEN
    ALTER TABLE "complaints" ADD CONSTRAINT "complaints_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
