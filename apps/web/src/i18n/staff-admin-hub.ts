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
  },
};

export const adminHubText: Record<Locale, typeof en> = {
  en,
  ar: {
    workspacesLabel: 'مساحات عمل الإدارة',
    title: 'مركز الإدارة',
    subtitle: 'اختر مساحة عمل واحدة. كل مساحة تدير نوع إعدادات محدد وإجراءاته.',
    open: 'فتح مساحة العمل',
    workspaces: {
      users: ['المستخدمون', 'إنشاء حسابات الموظفين وتفعيلها وتحديد نطاق الفروع.'],
      roles: ['الأدوار والصلاحيات', 'إدارة مجموعات الصلاحيات التي يطبقها الخادم من جلسة الموظف.'],
      branches: ['الفروع والأقسام', 'إدارة هيكل الفروع والأقسام للتوجيه والنطاق.'],
      categories: ['التصنيفات واتفاقية الخدمة', 'إدارة تصنيفات الشكاوى ودرجات الخطورة وسياسات SLA.'],
      templates: ['قوالب الإشعارات', 'مراجعة قوالب الإشعارات التشغيلية ونصوص التسليم.'],
    },
  },
};
