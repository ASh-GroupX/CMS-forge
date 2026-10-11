-- Idempotent deployment migration for internal tickets and system updates

-- 1. Create Enums if they do not exist
DO $$ BEGIN
  CREATE TYPE "InternalTicketStatus" AS ENUM ('PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InternalTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BoardScope" AS ENUM ('TASKS', 'TICKETS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter existing enums safely
DO $$ BEGIN
  ALTER TYPE "ComplaintStatus" ADD VALUE 'COMPLETED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'COMPLETE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'CUSTOMER_REJECT_RESOLUTION';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'CUSTOMER_RESUBMIT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintType" ADD VALUE 'ACTION_REQUEST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintType" ADD VALUE 'CALL_BACK_REQUEST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintType" ADD VALUE 'SERVICE_VISIT_REQUEST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintType" ADD VALUE 'FOLLOW_UP_REQUEST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ComplaintType" ADD VALUE 'INFORMATION_REQUEST';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Alter existing tables safely
DO $$ BEGIN
  ALTER TABLE "assignments" ALTER COLUMN "updated_at" DROP DEFAULT;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "branch_id" TEXT,
  ADD COLUMN IF NOT EXISTS "department_id" TEXT,
  ADD COLUMN IF NOT EXISTS "is_external" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "is_internal" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "complaint_status_history" ALTER COLUMN "actor_role" TYPE TEXT USING "actor_role"::TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE "complaints"
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_type" TEXT,
  ADD COLUMN IF NOT EXISTS "last_service_date" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "odometer" INTEGER,
  ADD COLUMN IF NOT EXISTS "repeat_customer" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "root_cause_category" TEXT,
  ADD COLUMN IF NOT EXISTS "sales_advisor_name" TEXT,
  ADD COLUMN IF NOT EXISTS "template_data" JSONB,
  ADD COLUMN IF NOT EXISTS "template_id" TEXT,
  ADD COLUMN IF NOT EXISTS "warranty_active" BOOLEAN;

DO $$ BEGIN
  ALTER TABLE "notification_templates" ALTER COLUMN "updated_at" DROP DEFAULT;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "board_position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stage_id" TEXT;

-- 4. Create new tables if they do not exist
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

CREATE TABLE IF NOT EXISTS "RoleCodeExport" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,

    CONSTRAINT "RoleCodeExport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_categories" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_waiting_reasons" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "reason_en" TEXT NOT NULL,
    "reason_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_waiting_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_resolution_reasons" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "reason_en" TEXT NOT NULL,
    "reason_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_resolution_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_reject_reasons" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "reason_en" TEXT NOT NULL,
    "reason_ar" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_reject_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_sla_options" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_sla_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "internal_tickets" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InternalTicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "InternalTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "requested_by_id" TEXT NOT NULL,
    "target_department_id" TEXT NOT NULL,
    "assigned_employee_id" TEXT,
    "requested_employee_id" TEXT,
    "category_id" TEXT NOT NULL,
    "waiting_reason_id" TEXT,
    "custom_waiting_reason" TEXT,
    "resolution_reason_id" TEXT,
    "resolution_details" TEXT,
    "reject_reason_id" TEXT,
    "reject_details" TEXT,
    "sla_option_id" TEXT,
    "due_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_notes" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_activities" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "scan_status" "AttachmentScanStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_note_attachments" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "scan_status" "AttachmentScanStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_note_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ticket_ratings" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "standard_problems" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standard_problems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "department_complaint_templates" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_complaint_templates_pkey" PRIMARY KEY ("id")
);

