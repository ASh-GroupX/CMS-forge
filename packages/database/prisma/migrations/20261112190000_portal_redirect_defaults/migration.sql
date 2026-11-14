ALTER TABLE "portal_intake_settings"
  ADD COLUMN "redirect_branch_id" TEXT,
  ADD COLUMN "redirect_department_id" TEXT;

ALTER TABLE "portal_intake_settings"
  ADD CONSTRAINT "portal_intake_settings_redirect_branch_id_fkey"
  FOREIGN KEY ("redirect_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "portal_intake_settings"
  ADD CONSTRAINT "portal_intake_settings_redirect_department_id_fkey"
  FOREIGN KEY ("redirect_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
