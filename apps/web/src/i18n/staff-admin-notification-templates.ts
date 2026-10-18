import type { Locale } from './staff-shell';

export const adminNotificationTemplatesText: Record<Locale, typeof enAdminNotificationTemplatesText> = {
  en: {
    title: 'Notification templates',
    subtitle: 'Bilingual template management for complaint lifecycle events.',
    headers: ['Event', 'Channels', 'Languages', 'Status', 'Actions'],
    previewTitle: 'Template preview',
    placeholdersTitle: 'Placeholder tokens',
    placeholders: ['{{referenceNumber}}', '{{status}}', '{{slaDeadline}}', '{{surveyLink}}'],
    actions: { edit: 'Edit', activate: 'Activate', deactivate: 'Deactivate' },
    badges: { active: 'Active', inactive: 'Inactive' },
    states: {
      loading: 'Loading notification templates.',
      empty: 'No notification templates are configured yet.',
      error: 'Notification templates could not be loaded. Try again.',
      success: 'Notification template saved.',
      validation: 'Review bilingual content, channel, event trigger, and placeholders.',
      conflict: 'Template changed by someone else. Reload before retrying.',
    },
    preview: {
      event: 'Complaint created',
      channel: 'Email and in-app',
      english: 'English content uses approved placeholder tokens.',
      arabic: 'Arabic content uses the same approved placeholder tokens.',
      note: 'The backend template service validates placeholders and delivery rules.',
    },
  },
  ar: {
    title: 'قوالب الإشعارات',
    subtitle: 'إدارة قوالب الرسائل التلقائية ثنائية اللغة لأحداث ومراحل الشكاوى.',
    headers: ['الحدث', 'القنوات', 'اللغات', 'الحالة', 'الإجراءات'],
    previewTitle: 'معاينة القالب',
    placeholdersTitle: 'المتغيرات المتاحة (رموز الحقول)',
    placeholders: ['{{referenceNumber}}', '{{status}}', '{{slaDeadline}}', '{{surveyLink}}'],
    actions: { edit: 'تعديل', activate: 'تفعيل', deactivate: 'تعطيل' },
    badges: { active: 'نشط', inactive: 'غير نشط' },
    states: {
      loading: 'جارٍ تحميل قوالب الإشعارات...',
      empty: 'لا توجد قوالب إشعارات مدخلة حالياً.',
      error: 'تعذر تحميل قوالب الإشعارات. يُرجى المحاولة مرة أخرى.',
      success: 'تم حفظ قالب الإشعار بنجاح.',
      validation: 'يُرجى مراجعة محتوى القالب باللغتين وقنوات الإرسال ورموز الحقول المستخدمة.',
      conflict: 'تم تعديل القالب بواسطة مستخدم آخر. يُرجى إعادة تحميل الصفحة والمحاولة مجدداً.',
    },
    preview: {
      event: 'تسجيل شكوى جديدة',
      channel: 'البريد الإلكتروني والإشعارات الفورية',
      english: 'يستخدم المحتوى الإنجليزي رموز الحقول المعتمدة.',
      arabic: 'يستخدم المحتوى العربي رموز الحقول المعتمدة نفسها.',
      note: 'يتحقق النظام آلياً من صحة رموز الحقول المستخدمة وقواعد الإرسال.',
    },
  },
};

const enAdminNotificationTemplatesText = {
  title: '',
  subtitle: '',
  headers: [''],
  previewTitle: '',
  placeholdersTitle: '',
  placeholders: [''],
  actions: { edit: '', activate: '', deactivate: '' },
  badges: { active: '', inactive: '' },
  states: { loading: '', empty: '', error: '', success: '', validation: '', conflict: '' },
  preview: { event: '', channel: '', english: '', arabic: '', note: '' },
};
