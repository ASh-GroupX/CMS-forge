-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFIED', 'TEST_DRIVE', 'QUOTE', 'FINANCE', 'DELIVERY', 'POST_DELIVERY');

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "current_holder_id" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'LEAD',
    "stage_due_at" TIMESTAMP(3) NOT NULL,
    "blocker" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_branch_id_stage_idx" ON "deals"("branch_id", "stage");

-- CreateIndex
CREATE INDEX "deals_owner_id_idx" ON "deals"("owner_id");

-- CreateIndex
CREATE INDEX "deals_current_holder_id_idx" ON "deals"("current_holder_id");

-- CreateIndex
CREATE INDEX "deals_stage_due_at_idx" ON "deals"("stage_due_at");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
