import type { Locale } from './staff-shell';

export const reportsDashboardText: Record<Locale, typeof enReportsDashboardText> = {
  en: {
    title: 'Reports dashboard',
    subtitle: 'MVP report entries pending Phase 7 report APIs.',
    headers: ['Report', 'Audience', 'Category', 'Status'],
    export: {
      title: 'Report export',
      csv: 'CSV',
      excel: 'Excel',
      rowLimit: 'Exports use backend configured row limits.',
      scoped: 'Export data is RBAC-filtered with the same report scope.',
      audit: 'Successful exports are audit logged by the backend.',
    },
    badges: { operations: 'Operations', sla: 'SLA', executive: 'Executive', admin: 'Admin', pending: 'API pending' },
    states: {
      ready: 'Export controls are ready.',
      loading: 'Loading report entries.',
      empty: 'No report entries are configured yet.',
      error: 'Reports dashboard could not be loaded. Try again.',
      success: 'Report entry selected.',
      validation: 'Report filters are pending backend validation.',
      denied: 'Export is unavailable for this report or role.',
      conflict: 'Report catalog changed. Reload before continuing.',
    },
    safeNote: 'Report data, metrics, filters, and exports remain backend-scoped.',
  },
  ar: {
    title: 'لوحة التقارير',
    subtitle: 'مدخلات تقارير الحد الأدنى بانتظار واجهات تقارير المرحلة 7.',
    headers: ['التقرير', 'المستخدمون', 'الفئة', 'الحالة'],
    export: {
      title: 'تصدير التقرير',
      csv: 'CSV',
      excel: 'Excel',
      rowLimit: 'تستخدم عمليات التصدير حدود الصفوف المحددة في الخادم.',
      scoped: 'تتم فلترة بيانات التصدير حسب نفس نطاق التقرير والصلاحيات.',
      audit: 'يسجل الخادم عمليات التصدير الناجحة في التدقيق.',
    },
    badges: { operations: 'تشغيلي', sla: 'اتفاقية الخدمة', executive: 'تنفيذي', admin: 'إداري', pending: 'واجهة معلقة' },
    states: {
      ready: 'عناصر التصدير جاهزة.',
      loading: 'جار تحميل مدخلات التقارير.',
      empty: 'لا توجد مدخلات تقارير بعد.',
      error: 'تعذر تحميل لوحة التقارير. حاول مرة أخرى.',
      success: 'تم اختيار مدخل التقرير.',
      validation: 'فلاتر التقارير بانتظار تحقق الخادم.',
      denied: 'التصدير غير متاح لهذا التقرير أو الدور.',
      conflict: 'تغير فهرس التقارير. أعد التحميل قبل المتابعة.',
    },
    safeNote: 'تبقى بيانات التقارير والمقاييس والفلاتر والتصدير مقيدة من الخادم.',
  },
};

const enReportsDashboardText = {
  title: '',
  subtitle: '',
  headers: [''],
  export: { title: '', csv: '', excel: '', rowLimit: '', scoped: '', audit: '' },
  badges: { operations: '', sla: '', executive: '', admin: '', pending: '' },
  states: { ready: '', loading: '', empty: '', error: '', success: '', validation: '', denied: '', conflict: '' },
  safeNote: '',
};
