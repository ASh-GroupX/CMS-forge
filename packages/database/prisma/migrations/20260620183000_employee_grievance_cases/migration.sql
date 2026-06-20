ALTER TYPE "CaseType" ADD VALUE 'EMPLOYEE_GRIEVANCE';

CREATE TYPE "CaseLifecycleStatus" AS ENUM ('DRAFT', 'HR_REVIEW', 'INVESTIGATION', 'DECISION', 'CLOSED', 'APPEALED');

ALTER TABLE "cases" ADD COLUMN "lifecycle_status" "CaseLifecycleStatus" NOT NULL DEFAULT 'DRAFT';

CREATE TABLE "case_restricted_notes" (
  "id" TEXT NOT NULL,
  "case_id" TEXT NOT NULL,
  "author_id" TEXT,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "case_restricted_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "case_lifecycle_history" (
  "id" TEXT NOT NULL,
  "case_id" TEXT NOT NULL,
  "from_status" "CaseLifecycleStatus",
  "to_status" "CaseLifecycleStatus" NOT NULL,
  "actor_id" TEXT,
  "correlation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "case_lifecycle_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "case_restricted_notes_case_id_created_at_idx" ON "case_restricted_notes"("case_id", "created_at");
CREATE INDEX "case_restricted_notes_author_id_idx" ON "case_restricted_notes"("author_id");
CREATE INDEX "case_lifecycle_history_case_id_created_at_idx" ON "case_lifecycle_history"("case_id", "created_at");

ALTER TABLE "case_restricted_notes" ADD CONSTRAINT "case_restricted_notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_restricted_notes" ADD CONSTRAINT "case_restricted_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "case_lifecycle_history" ADD CONSTRAINT "case_lifecycle_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
