CREATE TABLE "portal_intake_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "branch_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "phone_country_code" TEXT NOT NULL DEFAULT '+962',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "portal_intake_settings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "portal_intake_settings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "portal_intake_members" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "setting_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "removed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portal_intake_members_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "portal_intake_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "portal_intake_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "portal_intake_members_setting_id_removed_at_idx" ON "portal_intake_members"("setting_id", "removed_at");
CREATE INDEX "portal_intake_members_user_id_removed_at_idx" ON "portal_intake_members"("user_id", "removed_at");
CREATE UNIQUE INDEX "portal_intake_members_active_user_key" ON "portal_intake_members"("setting_id", "user_id") WHERE "removed_at" IS NULL;

ALTER TABLE "complaints" ADD COLUMN "vehicle_make_snapshot" TEXT;
ALTER TABLE "complaints" ADD COLUMN "vehicle_model_snapshot" TEXT;
ALTER TABLE "complaints" ADD COLUMN "vehicle_vin_snapshot" TEXT;
ALTER TABLE "complaints" ADD COLUMN "customer_name_snapshot" TEXT;
