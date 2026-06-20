CREATE TYPE "CaseType" AS ENUM ('CUSTOMER_COMPLAINT');

CREATE TYPE "CaseLinkEntityType" AS ENUM ('CUSTOMER', 'VEHICLE', 'COMPLAINT', 'DEAL', 'EMPLOYEE');

CREATE TABLE "cases" (
  "id" TEXT NOT NULL,
  "type" "CaseType" NOT NULL DEFAULT 'CUSTOMER_COMPLAINT',
  "status" "ComplaintStatus" NOT NULL DEFAULT 'DRAFT',
  "branch_id" TEXT NOT NULL,
  "owner_id" TEXT,
  "subject" TEXT NOT NULL,
  "description_en" TEXT NOT NULL,
  "description_ar" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "case_links" (
  "id" TEXT NOT NULL,
  "case_id" TEXT NOT NULL,
  "entity_type" "CaseLinkEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "case_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cases_type_status_idx" ON "cases"("type", "status");
CREATE INDEX "cases_branch_id_status_idx" ON "cases"("branch_id", "status");
CREATE INDEX "cases_owner_id_idx" ON "cases"("owner_id");
CREATE INDEX "cases_created_at_idx" ON "cases"("created_at");
CREATE UNIQUE INDEX "case_links_case_id_entity_type_entity_id_key" ON "case_links"("case_id", "entity_type", "entity_id");
CREATE INDEX "case_links_entity_type_entity_id_idx" ON "case_links"("entity_type", "entity_id");

ALTER TABLE "cases" ADD CONSTRAINT "cases_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "case_links" ADD CONSTRAINT "case_links_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
