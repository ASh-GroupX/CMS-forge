INSERT INTO "permissions" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES ('perm_complaint_create_cross_branch', 'COMPLAINT_CREATE_CROSS_BRANCH', 'Create complaints for other branches', 'إنشاء شكاوى لفروع أخرى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

WITH granted AS (
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT r."id", p."id"
  FROM "roles" r
  JOIN "permissions" p ON p."code" = 'COMPLAINT_CREATE_CROSS_BRANCH'
  WHERE r."code" IN ('CR_OFFICER', 'CR_MANAGER', 'ADMIN')
  ON CONFLICT ("role_id", "permission_id") DO NOTHING
  RETURNING "role_id"
)
INSERT INTO "audit_logs" ("id", "event_type", "action", "target_type", "target_id", "metadata")
SELECT 'audit_cross_branch_create_' || granted."role_id", 'CONFIG', 'role_permission_seeded', 'role', granted."role_id",
       jsonb_build_object('permissionCode', 'COMPLAINT_CREATE_CROSS_BRANCH', 'source', 'migration')
FROM granted;
