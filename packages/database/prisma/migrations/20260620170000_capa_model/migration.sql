CREATE TABLE "capa_actions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "root_cause" TEXT NOT NULL,
    "responsible_department_id" TEXT NOT NULL,
    "corrective_action" TEXT NOT NULL,
    "preventive_action" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "effectiveness_check" TEXT,
    "repeat_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capa_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "capa_actions_case_id_idx" ON "capa_actions"("case_id");
CREATE INDEX "capa_actions_responsible_department_id_idx" ON "capa_actions"("responsible_department_id");
CREATE INDEX "capa_actions_due_at_idx" ON "capa_actions"("due_at");

ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
