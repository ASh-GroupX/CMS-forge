export type PortalTrackingLocale = 'en' | 'ar';

export const portalTrackingText = {
  en: {
    lang: 'en',
    dir: 'ltr',
    title: 'Track a complaint',
    subtitle: 'Enter your reference and phone first. We send a code before showing the complaint status.',
    switchLabel: 'Switch language',
    switchTarget: 'العربية',
    sections: {
      request: '1. Send code',
      verify: '2. Enter code',
      status: 'Complaint status',
      timeline: 'Updates you can see',
      followUp: 'Add more information',
      attachments: 'Add files',
    },
    fields: {
      reference: 'Reference number',
      phone: 'Customer phone',
      code: 'Verification code',
      followUp: 'Follow-up information',
      attachment: 'Attachment file',
      created: 'Created',
      updated: 'Updated',
    },
    actions: {
      request: 'Send code',
      verify: 'Show status',
      followUp: 'Submit follow-up',
      attachment: 'Upload attachment',
    },
    states: {
      loading: 'Checking the code.',
      requested: 'Code sent. Use the newest code sent to the complaint phone.',
      verified: 'Code accepted. Your complaint status is shown below.',
      validation: 'Enter the reference, phone, and code.',
      requestValidation: 'Enter the reference number and phone to send a code.',
      codeValidation: 'Enter the code sent to the complaint phone.',
      requestError: 'Code could not be sent. Check the reference and phone, then try again.',
      trackingError: 'Code accepted, but the status did not load. Refresh and try again.',
      invalid: 'Code did not match. Check the reference and code, then try again.',
      expired: 'Code expired. Send a new code.',
      error: 'Tracking could not be loaded. Refresh and try again.',
      followup: 'Follow-up sent. Staff can review it now.',
      attachment: 'File uploaded. Staff can review it now.',
      denied: 'Follow-up is not available for this complaint.',
      closed: 'This complaint is closed, so follow-up is no longer available.',
      empty: 'Send and enter the code to see customer-safe updates.',
      selectedAttachment: 'Selected file',
    },
    attachmentRules: ['Images and PDFs up to 10 MB', 'Audio and video up to 50 MB', 'Executable files are blocked'],
    sample: {
      reference: 'CMP-2026-018',
      phone: '+966500000001',
      status: 'IN_PROGRESS',
      created: '2026-06-19',
      updated: '2026-06-19',
      followUp: 'Please add the missing service invoice.',
      timeline: ['SUBMITTED - 2026-06-19', 'IN_PROGRESS - 2026-06-19'],
    },
    privacy: 'Status is hidden until the code is accepted. Only customer-safe updates appear here.',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    title: 'متابعة الشكوى',
    subtitle: 'يلزم التحقق قبل عرض حالة الشكوى.',
    switchLabel: 'تغيير اللغة',
    switchTarget: 'English',
    sections: {
      request: 'طلب التحقق',
      verify: 'إدخال رمز التحقق',
      status: 'الحالة العامة',
      timeline: 'الخط الزمني العام',
      followUp: 'إضافة متابعة',
      attachments: 'مرفقات المتابعة',
    },
    fields: {
      reference: 'رقم المرجع',
      phone: 'هاتف العميل',
      code: 'رمز التحقق',
      followUp: 'معلومات المتابعة',
      attachment: 'ملف المرفق',
      created: 'تاريخ الإنشاء',
      updated: 'آخر تحديث',
    },
    actions: {
      request: 'إرسال رمز التحقق',
      verify: 'تحقق واعرض الحالة',
      followUp: 'إرسال المتابعة',
      attachment: 'رفع المرفق',
    },
    states: {
      loading: 'جاري التحقق.',
      requested: 'تم طلب رمز التحقق. استخدم آخر رمز أرسل لهاتف الشكوى.',
      verified: 'تم التحقق.',
      validation: 'رقم المرجع والهاتف ورمز التحقق مطلوبة.',
      requestValidation: 'رقم المرجع وهاتف العميل مطلوبان لإرسال الرمز.',
      codeValidation: 'أدخل رمز التحقق المرسل إلى هاتف الشكوى.',
      requestError: 'تعذر إرسال رمز التحقق. راجع المرجع والهاتف ثم حاول مرة أخرى.',
      trackingError: 'اكتمل التحقق، لكن تعذر تحميل المتابعة. حاول مرة أخرى.',
      invalid: 'فشل التحقق. راجع المرجع والرمز ثم حاول مرة أخرى.',
      expired: 'انتهت صلاحية التحقق. اطلب رمزاً جديداً.',
      error: 'تعذر تحميل المتابعة. حاول مرة أخرى.',
      followup: 'تم استلام المتابعة.',
      attachment: 'تم استلام المرفق للمراجعة.',
      denied: 'لا يمكن إضافة متابعة لهذه الشكوى.',
      closed: 'تم إغلاق المتابعة لهذه الشكوى.',
      empty: 'أكمل التحقق لعرض تحديثات المتابعة الآمنة للعميل.',
      selectedAttachment: 'الملف المحدد',
    },
    attachmentRules: ['الصور وملفات PDF حتى 10 ميغابايت', 'الصوت والفيديو حتى 50 ميغابايت', 'يتم حظر الملفات التنفيذية'],
    sample: {
      reference: 'CMP-2026-018',
      phone: '+966500000001',
      status: 'قيد المعالجة',
      created: '2026-06-19',
      updated: '2026-06-19',
      followUp: 'يرجى إضافة فاتورة الخدمة الناقصة.',
      timeline: ['تم الإرسال - 2026-06-19', 'قيد المعالجة - 2026-06-19'],
    },
    privacy: 'تظهر هنا الحالة الآمنة للعميل والتحديثات العامة فقط بعد التحقق.',
  },
} as const;

export function resolvePortalTrackingLocale(value: string | string[] | undefined): PortalTrackingLocale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === 'ar' ? 'ar' : 'en';
}

export const portalTimelineText: Record<PortalTrackingLocale, typeof enPortalTimelineText> = {
  en: {
    publicUpdate: 'Public update',
    samplePublicUpdate: 'Your complaint is under review by the customer relations team.',
  },
  ar: {
    publicUpdate: 'تحديث عام',
    samplePublicUpdate: 'شكواك قيد المراجعة من فريق علاقات العملاء.',
  },
};

const enPortalTimelineText = {
  publicUpdate: '',
  samplePublicUpdate: '',
};
