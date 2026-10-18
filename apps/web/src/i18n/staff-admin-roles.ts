import type { Locale } from './staff-shell';

const en = {
  title: 'Roles and permissions', subtitle: 'Create selectable staff roles. Permissions are enforced by the server session.',
  create: 'Create role', code: 'Role code', nameEn: 'English name', nameAr: 'Arabic name', permissions: 'Permissions', selectHelp: 'Select all permissions this role needs. Staff login is required.',
  editPermissions: 'Edit permissions', savePermissions: 'Save permissions', systemLocked: 'Portal role permissions are managed by the system.',
  copyPermissions: 'Copy permissions from another role', selectRole: 'Choose a role', permissionGroups: { complaints: 'Complaint access', operations: 'Operational actions', administration: 'Administration', reporting: 'Reports and audit' },
  roleList: 'Configured roles', system: 'System role', custom: 'Custom role', noRoles: 'No roles are configured.',
  reviewTitle: 'Review permission impact', reviewDescription: 'Confirm the exact permission changes before applying them.', added: 'Added', removed: 'Removed', affectedUsers: 'Active users affected', noChanges: 'No permission changes.', cancel: 'Cancel', confirm: 'Apply changes',
  states: { success: 'Role saved.', validation: 'Review the role details and permission selection.', conflict: 'This role changed or the update would remove required administrator access. Reload and review it.', error: 'The role could not be saved. Try again.' },
};
const ar: typeof en = {
  title: 'الأدوار والصلاحيات', subtitle: 'إعداد وتخصيص أدوار الموظفين ومصفوفة الصلاحيات المعتمدة في النظام.',
  create: 'إضافة دور جديد', code: 'رمز الدور', nameEn: 'الاسم بالإنجليزية', nameAr: 'الاسم بالعربية', permissions: 'الصلاحيات', selectHelp: 'حدد جميع الصلاحيات المطلوبة لهذا الدور. يلزم توفر صلاحية تسجيل دخول الموظفين.',
  editPermissions: 'تعديل الصلاحيات', savePermissions: 'حفظ الصلاحيات', systemLocked: 'صلاحيات أدوار بوابة العملاء محددة تلقائياً من قبل النظام.',
  copyPermissions: 'نسخ الصلاحيات من دور آخر', selectRole: 'اختر دوراً', permissionGroups: { complaints: 'الوصول إلى الشكاوى', operations: 'الإجراءات التشغيلية', administration: 'الإدارة', reporting: 'التقارير والتدقيق' },
  roleList: 'الأدوار المعرفة', system: 'دور نظامي (أساسي)', custom: 'دور مخصص', noRoles: 'لا توجد أدوار معرفة حالياً.',
  reviewTitle: 'مراجعة تأثير تغيير الصلاحيات', reviewDescription: 'يُرجى التحقق من تفاصيل التعديلات على الصلاحيات قبل اعتماد تطبيقها.', added: 'مضافة', removed: 'محذوفة', affectedUsers: 'المستخدمون النشطون المتأثرون', noChanges: 'لم يتم إجراء أي تغيير في الصلاحيات.', cancel: 'إلغاء', confirm: 'تطبيق التغييرات',
  states: { success: 'تم حفظ بيانات الدور والصلاحيات بنجاح.', validation: 'يُرجى مراجعة بيانات الدور وقائمة الصلاحيات المحددة.', conflict: 'تم تعديل هذا الدور أو أن التحديث سيؤدي إلى إزالة صلاحيات إدارية أساسية. يُرجى إعادة تحميل الصفحة والمراجعة.', error: 'تعذر حفظ الدور. يُرجى المحاولة مرة أخرى.' },
};
export const adminRolesText: Record<Locale, typeof en> = { en, ar };
