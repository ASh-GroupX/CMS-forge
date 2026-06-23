import type { Locale } from './staff-shell';

const en = {
  title: 'Roles and permissions', subtitle: 'Create selectable staff roles. Permissions are enforced by the server session.',
  create: 'Create role', code: 'Role code', nameEn: 'English name', nameAr: 'Arabic name', permissions: 'Permissions', selectHelp: 'Select all permissions this role needs. Staff login is required.',
  editPermissions: 'Edit permissions', savePermissions: 'Save permissions', systemLocked: 'Portal role permissions are managed by the system.',
  copyPermissions: 'Copy permissions from another role', selectRole: 'Choose a role', permissionGroups: { complaints: 'Complaint access', operations: 'Operational actions', administration: 'Administration', reporting: 'Reports and audit' },
  roleList: 'Configured roles', system: 'System role', custom: 'Custom role', noRoles: 'No roles are configured.',
  states: { success: 'Role created.', validation: 'Review the role details and permission selection.', error: 'The role could not be saved. Try again.' },
};
const ar: typeof en = {
  title: 'الأدوار والصلاحيات', subtitle: 'أنشئ أدوار الموظفين القابلة للتعيين. يفرض الخادم الصلاحيات من جلسة المستخدم.',
  create: 'إنشاء دور', code: 'رمز الدور', nameEn: 'الاسم بالإنجليزية', nameAr: 'الاسم بالعربية', permissions: 'الصلاحيات', selectHelp: 'اختر كل الصلاحيات التي يحتاجها الدور. صلاحية دخول الموظف مطلوبة.',
  editPermissions: 'تعديل الصلاحيات', savePermissions: 'حفظ الصلاحيات', systemLocked: 'صلاحيات دور البوابة يديرها النظام.',
  copyPermissions: 'نسخ الصلاحيات من دور آخر', selectRole: 'اختر دوراً', permissionGroups: { complaints: 'الوصول إلى الشكاوى', operations: 'الإجراءات التشغيلية', administration: 'الإدارة', reporting: 'التقارير والتدقيق' },
  roleList: 'الأدوار المهيأة', system: 'دور نظام', custom: 'دور مخصص', noRoles: 'لا توجد أدوار مهيأة.',
  states: { success: 'تم إنشاء الدور.', validation: 'راجع تفاصيل الدور واختيار الصلاحيات.', error: 'تعذر حفظ الدور. حاول مرة أخرى.' },
};
export const adminRolesText: Record<Locale, typeof en> = { en, ar };
