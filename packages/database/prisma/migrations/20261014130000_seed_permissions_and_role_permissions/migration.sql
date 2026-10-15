-- Seed standard permissions
INSERT INTO "permissions" ("id", "code", "name_en", "name_ar", "is_active", "created_at", "updated_at")
VALUES
  ('perm_staff_login', 'STAFF_LOGIN', 'Staff Login', 'تسجيل دخول الموظفين', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_create', 'COMPLAINT_CREATE', 'Create Complaint', 'إنشاء شكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_view_assigned', 'COMPLAINT_VIEW_ASSIGNED', 'View Assigned Complaints', 'عرض الشكاوى المعينة', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_view_branch', 'COMPLAINT_VIEW_BRANCH', 'View Branch Complaints', 'عرض شكاوى الفرع', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_view_all', 'COMPLAINT_VIEW_ALL', 'View All Complaints', 'عرض جميع الشكاوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_edit', 'COMPLAINT_EDIT', 'Edit Complaint', 'تعديل الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_submit', 'COMPLAINT_SUBMIT', 'Submit Complaint', 'إرسال الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_approve', 'COMPLAINT_APPROVE', 'Approve Complaint', 'الموافقة على الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_assign', 'COMPLAINT_ASSIGN', 'Assign Complaint', 'تعيين الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_comment_internal', 'COMPLAINT_COMMENT_INTERNAL', 'Add Internal Comment', 'إضافة تعليق داخلي', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_comment_public', 'COMPLAINT_COMMENT_PUBLIC', 'Add Public Comment', 'إضافة تعليق للعميل', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_resolve', 'COMPLAINT_RESOLVE', 'Resolve Complaint', 'حل الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_close', 'COMPLAINT_CLOSE', 'Close Complaint', 'إغلاق الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_reopen', 'COMPLAINT_REOPEN', 'Reopen Complaint', 'إعادة فتح الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_reject', 'COMPLAINT_REJECT', 'Reject Complaint', 'رفض الشكوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_complaint_manage', 'COMPLAINT_MANAGE', 'Manage Complaints', 'إدارة الشكاوى', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_attachment_upload_staff', 'ATTACHMENT_UPLOAD_STAFF', 'Upload Internal Attachment', 'رفع مرفق داخلي', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_attachment_upload_public', 'ATTACHMENT_UPLOAD_PUBLIC', 'Upload Public Attachment', 'رفع مرفق عام', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_attachment_download', 'ATTACHMENT_DOWNLOAD', 'Download Attachment', 'تحميل المرفقات', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_compensation_view', 'COMPENSATION_VIEW', 'View Compensation', 'عرض التعويضات', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_compensation_propose', 'COMPENSATION_PROPOSE', 'Propose Compensation', 'اقتراح تعويض', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_compensation_approve', 'COMPENSATION_APPROVE', 'Approve Compensation', 'الموافقة على التعويض', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_report_view', 'REPORT_VIEW', 'View Reports', 'عرض التقارير', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_report_export', 'REPORT_EXPORT', 'Export Reports', 'تصدير التقارير', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_portal_submit', 'PORTAL_SUBMIT', 'Submit from Portal', 'إرسال من البوابة', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Seed role permissions for each existing system role
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON (
  (r."code" = 'ADMIN') OR
  (r."code" = 'CR_MANAGER' AND p."code" IN ('STAFF_LOGIN','COMPLAINT_CREATE','COMPLAINT_VIEW_BRANCH','COMPLAINT_VIEW_ALL','COMPLAINT_EDIT','COMPLAINT_SUBMIT','COMPLAINT_APPROVE','COMPLAINT_ASSIGN','COMPLAINT_COMMENT_INTERNAL','COMPLAINT_COMMENT_PUBLIC','COMPLAINT_RESOLVE','COMPLAINT_CLOSE','COMPLAINT_REOPEN','COMPLAINT_REJECT','COMPLAINT_MANAGE','ATTACHMENT_UPLOAD_STAFF','ATTACHMENT_UPLOAD_PUBLIC','ATTACHMENT_DOWNLOAD','COMPENSATION_VIEW','COMPENSATION_PROPOSE','COMPENSATION_APPROVE','REPORT_VIEW','REPORT_EXPORT')) OR
  (r."code" = 'BRANCH_MANAGER' AND p."code" IN ('STAFF_LOGIN','COMPLAINT_CREATE','COMPLAINT_VIEW_BRANCH','COMPLAINT_EDIT','COMPLAINT_SUBMIT','COMPLAINT_APPROVE','COMPLAINT_ASSIGN','COMPLAINT_COMMENT_INTERNAL','COMPLAINT_COMMENT_PUBLIC','COMPLAINT_RESOLVE','COMPLAINT_CLOSE','COMPLAINT_REOPEN','COMPLAINT_REJECT','COMPLAINT_MANAGE','ATTACHMENT_UPLOAD_STAFF','ATTACHMENT_DOWNLOAD','COMPENSATION_VIEW','COMPENSATION_PROPOSE','COMPENSATION_APPROVE','REPORT_VIEW')) OR
  (r."code" = 'CR_OFFICER' AND p."code" IN ('STAFF_LOGIN','COMPLAINT_CREATE','COMPLAINT_VIEW_ASSIGNED','COMPLAINT_VIEW_BRANCH','COMPLAINT_EDIT','COMPLAINT_SUBMIT','COMPLAINT_COMMENT_INTERNAL','COMPLAINT_COMMENT_PUBLIC','COMPLAINT_RESOLVE','ATTACHMENT_UPLOAD_STAFF','ATTACHMENT_DOWNLOAD','COMPENSATION_PROPOSE','REPORT_VIEW')) OR
  (r."code" = 'MGMT_READONLY' AND p."code" IN ('STAFF_LOGIN','COMPLAINT_VIEW_ALL','ATTACHMENT_DOWNLOAD','REPORT_VIEW','REPORT_EXPORT')) OR
  (r."code" = 'CUSTOMER_PORTAL' AND p."code" IN ('PORTAL_SUBMIT','COMPLAINT_COMMENT_PUBLIC','ATTACHMENT_UPLOAD_PUBLIC','ATTACHMENT_DOWNLOAD'))
)
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
