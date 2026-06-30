import type { Locale } from './staff-shell';

export const complaintRelationsText: Record<Locale, typeof enComplaintRelationsText> = {
  en: {
    title: 'Related complaints',
    candidates: 'Likely duplicates',
    related: 'Linked complaints',
    window: 'Recent {days}-day match by customer, category, and branch.',
    link: 'Link as related',
    fields: { branch: 'Branch', created: 'Created', updated: 'Updated' },
    states: {
      loading: 'Loading related complaint checks.',
      empty: 'No likely duplicates or linked complaints are visible.',
      error: 'Related complaint checks could not be loaded.',
      denied: 'Related complaint checks are not available for your current scope.',
      success: 'Complaint linked as related.',
    },
  },
  ar: {
    title: 'الشكاوى المرتبطة',
    candidates: 'تكرارات محتملة',
    related: 'شكاوى مرتبطة',
    window: 'مطابقة حديثة خلال {days} يوما حسب العميل والتصنيف والفرع.',
    link: 'ربط كشكاوى مرتبطة',
    fields: { branch: 'الفرع', created: 'تاريخ الإنشاء', updated: 'آخر تحديث' },
    states: {
      loading: 'جار تحميل فحص الشكاوى المرتبطة.',
      empty: 'لا توجد تكرارات محتملة أو شكاوى مرتبطة ضمن صلاحيتك.',
      error: 'تعذر تحميل فحص الشكاوى المرتبطة.',
      denied: 'فحص الشكاوى المرتبطة غير متاح ضمن صلاحيتك الحالية.',
      success: 'تم ربط الشكوى كشكاوى مرتبطة.',
    },
  },
};

const enComplaintRelationsText = {
  title: '',
  candidates: '',
  related: '',
  window: '',
  link: '',
  fields: { branch: '', created: '', updated: '' },
  states: { loading: '', empty: '', error: '', denied: '', success: '' },
};
