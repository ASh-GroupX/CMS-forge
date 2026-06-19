import type { Locale } from './staff-shell';

export const adminUsersText: Record<Locale, typeof enAdminUsersText> = {
  en: {
    title: 'Users, roles, and branch scope',
    subtitle: 'Admin access preview.',
    headers: ['User', 'Role', 'Branch scope', 'Status', 'Action'],
    badges: { active: 'Active', inactive: 'Inactive' },
    actions: { create: 'Create user', edit: 'Edit', deactivate: 'Deactivate', reset: 'Send reset' },
    states: {
      loading: 'Loading users and roles.',
      empty: 'No users are configured yet.',
      error: 'User settings could not be loaded. Try again.',
      success: 'User setting saved.',
      validation: 'Review the user role and branch scope fields.',
      conflict: 'Record changed by someone else. Reload before retrying.',
    },
    resetMessage: 'If the account can reset a password, instructions will be sent.',
  },
  ar: {
    title: 'المستخدمون والأدوار ونطاق الفروع',
    subtitle: 'معاينة صلاحيات المشرف.',
    headers: ['المستخدم', 'الدور', 'نطاق الفرع', 'الحالة', 'الإجراء'],
    badges: { active: 'نشط', inactive: 'غير نشط' },
    actions: { create: 'إنشاء مستخدم', edit: 'تعديل', deactivate: 'إيقاف', reset: 'إرسال إعادة' },
    states: {
      loading: 'جار تحميل المستخدمين والأدوار.',
      empty: 'لا يوجد مستخدمون بعد.',
      error: 'تعذر تحميل إعدادات المستخدمين. حاول مرة أخرى.',
      success: 'تم حفظ إعداد المستخدم.',
      validation: 'راجع حقول دور المستخدم ونطاق الفرع.',
      conflict: 'تم تغيير السجل بواسطة مستخدم آخر. أعد التحميل قبل المحاولة.',
    },
    resetMessage: 'إذا كان الحساب مؤهلا لإعادة تعيين كلمة المرور فسيتم إرسال التعليمات.',
  },
};

const enAdminUsersText = {
  title: '',
  subtitle: '',
  headers: [''],
  badges: { active: '', inactive: '' },
  actions: { create: '', edit: '', deactivate: '', reset: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  resetMessage: '',
};
