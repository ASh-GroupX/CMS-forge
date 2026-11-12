ALTER TABLE "assignments" ADD COLUMN "released_at" TIMESTAMP(3);
CREATE INDEX "assignments_entity_type_released_at_idx" ON "assignments"("entity_type", "released_at");
