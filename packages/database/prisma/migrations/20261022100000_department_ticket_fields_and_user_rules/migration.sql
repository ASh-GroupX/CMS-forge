-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'TEXTAREA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "internal_tickets" ADD COLUMN IF NOT EXISTS "custom_fields" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "department_ticket_form_configs" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "enable_priority_field" BOOLEAN NOT NULL DEFAULT true,
    "enable_due_date_field" BOOLEAN NOT NULL DEFAULT true,
    "enable_attachments_field" BOOLEAN NOT NULL DEFAULT true,
    "enable_officer_selection" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_ticket_form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "department_ticket_custom_fields" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "field_type" "CustomFieldType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placeholder_en" TEXT,
    "placeholder_ar" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_ticket_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_ticket_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_send_without_manager_approval" BOOLEAN NOT NULL DEFAULT false,
    "can_direct_assign_officer" BOOLEAN NOT NULL DEFAULT true,
    "can_self_assign" BOOLEAN NOT NULL DEFAULT true,
    "can_transfer_department" BOOLEAN NOT NULL DEFAULT true,
    "can_close_directly" BOOLEAN NOT NULL DEFAULT true,
    "can_reopen_tickets" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ticket_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "department_ticket_form_configs_department_id_key" ON "department_ticket_form_configs"("department_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "department_ticket_custom_fields_department_id_is_active_order_idx" ON "department_ticket_custom_fields"("department_id", "is_active", "order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_ticket_rules_user_id_key" ON "user_ticket_rules"("user_id");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "department_ticket_form_configs" ADD CONSTRAINT "department_ticket_form_configs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "department_ticket_custom_fields" ADD CONSTRAINT "department_ticket_custom_fields_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_ticket_rules" ADD CONSTRAINT "user_ticket_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
