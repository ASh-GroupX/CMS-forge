CREATE TABLE "complaint_relations" (
  "id" TEXT NOT NULL,
  "source_complaint_id" TEXT NOT NULL,
  "target_complaint_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "complaint_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "complaint_relations_source_complaint_id_target_complaint_id_key" ON "complaint_relations"("source_complaint_id", "target_complaint_id");
CREATE INDEX "complaint_relations_target_complaint_id_idx" ON "complaint_relations"("target_complaint_id");

ALTER TABLE "complaint_relations" ADD CONSTRAINT "complaint_relations_source_complaint_id_fkey" FOREIGN KEY ("source_complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_relations" ADD CONSTRAINT "complaint_relations_target_complaint_id_fkey" FOREIGN KEY ("target_complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
