export type PortalTrackingLocale = 'en' | 'ar';

export const portalTrackingText = {
  en: {
    lang: 'en',
    dir: 'ltr',
    title: 'Track a complaint',
    subtitle: 'Verification is required before complaint status is shown.',
    switchLabel: 'Switch language',
    switchTarget: 'العربية',
    sections: {
      request: 'Request verification',
      verify: 'Enter verification code',
      status: 'Public status',
      timeline: 'Public timeline',
      followUp: 'Add follow-up',
      attachments: 'Follow-up attachments',
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
      request: 'Send verification code',
      verify: 'Verify and show status',
      followUp: 'Submit follow-up',
      attachment: 'Upload attachment',
    },
    states: {
      loading: 'Checking verification.',
      requested: 'Verification code requested. Use the latest code sent to the complaint phone.',
      verified: 'Verification complete.',
      validation: 'Reference number, phone, and verification code are required.',
      requestValidation: 'Reference number and customer phone are required to send a code.',
      codeValidation: 'Enter the verification code sent to the complaint phone.',
      requestError: 'Verification code could not be sent. Check the reference and phone, then try again.',
      trackingError: 'Verification completed, but tracking could not be loaded. Try again.',
      invalid: 'Verification failed. Check the reference and code, then try again.',
      expired: 'Verification expired. Request a new code.',
      error: 'Tracking could not be loaded. Try again.',
      followup: 'Follow-up received.',
      attachment: 'Attachment received for review.',
      denied: 'Follow-up is not available for this complaint.',
      closed: 'Follow-up is closed for this complaint.',
      empty: 'Complete verification to view customer-safe tracking updates.',
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
    privacy: 'Only verified customer-safe status and public timeline updates appear here.',
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
