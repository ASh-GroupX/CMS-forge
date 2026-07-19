-- Universal assignment foundation. Legacy assignment columns remain in place
-- and are backfilled into the generic aggregate for compatibility.

ALTER TABLE "tasks" ALTER COLUMN "assignee_id" DROP NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "assigned_department_id" TEXT;

ALTER TABLE "deals" ALTER COLUMN "current_holder_id" DROP NOT NULL;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "assigned_department_id" TEXT;

ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "assigned_department_id" TEXT;

CREATE TABLE "assignments" (
  "id" TEXT NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "assigned_user_id" TEXT,
  "assigned_department_id" TEXT,
  "scope_branch_id" TEXT,
  "assigned_by_id" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignments_target_required" CHECK (
    "assigned_user_id" IS NOT NULL OR "assigned_department_id" IS NOT NULL
  )
);

CREATE TABLE "assignment_history" (
  "id" TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action" VARCHAR(40) NOT NULL,
  "assigned_user_id" TEXT,
  "assigned_department_id" TEXT,
  "assigned_by_id" TEXT,
  "reason" TEXT,
  "correlation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignments_entity_type_entity_id_key"
  ON "assignments"("entity_type", "entity_id");
CREATE INDEX "assignments_assigned_user_id_entity_type_idx"
  ON "assignments"("assigned_user_id", "entity_type");
CREATE INDEX "assignments_assigned_department_id_entity_type_idx"
  ON "assignments"("assigned_department_id", "entity_type");
CREATE INDEX "assignments_scope_branch_id_entity_type_idx"
  ON "assignments"("scope_branch_id", "entity_type");
CREATE INDEX "assignment_history_entity_type_entity_id_created_at_idx"
  ON "assignment_history"("entity_type", "entity_id", "created_at");
CREATE INDEX "assignment_history_assigned_user_id_created_at_idx"
  ON "assignment_history"("assigned_user_id", "created_at");
CREATE INDEX "assignment_history_assigned_department_id_created_at_idx"
  ON "assignment_history"("assigned_department_id", "created_at");

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_department_id_fkey"
  FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_scope_branch_id_fkey"
  FOREIGN KEY ("scope_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assigned_department_id_fkey"
  FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_assigned_department_id_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_department_id_fkey"
      FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_assigned_department_id_fkey') THEN
    ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_department_id_fkey"
      FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cases_assigned_department_id_fkey') THEN
    ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_department_id_fkey"
      FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "tasks_assigned_department_id_idx" ON "tasks"("assigned_department_id");
CREATE INDEX "deals_assigned_department_id_idx" ON "deals"("assigned_department_id");
CREATE INDEX "cases_assigned_department_id_idx" ON "cases"("assigned_department_id");

INSERT INTO "assignments" (
  "id", "entity_type", "entity_id", "assigned_user_id",
  "assigned_department_id", "scope_branch_id", "created_at", "updated_at"
)
SELECT
  'asg_' || md5('TASK:' || task."id"), 'TASK', task."id", task."assignee_id",
  task."assigned_department_id", owner."branch_id", task."created_at", task."updated_at"
FROM "tasks" task
JOIN "users" owner ON owner."id" = task."owner_id"
WHERE task."assignee_id" IS NOT NULL OR task."assigned_department_id" IS NOT NULL
ON CONFLICT ("entity_type", "entity_id") DO NOTHING;

INSERT INTO "assignments" (
  "id", "entity_type", "entity_id", "assigned_user_id",
  "assigned_department_id", "scope_branch_id", "created_at", "updated_at"
)
SELECT
  'asg_' || md5('COMPLAINT:' || complaint."id"), 'COMPLAINT', complaint."id",
  complaint."owner_id", complaint."department_id", complaint."branch_id",
  complaint."created_at", complaint."updated_at"
FROM "complaints" complaint
WHERE complaint."owner_id" IS NOT NULL OR complaint."department_id" IS NOT NULL
ON CONFLICT ("entity_type", "entity_id") DO NOTHING;

INSERT INTO "assignments" (
  "id", "entity_type", "entity_id", "assigned_user_id",
  "assigned_department_id", "scope_branch_id", "created_at", "updated_at"
)
SELECT
  'asg_' || md5('DEAL:' || deal."id"), 'DEAL', deal."id",
  deal."current_holder_id", deal."assigned_department_id", deal."branch_id",
  deal."created_at", deal."updated_at"
FROM "deals" deal
WHERE deal."current_holder_id" IS NOT NULL OR deal."assigned_department_id" IS NOT NULL
ON CONFLICT ("entity_type", "entity_id") DO NOTHING;

INSERT INTO "assignments" (
  "id", "entity_type", "entity_id", "assigned_user_id",
  "assigned_department_id", "scope_branch_id", "created_at", "updated_at"
)
SELECT
  'asg_' || md5('CASE:' || case_row."id"), 'CASE', case_row."id",
  case_row."owner_id", case_row."assigned_department_id", case_row."branch_id",
  case_row."created_at", case_row."updated_at"
FROM "cases" case_row
WHERE case_row."owner_id" IS NOT NULL OR case_row."assigned_department_id" IS NOT NULL
ON CONFLICT ("entity_type", "entity_id") DO NOTHING;

INSERT INTO "assignment_history" (
  "id", "assignment_id", "entity_type", "entity_id", "action",
  "assigned_user_id", "assigned_department_id", "created_at"
)
SELECT
  'ash_' || md5(assignment."entity_type" || ':' || assignment."entity_id" || ':BACKFILLED'),
  assignment."id", assignment."entity_type", assignment."entity_id", 'BACKFILLED',
  assignment."assigned_user_id", assignment."assigned_department_id", assignment."updated_at"
FROM "assignments" assignment
WHERE NOT EXISTS (
  SELECT 1 FROM "assignment_history" history
  WHERE history."assignment_id" = assignment."id" AND history."action" = 'BACKFILLED'
);
