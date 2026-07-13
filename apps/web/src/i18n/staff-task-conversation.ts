import type { Locale } from './staff-shell';

const en = { title: 'Task conversation', task: 'Task', responsible: 'Responsible employee', due: 'Deadline', next: 'Next action', comments: 'Updates', empty: 'No updates yet.', body: 'Write an update', mention: 'Mention a person or group', cc: 'Add in CC', search: 'Search people or groups', addMention: 'Mention', addCc: 'Add CC', audience: 'Audience', confirm: 'I confirm this audience', no: 'No', remove: 'Remove', notSet: 'Not set', save: 'Save update', loading: 'Saving update.', success: 'Update saved.', error: 'The update could not be saved.', validation: 'Write an update before saving.', unavailable: 'This task could not be opened.' };
export const taskConversationText: Record<Locale, typeof en> = {
  en,
  ar: { title: 'محادثة المهمة', task: 'المهمة', responsible: 'المسؤول عن التنفيذ', due: 'الموعد النهائي', next: 'الإجراء التالي', comments: 'التحديثات', empty: 'لا توجد تحديثات بعد.', body: 'اكتب تحديثاً', mention: 'ذكر شخص أو فريق', cc: 'إضافة في نسخة', search: 'ابحث عن شخص أو فريق', addMention: 'ذكر', addCc: 'إضافة في نسخة', audience: 'المستلمون', confirm: 'أؤكد إرسال التحديث إلى هذا العدد', no: 'لا', remove: 'إزالة', notSet: 'غير محدد', save: 'حفظ التحديث', loading: 'جاري حفظ التحديث.', success: 'تم حفظ التحديث.', error: 'تعذر حفظ التحديث.', validation: 'اكتب تحديثاً قبل الحفظ.', unavailable: 'تعذر فتح المهمة.' },
};
