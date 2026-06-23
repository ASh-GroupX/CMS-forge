-- Make role identifiers extensible while retaining the existing RoleCode enum
-- for historical workflow metadata.
ALTER TABLE "roles"
  ALTER COLUMN "code" TYPE TEXT USING "code"::TEXT,
  ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "permissions" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "role_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
