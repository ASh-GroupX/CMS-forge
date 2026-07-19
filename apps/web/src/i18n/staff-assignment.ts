import type { Locale } from './staff-shell';

const en = {
  user: 'Assigned user',
  department: 'Assigned department',
  userPlaceholder: 'No specific user',
  departmentPlaceholder: 'No department',
  help: 'Choose a user, a department, or both. At least one assignment target is required.',
  loading: 'Loading assignment options.',
  empty: 'No assignment options are available in your scope.',
  error: 'Assignment options could not be loaded. Try again.',
};

export const staffAssignmentText: Record<Locale, typeof en> = {
  en,
  ar: {
    user: 'المستخدم المسند إليه',
    department: 'القسم المسند إليه',
    userPlaceholder: 'دون مستخدم محدد',
    departmentPlaceholder: 'دون قسم',
    help: 'اختر مستخدماً أو قسماً أو كليهما. يجب تحديد جهة إسناد واحدة على الأقل.',
    loading: 'جارٍ تحميل خيارات الإسناد.',
    empty: 'لا توجد خيارات إسناد متاحة ضمن نطاق صلاحياتك.',
    error: 'تعذر تحميل خيارات الإسناد. حاول مرة أخرى.',
  },
};
