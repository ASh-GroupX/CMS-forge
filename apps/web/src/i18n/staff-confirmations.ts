import type { Locale } from './staff-shell';

export const confirmationText: Record<Locale, typeof enConfirmationText> = {
  en: {
    deactivate: {
      title: 'Confirm deactivate',
      body: 'Review this change before disabling the selected record.',
      confirm: 'Confirm deactivate',
      cancel: 'Cancel',
    },
    attachmentReject: {
      title: 'Confirm attachment rejection',
      body: 'Review the scan result before rejecting the attachment.',
      confirm: 'Confirm reject attachment',
      cancel: 'Cancel',
    },
    workflowCloseReject: {
      title: 'Confirm close or reject',
      body: 'Close and reject actions require a final confirmation after the required comment.',
      confirmClose: 'Confirm close',
      confirmReject: 'Confirm reject',
      cancel: 'Cancel',
    },
  },
  ar: {
    deactivate: {
      title: 'تأكيد التعطيل',
      body: 'راجع هذا التغيير قبل تعطيل السجل المحدد.',
      confirm: 'تأكيد التعطيل',
      cancel: 'إلغاء',
    },
    attachmentReject: {
      title: 'تأكيد رفض المرفق',
      body: 'راجع نتيجة الفحص قبل رفض المرفق.',
      confirm: 'تأكيد رفض المرفق',
      cancel: 'إلغاء',
    },
    workflowCloseReject: {
      title: 'تأكيد الإغلاق أو الرفض',
      body: 'تتطلب إجراءات الإغلاق والرفض تأكيداً نهائياً بعد التعليق المطلوب.',
      confirmClose: 'تأكيد الإغلاق',
      confirmReject: 'تأكيد الرفض',
      cancel: 'إلغاء',
    },
  },
} as const;

const enConfirmationText = {
  deactivate: { title: '', body: '', confirm: '', cancel: '' },
  attachmentReject: { title: '', body: '', confirm: '', cancel: '' },
  workflowCloseReject: { title: '', body: '', confirmClose: '', confirmReject: '', cancel: '' },
};
