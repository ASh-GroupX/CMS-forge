import type { Locale } from './staff-shell';

const en = {
  title: 'Admin hub',
  subtitle: 'Choose one workspace. Each area owns one admin object type and its actions.',
  open: 'Open workspace',
  workspacesLabel: 'Admin workspaces',
  workspaces: {
    users: ['Users', 'Create staff accounts, activate users, and assign branch scope.'],
    roles: ['Roles and permissions', 'Manage role permission sets enforced by the server session.'],
    branches: ['Branches and departments', 'Maintain branch and department structure for routing and scope.'],
    categories: ['Categories and SLA', 'Maintain complaint categories, severity values, and SLA policies.'],
    templates: ['Notification templates', 'Review operational notification templates and delivery copy.'],
    standardProblems: ['Standard Problems', 'Manage common problem templates for each department.'],
    complaintTemplates: ['Complaint Templates', 'Manage custom form fields for specific departments.'],
    ticketSettings: ['Internal Ticket Settings', 'Manage lists for resolution subjects, waiting reasons, and reject reasons.'],
    complaintSettings: ['Complaint CRM Settings', 'Manage Root Cause Categories and Sales Advisors for complaints.'],
    sla: ['SLA Policies', 'Manage complaint resolution SLA durations, warning thresholds, calendar modes, and escalation levels.'],
  },
};

export const adminHubText: Record<Locale, typeof en> = {
  en,
  ar: {
    workspacesLabel: 'مساحات عمل الإدارة',
    title: 'مركز الإدارة',
    subtitle: 'اختر مساحة العمل المطلوبة لإدارة البيانات الأساسية والصلاحيات وإعدادات النظام.',
    open: 'فتح مساحة العمل',
    workspaces: {
      users: ['المستخدمون', 'إنشاء حسابات الموظفين وتفعيلها وتحديد نطاق الفروع.'],
      roles: ['الأدوار والصلاحيات', 'إدارة أدوار الموظفين ومصفوفة الصلاحيات المعتمدة في النظام.'],
      branches: ['الفروع والأقسام', 'إدارة الهيكل التنظيمي للفروع والأقسام لتوجيه الشكاوى وتحديد الصلاحيات.'],
      categories: ['التصنيفات واتفاقية الخدمة', 'إدارة تصنيفات الشكاوى ومستويات الأولوية وسياسات اتفاقية الخدمة (SLA).'],
      templates: ['قوالب الإشعارات', 'إدارة قوالب الرسائل التلقائية ثنائية اللغة ونصوص الإشعارات.'],
      standardProblems: ['المشاكل الشائعة', 'إدارة قوالب المشاكل الشائعة لكل قسم.'],
      complaintTemplates: ['قوالب الشكاوى', 'إدارة الحقول الإضافية للشكاوى حسب القسم.'],
      ticketSettings: ['إعدادات التذاكر والمهام الداخلية', 'إدارة قوائم مواضيع المعالجة، وأسباب الانتظار، ومبررات الرفض.'],
      complaintSettings: ['إعدادات شكاوى العملاء (CRM)', 'إدارة تصنيفات الأسباب الجذرية وقائمة مستشاري المبيعات.'],
      sla: ['سياسات اتفاقية مستوى الخدمة (SLA)', 'إدارة مدد معالجة الشكاوى ونسب التحذير وساعات العمل ومستويات التصعيد.'],
    },
  },
};
