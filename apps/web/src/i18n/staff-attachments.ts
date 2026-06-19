import type { Locale } from './staff-shell';

export const attachmentText: Record<Locale, typeof enAttachmentText> = {
  en: {
    title: 'Attachments',
    subtitle: 'Attach supporting files after checking the file rules.',
    chooseFile: 'Choose file',
    selectedFile: 'Selected file placeholder',
    fileRules: ['PDF, PNG, or JPG only', 'Maximum size follows the backend policy', 'Do not upload credentials or secrets'],
    states: {
      loading: 'Preparing attachment panel.',
      empty: 'No attachment selected yet.',
      error: 'Attachment panel could not be prepared.',
    },
    scan: {
      pending: 'Scan pending',
      clean: 'Scan clean',
      rejected: 'Scan rejected',
    },
  },
  ar: {
    title: 'المرفقات',
    subtitle: 'أرفق الملفات الداعمة بعد مراجعة قواعد الملفات.',
    chooseFile: 'اختيار ملف',
    selectedFile: 'عنصر ملف تجريبي',
    fileRules: ['PDF أو PNG أو JPG فقط', 'الحد الأقصى للحجم يتبع سياسة الخادم', 'لا ترفع بيانات اعتماد أو أسرارا'],
    states: {
      loading: 'جاري تجهيز لوحة المرفقات.',
      empty: 'لم يتم اختيار مرفق بعد.',
      error: 'تعذر تجهيز لوحة المرفقات.',
    },
    scan: {
      pending: 'الفحص قيد الانتظار',
      clean: 'الفحص سليم',
      rejected: 'تم رفض الفحص',
    },
  },
};

const enAttachmentText = {
  title: '',
  subtitle: '',
  chooseFile: '',
  selectedFile: '',
  fileRules: [''],
  states: { loading: '', empty: '', error: '' },
  scan: { pending: '', clean: '', rejected: '' },
};
