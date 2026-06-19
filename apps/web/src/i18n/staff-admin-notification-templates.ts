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
    subtitle: 'إدارة قوالب ثنائية اللغة لأحداث دورة حياة الشكوى.',
    headers: ['الحدث', 'القنوات', 'اللغات', 'الحالة', 'الإجراءات'],
    previewTitle: 'معاينة القالب',
    placeholdersTitle: 'رموز الحقول',
    placeholders: ['{{referenceNumber}}', '{{status}}', '{{slaDeadline}}', '{{surveyLink}}'],
    actions: { edit: 'تعديل', activate: 'تفعيل', deactivate: 'تعطيل' },
    badges: { active: 'نشط', inactive: 'غير نشط' },
    states: {
      loading: 'جار تحميل قوالب الإشعارات.',
      empty: 'لا توجد قوالب إشعارات بعد.',
      error: 'تعذر تحميل قوالب الإشعارات. حاول مرة أخرى.',
      success: 'تم حفظ قالب الإشعار.',
      validation: 'راجع المحتوى ثنائي اللغة والقناة ومحفز الحدث ورموز الحقول.',
      conflict: 'تم تغيير القالب بواسطة مستخدم آخر. أعد التحميل قبل المحاولة.',
    },
    preview: {
      event: 'إنشاء شكوى',
      channel: 'البريد الإلكتروني وداخل النظام',
      english: 'يستخدم المحتوى الإنجليزي رموز الحقول المعتمدة.',
      arabic: 'يستخدم المحتوى العربي رموز الحقول المعتمدة نفسها.',
      note: 'تتحقق خدمة القوالب في الخادم من رموز الحقول وقواعد التسليم.',
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
