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
    subtitle: 'إدارة الهيكل التنظيمي للفروع والأقسام وتفعيلها.',
    sections: { branches: 'الفروع', departments: 'الأقسام' },
    headers: ['الرمز', 'الاسم', 'الحالة', 'الإجراء'],
    badges: { active: 'نشط', inactive: 'غير نشط' },
    actions: { create: 'إضافة', edit: 'تعديل', deactivate: 'تعطيل' },
    states: {
      loading: 'جارٍ تحميل الفروع والأقسام...',
      empty: 'لا توجد فروع أو أقسام مدخلة حالياً.',
      error: 'تعذر تحميل بيانات الفروع والأقسام. يُرجى المحاولة مرة أخرى.',
      success: 'تم حفظ التعديلات بنجاح.',
      validation: 'يُرجى مراجعة الحقول المطلوبة والتأكد من صحتها.',
      conflict: 'تم تعديل السجل بواسطة مستخدم آخر. يُرجى إعادة تحميل الصفحة والمحاولة مجدداً.',
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
