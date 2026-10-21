-- AlterTable
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "allowed_send_to_department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "allowed_receive_from_department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
