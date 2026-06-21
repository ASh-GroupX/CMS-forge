import type { Locale } from './staff-shell';

export const adminUsersText: Record<Locale, typeof enAdminUsersText> = {
  en: {
    title: 'Users, roles, and branch scope',
    subtitle: 'Create accounts and control staff access.',
    headers: ['User', 'Role', 'Branch scope', 'Status', 'Action'],
    badges: { active: 'Active', inactive: 'Inactive' },
    actions: {
      create: 'Create user',
      deactivate: 'Deactivate',
      reactivate: 'Reactivate',
    },
    fields: {
      email: 'Email',
      nameEn: 'English name',
      nameAr: 'Arabic name',
      role: 'Role',
      branch: 'Branch scope',
      initialPassword: 'Initial password',
    },
    allBranches: 'All branches',
    states: {
      loading: 'Loading users and roles.',
      empty: 'No users are configured yet.',
      error: 'User settings could not be loaded. Try again.',
      success: 'User setting saved.',
      validation: 'Review the user role, branch scope, and password fields.',
      conflict: 'Record changed by someone else. Reload before retrying.',
    },
    resetMessage: 'Accounts use the initial password until the user changes it through password reset.',
  },
  ar: {
    title: 'المستخدمون والأدوار ونطاق الفروع',
    subtitle: 'أنشئ حسابات الموظفين وتحكم في صلاحياتهم.',
    headers: ['المستخدم', 'الدور', 'نطاق الفرع', 'الحالة', 'الإجراء'],
    badges: { active: 'نشط', inactive: 'غير نشط' },
    actions: {
      create: 'إنشاء مستخدم',
      deactivate: 'إيقاف',
      reactivate: 'تفعيل',
    },
    fields: {
      email: 'البريد الإلكتروني',
      nameEn: 'الاسم بالإنجليزية',
      nameAr: 'الاسم بالعربية',
      role: 'الدور',
      branch: 'نطاق الفرع',
      initialPassword: 'كلمة المرور الأولية',
    },
    allBranches: 'كل الفروع',
    states: {
      loading: 'جاري تحميل المستخدمين والأدوار.',
      empty: 'لا يوجد مستخدمون بعد.',
      error: 'تعذر تحميل إعدادات المستخدمين. حاول مرة أخرى.',
      success: 'تم حفظ إعداد المستخدم.',
      validation: 'راجع الدور ونطاق الفرع وكلمة المرور.',
      conflict: 'تم تغيير السجل بواسطة مستخدم آخر. أعد التحميل قبل المحاولة.',
    },
    resetMessage: 'يستخدم الحساب كلمة المرور الأولية حتى يغيرها المستخدم عبر إعادة تعيين كلمة المرور.',
  },
};

const enAdminUsersText = {
  title: '',
  subtitle: '',
  headers: [''],
  badges: { active: '', inactive: '' },
  actions: { create: '', deactivate: '', reactivate: '' },
  fields: { email: '', nameEn: '', nameAr: '', role: '', branch: '', initialPassword: '' },
  allBranches: '',
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  resetMessage: '',
};
