-- Production runs `prisma migrate deploy` and intentionally does not run the
-- development seed. Install or repair the shared department reference data
-- required by complaint routing, task boards, and assignment pickers.
--
-- Ensure global departments (branch_id IS NULL, is_active = true) exist for all default codes.
INSERT INTO "departments" (
  "id",
  "code",
  "name_en",
  "name_ar",
  "branch_id",
  "is_active",
  "updated_at"
) VALUES
  ('department_default_sales', 'SALES', 'Sales', 'المبيعات', NULL, true, CURRENT_TIMESTAMP),
  ('department_default_service', 'SERVICE', 'Service', 'الصيانة', NULL, true, CURRENT_TIMESTAMP),
  ('department_default_parts', 'PARTS', 'Parts', 'قطع الغيار', NULL, true, CURRENT_TIMESTAMP),
  ('department_default_body_paint', 'BODY_PAINT', 'Body & Paint', 'السمكرة والدهان', NULL, true, CURRENT_TIMESTAMP),
  ('department_default_finance', 'FINANCE', 'Finance', 'المالية', NULL, true, CURRENT_TIMESTAMP),
  ('department_default_customer_care', 'CUSTOMER_CARE', 'Customer Care', 'خدمة العملاء', NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "branch_id" = NULL,
  "is_active" = true,
  "updated_at" = CURRENT_TIMESTAMP;
