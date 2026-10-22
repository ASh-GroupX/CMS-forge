-- AlterTable
ALTER TABLE "internal_tickets" ADD COLUMN IF NOT EXISTS "in_progress_at" TIMESTAMP(3);
