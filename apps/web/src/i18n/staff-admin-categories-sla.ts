import type { Locale } from './staff-shell';

export const adminCategoriesSlaText: Record<Locale, typeof enAdminCategoriesSlaText> = {
  en: {
    title: 'Categories, severities, and SLA policies',
    subtitle: 'Master data controls for complaint classification and SLA setup.',
    sections: { categories: 'Category tree', severities: 'Severity values', sla: 'SLA policies' },
    categoryHeaders: ['Category', 'Subcategory', 'Status', 'Actions'],
    severityHeaders: ['Severity', 'Default duration', 'Status', 'Actions'],
    slaHeaders: ['Stage', 'Severity', 'Warning', 'Deadline', 'Scope', 'Actions'],
    actions: { create: 'Create setting', edit: 'Edit', deactivate: 'Deactivate' },
    badges: { active: 'Active', inactive: 'Inactive', global: 'Global policy', branch: 'Branch policy' },
    states: {
      loading: 'Loading category and SLA settings.',
      empty: 'No category or SLA settings are configured yet.',
      error: 'Admin settings could not be loaded. Try again.',
      success: 'Admin setting saved.',
      validation: 'Review category hierarchy, severity value, and SLA duration fields.',
      conflict: 'Record changed by someone else. Reload before retrying.',
    },
    slaNote: 'SLA deadlines are calculated and enforced by the backend.',
  },
  ar: {
    title: 'الفئات والشدة وسياسات اتفاقية الخدمة',
    subtitle: 'إعدادات تصنيف الشكاوى وسياسات اتفاقية الخدمة.',
    sections: { categories: 'شجرة الفئات', severities: 'قيم الشدة', sla: 'سياسات اتفاقية الخدمة' },
    categoryHeaders: ['الفئة', 'الفئة الفرعية', 'الحالة', 'الإجراءات'],
    severityHeaders: ['الشدة', 'المدة الافتراضية', 'الحالة', 'الإجراءات'],
    slaHeaders: ['المرحلة', 'الشدة', 'التحذير', 'الموعد', 'النطاق', 'الإجراءات'],
    actions: { create: 'إنشاء إعداد', edit: 'تعديل', deactivate: 'تعطيل' },
    badges: { active: 'نشط', inactive: 'غير نشط', global: 'سياسة عامة', branch: 'سياسة فرع' },
    states: {
      loading: 'جار تحميل إعدادات الفئات واتفاقية الخدمة.',
      empty: 'لا توجد إعدادات فئات أو اتفاقية خدمة بعد.',
      error: 'تعذر تحميل إعدادات الإدارة. حاول مرة أخرى.',
      success: 'تم حفظ إعداد الإدارة.',
      validation: 'راجع حقول تسلسل الفئات وقيمة الشدة ومدة اتفاقية الخدمة.',
      conflict: 'تم تغيير السجل بواسطة مستخدم آخر. أعد التحميل قبل المحاولة.',
    },
    slaNote: 'يتم حساب مواعيد اتفاقية الخدمة وتنفيذها من الخادم.',
  },
};

const enAdminCategoriesSlaText = {
  title: '',
  subtitle: '',
  sections: { categories: '', severities: '', sla: '' },
  categoryHeaders: [''],
  severityHeaders: [''],
  slaHeaders: [''],
  actions: { create: '', edit: '', deactivate: '' },
  badges: { active: '', inactive: '', global: '', branch: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  slaNote: '',
};
