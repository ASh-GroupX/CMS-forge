-- Production runs `prisma migrate deploy` and intentionally does not run the
-- development seed. Install default SLA policies for every severity x stage.
--
-- 4 severities x 6 stages = 24 canonical global policies
-- Uses ON CONFLICT ("id") DO NOTHING so existing customized policies are never overwritten.

INSERT INTO "sla_policies" (
  "id",
  "severity",
  "stage",
  "branch_id",
  "department_id",
  "category_id",
  "duration_minutes",
  "warning_percent",
  "branch_timezone",
  "working_calendar_mode",
  "pause_policy",
  "escalation_level_1",
  "escalation_level_2",
  "escalation_level_3",
  "escalation_level_2_after_breach_minutes",
  "escalation_level_3_after_breach_minutes",
  "is_active",
  "created_at",
  "updated_at"
) VALUES
  -- CRITICAL (120 mins = 2h)
  ('sla_default_critical_intake', 'CRITICAL', 'INTAKE', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_critical_manager_review', 'CRITICAL', 'MANAGER_REVIEW', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_critical_branch_review', 'CRITICAL', 'BRANCH_REVIEW', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_critical_investigation', 'CRITICAL', 'INVESTIGATION', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_critical_resolution', 'CRITICAL', 'RESOLUTION', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_critical_closure', 'CRITICAL', 'CLOSURE', NULL, NULL, NULL, 120, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 30, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- HIGH (480 mins = 8h)
  ('sla_default_high_intake', 'HIGH', 'INTAKE', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_high_manager_review', 'HIGH', 'MANAGER_REVIEW', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_high_branch_review', 'HIGH', 'BRANCH_REVIEW', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_high_investigation', 'HIGH', 'INVESTIGATION', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_high_resolution', 'HIGH', 'RESOLUTION', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_high_closure', 'HIGH', 'CLOSURE', NULL, NULL, NULL, 480, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 60, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- MEDIUM (1440 mins = 24h = 1 day)
  ('sla_default_medium_intake', 'MEDIUM', 'INTAKE', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_medium_manager_review', 'MEDIUM', 'MANAGER_REVIEW', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_medium_branch_review', 'MEDIUM', 'BRANCH_REVIEW', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_medium_investigation', 'MEDIUM', 'INVESTIGATION', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_medium_resolution', 'MEDIUM', 'RESOLUTION', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_medium_closure', 'MEDIUM', 'CLOSURE', NULL, NULL, NULL, 1440, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 120, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- LOW (4320 mins = 72h = 3 days)
  ('sla_default_low_intake', 'LOW', 'INTAKE', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_low_manager_review', 'LOW', 'MANAGER_REVIEW', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_low_branch_review', 'LOW', 'BRANCH_REVIEW', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_low_investigation', 'LOW', 'INVESTIGATION', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_low_resolution', 'LOW', 'RESOLUTION', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla_default_low_closure', 'LOW', 'CLOSURE', NULL, NULL, NULL, 4320, 80, 'Asia/Riyadh', 'ALWAYS_ON', 'NONE', 'BRANCH_MANAGER', 'CR_MANAGER', 'ADMIN', 240, 480, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
