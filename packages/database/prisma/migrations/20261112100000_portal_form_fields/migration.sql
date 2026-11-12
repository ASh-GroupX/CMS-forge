CREATE TABLE "portal_intake_forms" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "version" INTEGER NOT NULL DEFAULT 1,
  "fields" JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "complaints" ADD COLUMN "portal_data" JSONB;
