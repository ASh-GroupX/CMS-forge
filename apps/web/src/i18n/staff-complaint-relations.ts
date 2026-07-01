import type { Locale } from './staff-shell';

export const complaintRelationsText: Record<Locale, typeof enComplaintRelationsText> = {
  en: {
    title: 'Related complaints',
    candidates: 'Likely duplicates',
    related: 'Linked complaints',
    window: 'Recent {days}-day match by customer, category, and branch.',
    link: 'Link as related',
    unlink: 'Unlink',
    unlinkConfirm: 'Unlink {reference} from this complaint?',
    fields: { branch: 'Branch', created: 'Created', customer: 'Customer', updated: 'Updated' },
    states: {
      loading: 'Loading related complaint checks.',
      empty: 'No likely duplicates or linked complaints are visible.',
      error: 'Related complaint checks could not be loaded.',
      denied: 'Related complaint checks are not available for your current scope.',
      success: 'Related complaints updated.',
    },
  },
  ar: {
    title: 'الشكاوى المرتبطة',
    candidates: 'تكرارات محتملة',
    related: 'شكاوى مرتبطة',
    window: 'مطابقة حديثة خلال {days} يوما حسب العميل والتصنيف والفرع.',
    link: 'ربط كشكوى مرتبطة',
    unlink: 'إلغاء الربط',
    unlinkConfirm: 'إلغاء ربط {reference} من هذه الشكوى؟',
    fields: { branch: 'الفرع', created: 'تاريخ الإنشاء', customer: 'العميل', updated: 'آخر تحديث' },
    states: {
      loading: 'جار تحميل فحص الشكاوى المرتبطة.',
      empty: 'لا توجد تكرارات محتملة أو شكاوى مرتبطة ضمن صلاحيتك.',
      error: 'تعذر تحميل فحص الشكاوى المرتبطة.',
      denied: 'فحص الشكاوى المرتبطة غير متاح ضمن صلاحيتك الحالية.',
      success: 'تم تحديث الشكاوى المرتبطة.',
    },
  },
};

const enComplaintRelationsText = {
  title: '',
  candidates: '',
  related: '',
  window: '',
  link: '',
  unlink: '',
  unlinkConfirm: '',
  fields: { branch: '', created: '', customer: '', updated: '' },
  states: { loading: '', empty: '', error: '', denied: '', success: '' },
};
