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
    },
    fields: {
      reference: 'Reference number',
      phone: 'Customer phone',
      code: 'Verification code',
      followUp: 'Follow-up information',
      created: 'Created',
      updated: 'Updated',
    },
    actions: {
      request: 'Send verification code',
      verify: 'Verify and show status',
      followUp: 'Submit follow-up',
    },
    states: {
      loading: 'Checking verification.',
      requested: 'Verification code requested. Use the latest code sent to the complaint phone.',
      verified: 'Verification complete.',
      validation: 'Reference number, phone, and verification code are required.',
      invalid: 'Verification failed. Check the reference and code, then try again.',
      expired: 'Verification expired. Request a new code.',
      error: 'Tracking could not be loaded. Try again.',
      followup: 'Follow-up received.',
    },
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
    },
    fields: {
      reference: 'رقم المرجع',
      phone: 'هاتف العميل',
      code: 'رمز التحقق',
      followUp: 'معلومات المتابعة',
      created: 'تاريخ الإنشاء',
      updated: 'آخر تحديث',
    },
    actions: {
      request: 'إرسال رمز التحقق',
      verify: 'تحقق واعرض الحالة',
      followUp: 'إرسال المتابعة',
    },
    states: {
      loading: 'جاري التحقق.',
      requested: 'تم طلب رمز التحقق. استخدم آخر رمز أرسل لهاتف الشكوى.',
      verified: 'تم التحقق.',
      validation: 'رقم المرجع والهاتف ورمز التحقق مطلوبة.',
      invalid: 'فشل التحقق. راجع المرجع والرمز ثم حاول مرة أخرى.',
      expired: 'انتهت صلاحية التحقق. اطلب رمزاً جديداً.',
      error: 'تعذر تحميل المتابعة. حاول مرة أخرى.',
      followup: 'تم استلام المتابعة.',
    },
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
