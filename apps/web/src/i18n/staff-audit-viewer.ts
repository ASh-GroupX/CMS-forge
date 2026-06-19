import type { Locale } from './staff-shell';

export const auditViewerText: Record<Locale, typeof enAuditViewerText> = {
  en: {
    title: 'Audit viewer',
    subtitle: 'Search and export audit entries within configured backend limits.',
    filters: {
      actor: 'Actor',
      action: 'Action',
      target: 'Target',
      date: 'Date',
      correlationId: 'Correlation ID',
      apply: 'Apply filters',
      export: 'Export results',
    },
    headers: ['Timestamp', 'Actor', 'Action', 'Target', 'Correlation ID'],
    badges: { security: 'Security', workflow: 'Workflow', config: 'Configuration' },
    states: {
      loading: 'Loading audit entries.',
      empty: 'No audit entries match these filters.',
      error: 'Audit entries could not be loaded. Try again.',
      success: 'Audit export request prepared.',
      validation: 'Review filter values and date range.',
      conflict: 'Audit query changed. Reload before exporting.',
    },
    safeNote: 'Displayed rows are placeholders. Backend search owns redaction, limits, and authorization.',
  },
  ar: {
    title: 'عارض سجل التدقيق',
    subtitle: 'بحث وتصدير سجلات التدقيق ضمن حدود الخادم.',
    filters: {
      actor: 'الفاعل',
      action: 'الإجراء',
      target: 'الهدف',
      date: 'التاريخ',
      correlationId: 'معرف الترابط',
      apply: 'تطبيق الفلاتر',
      export: 'تصدير النتائج',
    },
    headers: ['الوقت', 'الفاعل', 'الإجراء', 'الهدف', 'معرف الترابط'],
    badges: { security: 'أمن', workflow: 'سير العمل', config: 'إعدادات' },
    states: {
      loading: 'جار تحميل سجلات التدقيق.',
      empty: 'لا توجد سجلات تدقيق تطابق هذه الفلاتر.',
      error: 'تعذر تحميل سجلات التدقيق. حاول مرة أخرى.',
      success: 'تم تجهيز طلب تصدير التدقيق.',
      validation: 'راجع قيم الفلاتر ونطاق التاريخ.',
      conflict: 'تغير استعلام التدقيق. أعد التحميل قبل التصدير.',
    },
    safeNote: 'الصفوف المعروضة أمثلة فقط. بحث الخادم يملك التنقيح والحدود والصلاحيات.',
  },
};

const enAuditViewerText = {
  title: '',
  subtitle: '',
  filters: { actor: '', action: '', target: '', date: '', correlationId: '', apply: '', export: '' },
  headers: [''],
  badges: { security: '', workflow: '', config: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  safeNote: '',
};
