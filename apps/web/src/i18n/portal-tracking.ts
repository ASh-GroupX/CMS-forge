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
      changeReference: 'Change reference',
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
    subtitle: 'أدخل رقم المرجع ورقم هاتفك للتحقق وعرض حالة الشكوى والتحديثات الخاصة بها.',
    switchLabel: 'تغيير اللغة',
    switchTarget: 'English',
    sections: {
      request: '1. طلب رمز التحقق',
      verify: '2. إدخال رمز التحقق',
      status: 'حالة الشكوى',
      timeline: 'الخط الزمني للتحديثات',
      followUp: 'إضافة معلومات أو متابعة',
      attachments: 'مرفقات إضافية',
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
      changeReference: 'تغيير المرجع',
      verify: 'التحقق وعرض الحالة',
      followUp: 'إرسال المتابعة',
      attachment: 'رفع المرفق',
    },
    states: {
      loading: 'جارٍ التحقق...',
      requested: 'تم إرسال رمز التحقق بنجاح. يُرجى إدخال أحدث رمز تم إرساله إلى هاتفك.',
      verified: 'تم التحقق بنجاح، وتظهر أدناه حالة شكواك.',
      validation: 'يُرجى إدخال رقم المرجع ورقم الهاتف ورمز التحقق.',
      requestValidation: 'يُرجى إدخال رقم المرجع ورقم الهاتف لإرسال الرمز.',
      codeValidation: 'يُرجى إدخال رمز التحقق المرسل إلى هاتفك.',
      requestError: 'تعذر إرسال رمز التحقق. يُرجى التأكد من صحة رقم المرجع والهاتف ثم المحاولة مجدداً.',
      trackingError: 'تم التحقق بنجاح، ولكن تعذر تحميل تفاصيل الشكوى. يُرجى إعادة المحاولة.',
      invalid: 'رمز التحقق غير صحيح. يُرجى التأكد من الرمز والمحاولة مجدداً.',
      expired: 'انتهت صلاحية رمز التحقق. يُرجى طلب رمز جديد.',
      error: 'تعذر تحميل بيانات المتابعة. يُرجى إعادة المحاولة.',
      followup: 'تم إرسال معلومات المتابعة بنجاح وسيراجعها الفريق المختص.',
      attachment: 'تم رفع الملف بنجاح وسيتم فحصه ومراجعته.',
      denied: 'إضافة المتابعة غير متاحة لهذه الشكوى حالياً.',
      closed: 'هذه الشكوى مغلقة، وبالتالي لم تعد إضافة المتابعات متاحة.',
      empty: 'يُرجى إدخال رمز التحقق لعرض تفاصيل وحالة الشكوى.',
      selectedAttachment: 'الملف المختار',
    },
    attachmentRules: ['الصور وملفات PDF بحد أقصى 10 ميجابايت', 'ملفات الصوت والفيديو بحد أقصى 50 ميجابايت', 'يُحظر تماماً رفع الملفات والبرامج التنفيذية'],
    sample: {
      reference: 'CMP-2026-018',
      phone: '+966500000001',
      status: 'قيد المعالجة',
      created: '2026-06-19',
      updated: '2026-06-19',
      followUp: 'يرجى إضافة فاتورة الخدمة الناقصة.',
      timeline: ['تم الإرسال - 2026-06-19', 'قيد المعالجة - 2026-06-19'],
    },
    privacy: 'تظهر هنا التحديثات المعتمدة للعميل فقط بعد التحقق، ولا تظهر الملاحظات والبيانات الداخلية.',
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
    samplePublicUpdate: 'شكواك قيد المراجعة والمعالجة من قبل فريق علاقات العملاء.',
  },
};

const enPortalTimelineText = {
  publicUpdate: '',
  samplePublicUpdate: '',
};
