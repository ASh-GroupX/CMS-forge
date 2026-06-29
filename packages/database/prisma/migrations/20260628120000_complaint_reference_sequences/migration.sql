-- CreateTable
CREATE TABLE "complaint_reference_sequences" (
    "branch_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "next_sequence" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_reference_sequences_pkey" PRIMARY KEY ("branch_id","year")
);

-- AddForeignKey
ALTER TABLE "complaint_reference_sequences" ADD CONSTRAINT "complaint_reference_sequences_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
