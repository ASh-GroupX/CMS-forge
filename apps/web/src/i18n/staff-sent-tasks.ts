import type { Locale } from './staff-shell';

export const sentTasksText: Record<Locale, typeof enSentTasksText> = {
  en: {
    title: 'Sent Tasks',
    subtitle: 'Tasks you assigned or next-actioned to colleagues.',
    total: 'sent tasks',
    promise: 'Customer promise',
    fields: {
      assignee: 'Assignee',
      branch: 'Branch',
      comment: 'Comment',
      due: 'Due',
      links: 'Task links',
      nextAction: 'Next action',
      nextOwner: 'Next owner',
      owner: 'Created by',
      updated: 'Last update',
      message: 'Reminder message',
    },
    actions: { comment: 'Add comment', remind: 'Remind' },
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
      assignee: 'المكلف',
      branch: 'الفرع',
      comment: 'تعليق',
      due: 'الاستحقاق',
      links: 'روابط المهمة',
      nextAction: 'الإجراء التالي',
      nextOwner: 'مسؤول الإجراء التالي',
      owner: 'أنشأها',
      updated: 'آخر تحديث',
      message: 'رسالة التذكير',
    },
    actions: { comment: 'إضافة تعليق', remind: 'تذكير' },
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
  states: { empty: '', error: '', saved: '', saveFailed: '', noComments: '' },
};
