-- Add complaint_type column to complaint_root_causes table
ALTER TABLE "complaint_root_causes" ADD COLUMN IF NOT EXISTS "complaint_type" "ComplaintType";