-- 5. Create Indexes if they do not exist
CREATE UNIQUE INDEX IF NOT EXISTS "board_stages_code_key" ON "board_stages"("code");
CREATE INDEX IF NOT EXISTS "board_stages_scope_position_idx" ON "board_stages"("scope", "position");
CREATE INDEX IF NOT EXISTS "ticket_waiting_reasons_department_id_idx" ON "ticket_waiting_reasons"("department_id");
CREATE INDEX IF NOT EXISTS "ticket_resolution_reasons_department_id_idx" ON "ticket_resolution_reasons"("department_id");
CREATE INDEX IF NOT EXISTS "ticket_reject_reasons_department_id_idx" ON "ticket_reject_reasons"("department_id");
CREATE UNIQUE INDEX IF NOT EXISTS "internal_tickets_reference_number_key" ON "internal_tickets"("reference_number");
CREATE INDEX IF NOT EXISTS "internal_tickets_target_department_id_status_idx" ON "internal_tickets"("target_department_id", "status");
CREATE INDEX IF NOT EXISTS "internal_tickets_assigned_employee_id_idx" ON "internal_tickets"("assigned_employee_id");
CREATE INDEX IF NOT EXISTS "internal_tickets_requested_by_id_idx" ON "internal_tickets"("requested_by_id");
CREATE INDEX IF NOT EXISTS "ticket_notes_ticket_id_idx" ON "ticket_notes"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_notes_author_id_idx" ON "ticket_notes"("author_id");
CREATE INDEX IF NOT EXISTS "ticket_activities_ticket_id_created_at_idx" ON "ticket_activities"("ticket_id", "created_at");
CREATE INDEX IF NOT EXISTS "ticket_activities_actor_id_idx" ON "ticket_activities"("actor_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_attachments_storage_key_key" ON "ticket_attachments"("storage_key");
CREATE INDEX IF NOT EXISTS "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_attachments_scan_status_idx" ON "ticket_attachments"("scan_status");
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_note_attachments_storage_key_key" ON "ticket_note_attachments"("storage_key");
CREATE INDEX IF NOT EXISTS "ticket_note_attachments_note_id_idx" ON "ticket_note_attachments"("note_id");
CREATE INDEX IF NOT EXISTS "ticket_note_attachments_scan_status_idx" ON "ticket_note_attachments"("scan_status");
CREATE UNIQUE INDEX IF NOT EXISTS "ticket_ratings_ticket_id_key" ON "ticket_ratings"("ticket_id");
CREATE INDEX IF NOT EXISTS "ticket_ratings_employee_id_idx" ON "ticket_ratings"("employee_id");
CREATE INDEX IF NOT EXISTS "standard_problems_department_id_idx" ON "standard_problems"("department_id");
CREATE INDEX IF NOT EXISTS "standard_problems_category_id_idx" ON "standard_problems"("category_id");
CREATE INDEX IF NOT EXISTS "department_complaint_templates_department_id_idx" ON "department_complaint_templates"("department_id");
CREATE INDEX IF NOT EXISTS "tasks_stage_id_board_position_idx" ON "tasks"("stage_id", "board_position");

-- 6. Add Foreign Keys safely
DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "complaints" ADD CONSTRAINT "complaints_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "department_complaint_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "board_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_waiting_reasons" ADD CONSTRAINT "ticket_waiting_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_resolution_reasons" ADD CONSTRAINT "ticket_resolution_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_reject_reasons" ADD CONSTRAINT "ticket_reject_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_requested_employee_id_fkey" FOREIGN KEY ("requested_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_target_department_id_fkey" FOREIGN KEY ("target_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_waiting_reason_id_fkey" FOREIGN KEY ("waiting_reason_id") REFERENCES "ticket_waiting_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_resolution_reason_id_fkey" FOREIGN KEY ("resolution_reason_id") REFERENCES "ticket_resolution_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_reject_reason_id_fkey" FOREIGN KEY ("reject_reason_id") REFERENCES "ticket_reject_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_note_attachments" ADD CONSTRAINT "ticket_note_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "ticket_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_note_attachments" ADD CONSTRAINT "ticket_note_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "standard_problems" ADD CONSTRAINT "standard_problems_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "standard_problems" ADD CONSTRAINT "standard_problems_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "department_complaint_templates" ADD CONSTRAINT "department_complaint_templates_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER INDEX "notification_digest_items_recipient_user_id_record_type_record_" RENAME TO "notification_digest_items_recipient_user_id_record_type_rec_idx";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
