import type { Locale } from './staff-shell';

export const adminBranchesText: Record<Locale, typeof enAdminBranchesText> = {
  en: {
    title: 'Branches and departments',
    subtitle: 'Admin configuration preview.',
    sections: { branches: 'Branches', departments: 'Departments' },
    headers: ['Code', 'Name', 'Status', 'Action'],
    badges: { active: 'Active', inactive: 'Inactive' },
    actions: { create: 'Create', edit: 'Edit', deactivate: 'Deactivate' },
    states: {
      loading: 'Loading branches and departments.',
      empty: 'No branches or departments are configured yet.',
      error: 'Admin configuration could not be loaded. Try again.',
      success: 'Configuration change saved.',
      validation: 'Review the highlighted fields.',
      conflict: 'Record changed by someone else. Reload before retrying.',
    },
  },
  ar: {
    title: 'الفروع والأقسام',
    subtitle: 'معاينة إعدادات المشرف.',
    sections: { branches: 'الفروع', departments: 'الأقسام' },
    headers: ['الرمز', 'الاسم', 'الحالة', 'الإجراء'],
    badges: { active: 'نشط', inactive: 'غير نشط' },
    actions: { create: 'إنشاء', edit: 'تعديل', deactivate: 'إيقاف' },
    states: {
      loading: 'جاري تحميل الفروع والأقسام.',
      empty: 'لا توجد فروع أو أقسام مهيأة بعد.',
      error: 'تعذر تحميل إعدادات المشرف. حاول مرة أخرى.',
      success: 'تم حفظ تغيير الإعدادات.',
      validation: 'راجع الحقول المحددة.',
      conflict: 'تغير السجل بواسطة شخص آخر. حمل قبل المحاولة.',
    },
  },
};

const enAdminBranchesText = {
  title: '',
  subtitle: '',
  sections: { branches: '', departments: '' },
  headers: [''],
  badges: { active: '', inactive: '' },
  actions: { create: '', edit: '', deactivate: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
};
