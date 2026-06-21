import type { Locale } from './staff-shell';

export const confidentialCaseText: Record<Locale, typeof enConfidentialCaseText> = {
  en: {
    title: 'Confidential case timeline',
    subtitle: 'Actor-scoped employee grievance record.',
    privacyBadge: 'Restricted',
    sections: { summary: 'Case summary', notes: 'Restricted notes', events: 'Timeline events' },
    labels: {
      caseId: 'Case ID',
      type: 'Type',
      status: 'Lifecycle status',
      branch: 'Branch',
      owner: 'Owner',
      updated: 'Updated',
      author: 'Author',
      event: 'Event',
      occurred: 'Occurred',
    },
    states: {
      loading: 'Loading confidential case timeline.',
      empty: 'No restricted notes are available for this actor.',
      error: 'Confidential case timeline could not be loaded. Sign in with an allowed participant account.',
    },
  },
  ar: {
    title: 'الخط الزمني للحالة السرية',
    subtitle: 'سجل تظلم موظف مقيّد حسب المشارك.',
    privacyBadge: 'مقيّد',
    sections: { summary: 'ملخص الحالة', notes: 'ملاحظات مقيّدة', events: 'أحداث الخط الزمني' },
    labels: {
      caseId: 'معرف الحالة',
      type: 'النوع',
      status: 'حالة المسار',
      branch: 'الفرع',
      owner: 'المالك',
      updated: 'آخر تحديث',
      author: 'الكاتب',
      event: 'الحدث',
      occurred: 'وقت الحدث',
    },
    states: {
      loading: 'جار تحميل الخط الزمني للحالة السرية.',
      empty: 'لا توجد ملاحظات مقيّدة متاحة لهذا المشارك.',
      error: 'تعذر تحميل الخط الزمني للحالة السرية. سجل الدخول بحساب مشارك مسموح.',
    },
  },
};

const enConfidentialCaseText = {
  title: '',
  subtitle: '',
  privacyBadge: '',
  sections: { summary: '', notes: '', events: '' },
  labels: { caseId: '', type: '', status: '', branch: '', owner: '', updated: '', author: '', event: '', occurred: '' },
  states: { loading: '', empty: '', error: '' },
};
