export type PortalSurveyLocale = 'en' | 'ar';

export const portalSurveyText = {
  en: {
    lang: 'en',
    dir: 'ltr',
    title: 'Customer satisfaction survey',
    subtitle: 'Rate your complaint resolution experience. This survey link can be used once.',
    switchLabel: 'Switch language',
    switchTarget: 'العربية',
    fields: {
      rating: 'Rating',
      comment: 'Optional comment',
    },
    ratingLabels: ['1 - Very dissatisfied', '2 - Dissatisfied', '3 - Neutral', '4 - Satisfied', '5 - Very satisfied'],
    actions: {
      submit: 'Submit survey',
      submitting: 'Submitting survey.',
    },
    states: {
      success: 'Survey submitted. Thank you for your feedback.',
      used: 'This survey link has already been used.',
      expired: 'This survey link has expired.',
      validation: 'Choose a rating from 1 to 5.',
      loading: 'Submitting survey.',
      error: 'Survey could not be submitted. Try again.',
    },
    sample: {
      comment: 'The issue was resolved clearly.',
    },
    privacy: 'The survey stores only the rating and optional customer comment for this complaint.',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    title: 'استبيان رضا العميل',
    subtitle: 'قيّم تجربة حل الشكوى. يمكن استخدام رابط الاستبيان مرة واحدة.',
    switchLabel: 'تغيير اللغة',
    switchTarget: 'English',
    fields: {
      rating: 'التقييم',
      comment: 'تعليق اختياري',
    },
    ratingLabels: ['1 - غير راضٍ جداً', '2 - غير راضٍ', '3 - محايد', '4 - راضٍ', '5 - راضٍ جداً'],
    actions: {
      submit: 'إرسال الاستبيان',
      submitting: 'جاري إرسال الاستبيان.',
    },
    states: {
      success: 'تم إرسال الاستبيان. شكراً لملاحظاتك.',
      used: 'تم استخدام رابط الاستبيان مسبقاً.',
      expired: 'انتهت صلاحية رابط الاستبيان.',
      validation: 'اختر تقييماً من 1 إلى 5.',
      loading: 'جاري إرسال الاستبيان.',
      error: 'تعذر إرسال الاستبيان. حاول مرة أخرى.',
    },
    sample: {
      comment: 'تم حل المشكلة بوضوح.',
    },
    privacy: 'يحفظ الاستبيان التقييم وتعليق العميل الاختياري لهذه الشكوى فقط.',
  },
} as const;

export function resolvePortalSurveyLocale(value: string | string[] | undefined): PortalSurveyLocale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === 'ar' ? 'ar' : 'en';
}
