CREATE TABLE "task_department_recipients" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_department_recipients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_department_recipients_task_id_department_id_key"
ON "task_department_recipients"("task_id", "department_id");

CREATE INDEX "task_department_recipients_department_id_idx"
ON "task_department_recipients"("department_id");

ALTER TABLE "task_department_recipients"
ADD CONSTRAINT "task_department_recipients_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_department_recipients"
ADD CONSTRAINT "task_department_recipients_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "task_department_recipients" ("id", "task_id", "department_id")
SELECT 'tdr_' || md5("id" || ':' || "assigned_department_id"), "id", "assigned_department_id"
FROM "tasks"
WHERE "assigned_department_id" IS NOT NULL
ON CONFLICT ("task_id", "department_id") DO NOTHING;
