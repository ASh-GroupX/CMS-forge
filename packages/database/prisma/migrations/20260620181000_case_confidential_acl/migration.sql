CREATE TYPE "CaseConfidentialityLevel" AS ENUM ('NORMAL', 'CONFIDENTIAL');

CREATE TYPE "CaseParticipantRole" AS ENUM ('OWNER', 'PARTICIPANT', 'ACCUSED');

ALTER TABLE "cases" ADD COLUMN "confidentiality_level" "CaseConfidentialityLevel" NOT NULL DEFAULT 'NORMAL';

CREATE TABLE "case_participants" (
  "id" TEXT NOT NULL,
  "case_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "CaseParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "case_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "case_participants_case_id_user_id_key" ON "case_participants"("case_id", "user_id");
CREATE INDEX "case_participants_user_id_idx" ON "case_participants"("user_id");
CREATE INDEX "case_participants_role_idx" ON "case_participants"("role");
CREATE INDEX "cases_confidentiality_level_idx" ON "cases"("confidentiality_level");

ALTER TABLE "case_participants" ADD CONSTRAINT "case_participants_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_participants" ADD CONSTRAINT "case_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
