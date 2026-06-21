CREATE TYPE "CapaActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

ALTER TABLE "capa_actions"
  ADD COLUMN "owner_id" TEXT,
  ADD COLUMN "status" "CapaActionStatus" NOT NULL DEFAULT 'OPEN',
  ALTER COLUMN "responsible_department_id" DROP NOT NULL;

UPDATE "capa_actions" AS capa
SET "owner_id" = COALESCE(cases."owner_id", audit."actor_id", (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1))
FROM "cases" AS cases
LEFT JOIN LATERAL (
  SELECT "actor_id"
  FROM "audit_logs"
  WHERE "target_type" = 'case' AND "target_id" = cases."id" AND "actor_id" IS NOT NULL
  ORDER BY "created_at" ASC
  LIMIT 1
) AS audit ON true
WHERE capa."case_id" = cases."id";

ALTER TABLE "capa_actions" ALTER COLUMN "owner_id" SET NOT NULL;

CREATE INDEX "capa_actions_owner_id_idx" ON "capa_actions"("owner_id");
CREATE INDEX "capa_actions_status_idx" ON "capa_actions"("status");

ALTER TABLE "capa_actions"
  ADD CONSTRAINT "capa_actions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
