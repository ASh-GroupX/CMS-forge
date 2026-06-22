import type { Locale } from './staff-shell';

export const sentTasksText: Record<Locale, typeof enSentTasksText> = {
  en: {
    title: 'Sent Tasks',
    subtitle: 'Tasks you assigned or next-actioned to colleagues.',
    total: 'sent tasks',
    promise: 'Customer promise',
    fields: {
      assignee: 'Who should do it?',
      branch: 'Branch',
      comment: 'Comment',
      due: 'Due',
      links: 'Task links',
      nextAction: 'Next action',
      nextOwner: 'Who follows up?',
      owner: 'Created by',
      updated: 'Last update',
      message: 'Reminder message',
    },
    actions: { comment: 'Add comment', remind: 'Remind' },
    recordTypes: {
      CUSTOMER: 'Customer',
      COMPLAINT: 'Complaint',
      CASE: 'Case',
      DEAL: 'Deal',
    },
    states: {
      empty: 'No sent tasks are waiting on colleagues.',
      error: 'Sent tasks could not be loaded. Sign in and try again.',
      saved: 'Task collaboration action saved.',
      saveFailed: 'Task collaboration action was not saved.',
      noComments: 'No task comments yet.',
    },
  },
  ar: {
    title: 'المهام المرسلة',
    subtitle: 'مهام أسندتها أو جعلت إجراءها التالي عند زملاء.',
    total: 'مهام مرسلة',
    promise: 'وعد للعميل',
    fields: {
      assignee: 'مين المسؤول؟',
      branch: 'الفرع',
      comment: 'تعليق',
      due: 'الاستحقاق',
      links: 'روابط المهمة',
      nextAction: 'الإجراء التالي',
      nextOwner: 'مين يتابع؟',
      owner: 'أنشأها',
      updated: 'آخر تحديث',
      message: 'رسالة التذكير',
    },
    actions: { comment: 'إضافة تعليق', remind: 'تذكير' },
    recordTypes: {
      CUSTOMER: 'عميل',
      COMPLAINT: 'شكوى',
      CASE: 'حالة',
      DEAL: 'صفقة',
    },
    states: {
      empty: 'لا توجد مهام مرسلة تنتظر زملاء.',
      error: 'تعذر تحميل المهام المرسلة. سجل الدخول وحاول مرة أخرى.',
      saved: 'تم حفظ إجراء التعاون على المهمة.',
      saveFailed: 'لم يتم حفظ إجراء التعاون على المهمة.',
      noComments: 'لا توجد تعليقات على المهمة بعد.',
    },
  },
};

const enSentTasksText = {
  title: '',
  subtitle: '',
  total: '',
  promise: '',
  fields: { assignee: '', branch: '', comment: '', due: '', links: '', nextAction: '', nextOwner: '', owner: '', updated: '', message: '' },
  actions: { comment: '', remind: '' },
  recordTypes: { CUSTOMER: '', COMPLAINT: '', CASE: '', DEAL: '' },
  states: { empty: '', error: '', saved: '', saveFailed: '', noComments: '' },
};
