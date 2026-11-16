INSERT INTO "permissions" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES
  ('perm_ticket_view_department', 'TICKET_VIEW_DEPARTMENT', 'View department ticket queue', 'عرض تذاكر القسم', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_bypass_ticket_approval', 'BYPASS_TICKET_APPROVAL', 'Send tickets without manager approval', 'إرسال التذاكر دون موافقة المدير', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_task_view_branch', 'TASK_VIEW_BRANCH', 'View branch task oversight', 'عرض مهام الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_task_manage_branch', 'TASK_MANAGE_BRANCH', 'Manage branch tasks', 'إدارة مهام الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_task_manage_all', 'TASK_MANAGE_ALL', 'Manage tasks across branches', 'إدارة المهام في جميع الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_deal_view_branch', 'DEAL_VIEW_BRANCH', 'View branch deal handoffs', 'عرض تسليمات مبيعات الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_deal_view_all', 'DEAL_VIEW_ALL', 'View deal handoffs across branches', 'عرض تسليمات المبيعات في جميع الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_deal_manage_branch', 'DEAL_MANAGE_BRANCH', 'Manage branch deal handoffs', 'إدارة تسليمات مبيعات الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_deal_manage_all', 'DEAL_MANAGE_ALL', 'Manage deal handoffs across branches', 'إدارة تسليمات المبيعات في جميع الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_case_view_branch', 'CASE_VIEW_BRANCH', 'View branch cases', 'عرض قضايا الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_case_view_all', 'CASE_VIEW_ALL', 'View cases across branches', 'عرض القضايا في جميع الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_case_manage', 'CASE_MANAGE', 'Manage accessible cases', 'إدارة القضايا المتاحة', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_assignment_cross_branch', 'ASSIGNMENT_CROSS_BRANCH', 'Assign work across branches', 'تعيين العمل بين الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_report_scope_branch', 'REPORT_SCOPE_BRANCH', 'Export records in my branch', 'تصدير سجلات فرعي', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_report_scope_all', 'REPORT_SCOPE_ALL', 'Export records across branches', 'تصدير السجلات في جميع الفروع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

WITH granted AS (
  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT r."id", p."id"
  FROM "roles" r
  JOIN "permissions" p ON (
    (r."code" = 'ADMIN') OR
    (r."code" = 'CR_MANAGER' AND p."code" IN ('TICKET_VIEW_DEPARTMENT', 'TASK_VIEW_BRANCH', 'TASK_MANAGE_BRANCH', 'TASK_MANAGE_ALL', 'DEAL_VIEW_BRANCH', 'DEAL_VIEW_ALL', 'DEAL_MANAGE_BRANCH', 'CASE_VIEW_BRANCH', 'CASE_MANAGE', 'ASSIGNMENT_CROSS_BRANCH')) OR
    (r."code" = 'CR_OFFICER' AND p."code" IN ('CASE_VIEW_BRANCH', 'CASE_MANAGE', 'ASSIGNMENT_CROSS_BRANCH')) OR
    (r."code" = 'BRANCH_MANAGER' AND p."code" IN ('TICKET_VIEW_DEPARTMENT', 'TASK_VIEW_BRANCH', 'TASK_MANAGE_BRANCH', 'DEAL_VIEW_BRANCH', 'DEAL_MANAGE_BRANCH', 'CASE_VIEW_BRANCH', 'CASE_MANAGE', 'REPORT_SCOPE_BRANCH')) OR
    (r."code" IN ('DEPARTMENT_MANAGER', 'DEPARTMENT_MANGER') AND p."code" = 'TICKET_VIEW_DEPARTMENT') OR
    (r."code" = 'MGMT_READONLY' AND p."code" IN ('TASK_VIEW_BRANCH', 'DEAL_VIEW_BRANCH', 'CASE_VIEW_BRANCH', 'REPORT_SCOPE_BRANCH'))
  )
  WHERE p."code" IN ('TICKET_VIEW_DEPARTMENT', 'BYPASS_TICKET_APPROVAL', 'TASK_VIEW_BRANCH', 'TASK_MANAGE_BRANCH', 'TASK_MANAGE_ALL', 'DEAL_VIEW_BRANCH', 'DEAL_VIEW_ALL', 'DEAL_MANAGE_BRANCH', 'DEAL_MANAGE_ALL', 'CASE_VIEW_BRANCH', 'CASE_VIEW_ALL', 'CASE_MANAGE', 'ASSIGNMENT_CROSS_BRANCH', 'REPORT_SCOPE_BRANCH', 'REPORT_SCOPE_ALL')
  ON CONFLICT ("role_id", "permission_id") DO NOTHING
  RETURNING "role_id", "permission_id"
)
INSERT INTO "audit_logs" ("id", "event_type", "action", "target_type", "target_id", "metadata")
SELECT 'audit_role_capability_' || granted."role_id" || '_' || granted."permission_id", 'CONFIG', 'role_permission_seeded', 'role', granted."role_id",
       jsonb_build_object('permissionId', granted."permission_id", 'source', 'migration')
FROM granted;
