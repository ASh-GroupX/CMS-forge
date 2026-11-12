INSERT INTO "permissions" ("id", "code", "name_en", "name_ar", "is_active", "updated_at")
VALUES ('permission_complaint_manage', 'COMPLAINT_MANAGE', 'Manage complaints, including intake and routing', 'إدارة الشكاوى بما فيها الاستقبال والتوجيه', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
