-- The task-board schema was added to schema.prisma without a deployable
-- migration. Production uses `prisma migrate deploy`, so Prisma attempted to
-- select these missing columns and returned INTERNAL_ERROR for task reads.

DO $$
BEGIN
  CREATE TYPE "BoardScope" AS ENUM ('TASKS', 'TICKETS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "board_stages" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "scope" "BoardScope" NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "mapped_task_status" "TaskStatus",
  "mapped_complaint_status" "ComplaintStatus",
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "board_stages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "stage_id" TEXT,
  ADD COLUMN IF NOT EXISTS "board_position" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "board_stages_code_key"
  ON "board_stages"("code");
CREATE INDEX IF NOT EXISTS "board_stages_scope_position_idx"
  ON "board_stages"("scope", "position");
CREATE INDEX IF NOT EXISTS "tasks_stage_id_board_position_idx"
  ON "tasks"("stage_id", "board_position");

DO $$
BEGIN
  ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_stage_id_fkey"
    FOREIGN KEY ("stage_id") REFERENCES "board_stages"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Production deploys migrations but does not run the development seed. Keep
-- the required default task and ticket columns available after migration.
INSERT INTO "board_stages" (
  "id", "code", "scope", "name_en", "name_ar", "color", "position",
  "is_default", "mapped_task_status", "mapped_complaint_status", "updated_at"
) VALUES
  ('board_stage_tasks_open', 'TASKS_OPEN', 'TASKS', 'Open', 'مفتوحة', 'slate', 0, true, 'OPEN', NULL, CURRENT_TIMESTAMP),
  ('board_stage_tasks_in_progress', 'TASKS_IN_PROGRESS', 'TASKS', 'In Progress', 'قيد التنفيذ', 'blue', 1, true, 'IN_PROGRESS', NULL, CURRENT_TIMESTAMP),
  ('board_stage_tasks_waiting', 'TASKS_WAITING', 'TASKS', 'Waiting', 'في الانتظار', 'amber', 2, true, 'WAITING', NULL, CURRENT_TIMESTAMP),
  ('board_stage_tasks_done', 'TASKS_DONE', 'TASKS', 'Done', 'منجزة', 'green', 3, true, 'DONE', NULL, CURRENT_TIMESTAMP),
  ('board_stage_tickets_draft', 'TICKETS_DRAFT', 'TICKETS', 'Draft', 'مسودة', 'slate', 0, true, NULL, 'DRAFT', CURRENT_TIMESTAMP),
  ('board_stage_tickets_submitted', 'TICKETS_SUBMITTED', 'TICKETS', 'Submitted', 'مقدمة', 'blue', 1, true, NULL, 'SUBMITTED', CURRENT_TIMESTAMP),
  ('board_stage_tickets_manager_review', 'TICKETS_MANAGER_REVIEW', 'TICKETS', 'Manager review', 'مراجعة المدير', 'violet', 2, true, NULL, 'MANAGER_REVIEW', CURRENT_TIMESTAMP),
  ('board_stage_tickets_branch_review', 'TICKETS_BRANCH_REVIEW', 'TICKETS', 'Branch review', 'مراجعة الفرع', 'violet', 3, true, NULL, 'BRANCH_REVIEW', CURRENT_TIMESTAMP),
  ('board_stage_tickets_in_progress', 'TICKETS_IN_PROGRESS', 'TICKETS', 'In progress', 'قيد المعالجة', 'amber', 4, true, NULL, 'IN_PROGRESS', CURRENT_TIMESTAMP),
  ('board_stage_tickets_resolved', 'TICKETS_RESOLVED', 'TICKETS', 'Resolved', 'تم الحل', 'green', 5, true, NULL, 'RESOLVED', CURRENT_TIMESTAMP),
  ('board_stage_tickets_closed', 'TICKETS_CLOSED', 'TICKETS', 'Closed', 'مغلقة', 'slate', 6, true, NULL, 'CLOSED', CURRENT_TIMESTAMP),
  ('board_stage_tickets_reopened', 'TICKETS_REOPENED', 'TICKETS', 'Reopened', 'أعيد فتحها', 'red', 7, true, NULL, 'REOPENED', CURRENT_TIMESTAMP),
  ('board_stage_tickets_rejected', 'TICKETS_REJECTED', 'TICKETS', 'Rejected', 'مرفوضة', 'red', 8, true, NULL, 'REJECTED', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "is_default" = true,
  "mapped_task_status" = EXCLUDED."mapped_task_status",
  "mapped_complaint_status" = EXCLUDED."mapped_complaint_status",
  "updated_at" = CURRENT_TIMESTAMP;
