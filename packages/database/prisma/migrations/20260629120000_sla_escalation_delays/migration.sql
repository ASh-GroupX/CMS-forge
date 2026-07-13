ALTER TABLE "sla_policies"
  ADD COLUMN "escalation_level_2_after_breach_minutes" INTEGER,
  ADD COLUMN "escalation_level_3_after_breach_minutes" INTEGER;
