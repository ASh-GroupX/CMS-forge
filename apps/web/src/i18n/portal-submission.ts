export type PortalLocale = 'en' | 'ar';

export const portalSubmissionText = {
  en: {
    lang: 'en',
    dir: 'ltr',
    title: 'Customer complaint portal',
    subtitle: 'Submit a complaint and keep the reference number for updates.',
    switchLabel: 'Switch language',
    switchTarget: 'العربية',
    sections: {
      contact: 'Contact',
      complaint: 'Complaint',
      vehicle: 'Vehicle',
      attachments: 'Attachments',
    },
    fields: {
      customerName: 'Customer name',
      customerPhone: 'Customer phone',
      branch: 'Branch',
      category: 'Category',
      subcategory: 'Subcategory',
      severity: 'Severity',
      incidentAt: 'Incident date',
      subject: 'Subject',
      description: 'Description',
      vehicleRelated: 'This complaint is vehicle-related',
      vehicleVin: 'Vehicle VIN',
      attachment: 'Attachment',
    },
    choices: {
      choose: 'Choose',
      branch: 'Main service branch',
      category: 'Service quality',
      subcategory: 'Repair delay',
      severity: 'High',
    },
    values: {
      name: 'Faisal Al-Otaibi',
      phone: '+966500000001',
      subject: 'Service concern',
      description: 'Describe what happened, when it happened, and what support you need.',
      vin: 'SEEDDEMO00001',
    },
    rules: ['PDF, PNG, or JPG only', 'Maximum size follows the portal policy', 'Scan status is checked before review'],
    actions: {
      submit: 'Submit complaint',
      submitting: 'Submitting complaint.',
    },
    states: {
      success: 'Complaint submitted',
      reference: 'Reference number',
      validation: 'Review the highlighted fields.',
      error: 'Complaint could not be submitted. Review the details and try again.',
      loading: 'Submitting complaint.',
    },
    validation: {
      required: 'This field is required.',
      attachment: 'Attach files only when they match the portal file rules.',
    },
    privacy: 'The portal shows only customer-safe complaint information and the reference number returned after submission.',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    title: 'بوابة شكاوى العملاء',
    subtitle: 'أرسل الشكوى واحتفظ برقم المرجع لمتابعة التحديثات.',
    switchLabel: 'تغيير اللغة',
    switchTarget: 'English',
    sections: {
      contact: 'بيانات التواصل',
      complaint: 'بيانات الشكوى',
      vehicle: 'المركبة',
      attachments: 'المرفقات',
    },
    fields: {
      customerName: 'اسم العميل',
      customerPhone: 'هاتف العميل',
      branch: 'الفرع',
      category: 'التصنيف',
      subcategory: 'التصنيف الفرعي',
      severity: 'الأهمية',
      incidentAt: 'تاريخ الواقعة',
      subject: 'الموضوع',
      description: 'الوصف',
      vehicleRelated: 'الشكوى مرتبطة بمركبة',
      vehicleVin: 'رقم هيكل المركبة',
      attachment: 'مرفق',
    },
    choices: {
      choose: 'اختر',
      branch: 'فرع الخدمة الرئيسي',
      category: 'جودة الخدمة',
      subcategory: 'تأخر الإصلاح',
      severity: 'عالية',
    },
    values: {
      name: 'فيصل العتيبي',
      phone: '+966500000001',
      subject: 'ملاحظة على الخدمة',
      description: 'صف ما حدث، ومتى حدث، وما الدعم المطلوب.',
      vin: 'SEEDDEMO00001',
    },
    rules: ['PDF أو PNG أو JPG فقط', 'الحجم الأقصى يتبع سياسة البوابة', 'يتم فحص الحالة قبل المراجعة'],
    actions: {
      submit: 'إرسال الشكوى',
      submitting: 'جاري إرسال الشكوى.',
    },
    states: {
      success: 'تم إرسال الشكوى',
      reference: 'رقم المرجع',
      validation: 'راجع الحقول المحددة.',
      error: 'تعذر إرسال الشكوى. راجع التفاصيل وحاول مرة أخرى.',
      loading: 'جاري إرسال الشكوى.',
    },
    validation: {
      required: 'هذا الحقل مطلوب.',
      attachment: 'أرفق الملفات فقط عندما تطابق قواعد ملفات البوابة.',
    },
    privacy: 'تعرض البوابة معلومات آمنة للعميل فقط ورقم المرجع بعد الإرسال.',
  },
} as const;

export function resolvePortalLocale(value: string | string[] | undefined): PortalLocale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === 'ar' ? 'ar' : 'en';
}
