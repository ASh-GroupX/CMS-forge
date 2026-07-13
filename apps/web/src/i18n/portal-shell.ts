export type PortalShellLocale = 'en' | 'ar';
export type PortalShellPage = 'submit' | 'track' | 'survey';

export const portalShellText = {
  en: {
    lang: 'en',
    dir: 'ltr',
    skipToMain: 'Skip to portal content',
    navLabel: 'Customer portal',
    footerLabel: 'Portal privacy',
    trust: 'Verification protects complaint details before any status is shown.',
    nav: {
      submit: 'Submit complaint',
      track: 'Track complaint',
      survey: 'Survey',
    },
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    skipToMain: 'انتقل إلى محتوى البوابة',
    navLabel: 'بوابة العملاء',
    footerLabel: 'خصوصية البوابة',
    trust: 'يحمي التحقق تفاصيل الشكوى قبل عرض أي حالة.',
    nav: {
      submit: 'إرسال شكوى',
      track: 'متابعة شكوى',
      survey: 'استبيان',
    },
  },
} as const;
