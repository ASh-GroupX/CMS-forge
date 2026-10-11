/*
  Warnings:

  - The `actor_role` column on the `complaint_status_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BoardScope" AS ENUM ('TASKS', 'TICKETS');

-- CreateEnum
CREATE TYPE "InternalTicketStatus" AS ENUM ('PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InternalTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "ComplaintStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'COMPLETE';
ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'CUSTOMER_REJECT_RESOLUTION';
ALTER TYPE "ComplaintTransitionAction" ADD VALUE 'CUSTOMER_RESUBMIT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ComplaintType" ADD VALUE 'ACTION_REQUEST';
ALTER TYPE "ComplaintType" ADD VALUE 'CALL_BACK_REQUEST';
ALTER TYPE "ComplaintType" ADD VALUE 'SERVICE_VISIT_REQUEST';
ALTER TYPE "ComplaintType" ADD VALUE 'FOLLOW_UP_REQUEST';
ALTER TYPE "ComplaintType" ADD VALUE 'INFORMATION_REQUEST';

-- DropForeignKey
ALTER TABLE "capa_actions" DROP CONSTRAINT "capa_actions_responsible_department_id_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_current_holder_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";

-- DropIndex
DROP INDEX "capa_actions_status_idx";

-- AlterTable
ALTER TABLE "assignments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "is_external" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_internal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "complaint_status_history" ALTER COLUMN "actor_role" TYPE TEXT USING "actor_role"::TEXT;

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "customer_type" TEXT,
ADD COLUMN     "last_service_date" TIMESTAMP(3),
ADD COLUMN     "odometer" INTEGER,
ADD COLUMN     "repeat_customer" BOOLEAN,
ADD COLUMN     "root_cause_category" TEXT,
ADD COLUMN     "sales_advisor_name" TEXT,
ADD COLUMN     "template_data" JSONB,
ADD COLUMN     "template_id" TEXT,
ADD COLUMN     "warranty_active" BOOLEAN;

-- AlterTable
ALTER TABLE "notification_templates" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "board_position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage_id" TEXT;

-- CreateTable
CREATE TABLE "board_stages" (
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

-- CreateTable
CREATE TABLE "RoleCodeExport" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,

    CONSTRAINT "RoleCodeExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_waiting_reasons" (
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

-- CreateTable
CREATE TABLE "ticket_resolution_reasons" (
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

-- CreateTable
CREATE TABLE "ticket_reject_reasons" (
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

-- CreateTable
CREATE TABLE "ticket_sla_options" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_sla_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_tickets" (
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

-- CreateTable
CREATE TABLE "ticket_notes" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_activities" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
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

-- CreateTable
CREATE TABLE "ticket_note_attachments" (
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

-- CreateTable
CREATE TABLE "ticket_ratings" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_problems" (
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

-- CreateTable
CREATE TABLE "department_complaint_templates" (
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

-- CreateIndex
CREATE UNIQUE INDEX "board_stages_code_key" ON "board_stages"("code");

-- CreateIndex
CREATE INDEX "board_stages_scope_position_idx" ON "board_stages"("scope", "position");

-- CreateIndex
CREATE INDEX "ticket_waiting_reasons_department_id_idx" ON "ticket_waiting_reasons"("department_id");

-- CreateIndex
CREATE INDEX "ticket_resolution_reasons_department_id_idx" ON "ticket_resolution_reasons"("department_id");

-- CreateIndex
CREATE INDEX "ticket_reject_reasons_department_id_idx" ON "ticket_reject_reasons"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_tickets_reference_number_key" ON "internal_tickets"("reference_number");

-- CreateIndex
CREATE INDEX "internal_tickets_target_department_id_status_idx" ON "internal_tickets"("target_department_id", "status");

-- CreateIndex
CREATE INDEX "internal_tickets_assigned_employee_id_idx" ON "internal_tickets"("assigned_employee_id");

-- CreateIndex
CREATE INDEX "internal_tickets_requested_by_id_idx" ON "internal_tickets"("requested_by_id");

-- CreateIndex
CREATE INDEX "ticket_notes_ticket_id_idx" ON "ticket_notes"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_notes_author_id_idx" ON "ticket_notes"("author_id");

-- CreateIndex
CREATE INDEX "ticket_activities_ticket_id_created_at_idx" ON "ticket_activities"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_activities_actor_id_idx" ON "ticket_activities"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_attachments_storage_key_key" ON "ticket_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_attachments_scan_status_idx" ON "ticket_attachments"("scan_status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_note_attachments_storage_key_key" ON "ticket_note_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "ticket_note_attachments_note_id_idx" ON "ticket_note_attachments"("note_id");

-- CreateIndex
CREATE INDEX "ticket_note_attachments_scan_status_idx" ON "ticket_note_attachments"("scan_status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ratings_ticket_id_key" ON "ticket_ratings"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_ratings_employee_id_idx" ON "ticket_ratings"("employee_id");

-- CreateIndex
CREATE INDEX "standard_problems_department_id_idx" ON "standard_problems"("department_id");

-- CreateIndex
CREATE INDEX "standard_problems_category_id_idx" ON "standard_problems"("category_id");

-- CreateIndex
CREATE INDEX "department_complaint_templates_department_id_idx" ON "department_complaint_templates"("department_id");

-- CreateIndex
CREATE INDEX "tasks_stage_id_board_position_idx" ON "tasks"("stage_id", "board_position");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "department_complaint_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "board_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_waiting_reasons" ADD CONSTRAINT "ticket_waiting_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_resolution_reasons" ADD CONSTRAINT "ticket_resolution_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reject_reasons" ADD CONSTRAINT "ticket_reject_reasons_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_requested_employee_id_fkey" FOREIGN KEY ("requested_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_target_department_id_fkey" FOREIGN KEY ("target_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_waiting_reason_id_fkey" FOREIGN KEY ("waiting_reason_id") REFERENCES "ticket_waiting_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_resolution_reason_id_fkey" FOREIGN KEY ("resolution_reason_id") REFERENCES "ticket_resolution_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_tickets" ADD CONSTRAINT "internal_tickets_reject_reason_id_fkey" FOREIGN KEY ("reject_reason_id") REFERENCES "ticket_reject_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_notes" ADD CONSTRAINT "ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_note_attachments" ADD CONSTRAINT "ticket_note_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "ticket_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_note_attachments" ADD CONSTRAINT "ticket_note_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_problems" ADD CONSTRAINT "standard_problems_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_problems" ADD CONSTRAINT "standard_problems_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_complaint_templates" ADD CONSTRAINT "department_complaint_templates_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "notification_digest_items_recipient_user_id_record_type_record_" RENAME TO "notification_digest_items_recipient_user_id_record_type_rec_idx";
