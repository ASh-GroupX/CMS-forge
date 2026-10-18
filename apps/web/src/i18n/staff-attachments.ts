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
    subtitle: 'إرفاق المستندات الداعمة وفق الشروط والأحجام المسموح بها.',
    chooseFile: 'اختيار ملف',
    selectedFile: 'الملف المختار',
    fileRules: ['صيغ الملفات المسموحة: PDF أو PNG أو JPG فقط', 'الحد الأقصى للحجم يخضع للسياسة الأمنية المعتمدة', 'يُمنع رفع كلمات المرور أو البيانات الحساسة'],
    states: {
      loading: 'جارٍ تجهيز لوحة المرفقات...',
      empty: 'لم يتم اختيار مرفق بعد.',
      error: 'تعذر تجهيز لوحة المرفقات.',
    },
    scan: {
      pending: 'جارٍ الفحص الأمني',
      clean: 'تم الفحص (آمن)',
      rejected: 'مرفوض أمنياً',
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
