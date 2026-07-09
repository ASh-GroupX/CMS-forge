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
      submitComplaint: 'Submit a complaint',
      submitting: 'Submitting survey.',
      trackComplaint: 'Track complaint',
    },
    states: {
      success: 'Survey submitted. Thank you for your feedback.',
      used: 'This survey link has already been used.',
      expired: 'This survey link has expired.',
      validation: 'Choose a rating from 1 to 5.',
      loading: 'Submitting survey.',
      error: 'Survey could not be submitted. Try again.',
      missing: 'This survey link is invalid. Use the link sent for your complaint.',
    },
    terminal: {
      success: { title: 'Survey submitted', body: 'Thank you. Your rating was saved for this complaint.' },
      used: { title: 'This survey link was already used', body: 'Only one survey can be sent for this link. You can still track the complaint status.' },
      expired: { title: 'This survey link has expired', body: 'The survey is no longer available. You can continue from the complaint tracking page.' },
      missing: { title: 'Survey link is missing', body: 'Open the survey from the link sent for your complaint, or use complaint tracking instead.' },
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
      submitComplaint: 'إرسال شكوى',
      submitting: 'جاري إرسال الاستبيان.',
      trackComplaint: 'متابعة الشكوى',
    },
    states: {
      success: 'تم إرسال الاستبيان. شكراً لملاحظاتك.',
      used: 'تم استخدام رابط الاستبيان مسبقاً.',
      expired: 'انتهت صلاحية رابط الاستبيان.',
      validation: 'اختر تقييماً من 1 إلى 5.',
      loading: 'جاري إرسال الاستبيان.',
      error: 'تعذر إرسال الاستبيان. حاول مرة أخرى.',
      missing: 'رابط الاستبيان غير صالح. استخدم الرابط المرسل لشكواك.',
    },
    terminal: {
      success: { title: 'تم إرسال الاستبيان', body: 'شكرا لك. تم حفظ تقييمك لهذه الشكوى.' },
      used: { title: 'تم استخدام رابط الاستبيان مسبقا', body: 'لا يمكن إرسال استبيان آخر لهذا الرابط. يمكنك متابعة الشكوى من صفحة متابعة الشكوى.' },
      expired: { title: 'انتهت صلاحية رابط الاستبيان', body: 'لم يعد نموذج الاستبيان متاحا. يمكنك متابعة الشكوى من صفحة متابعة الشكوى.' },
      missing: { title: 'رابط الاستبيان غير موجود', body: 'افتح الاستبيان من الرابط المرسل لشكواك، أو تابع الشكوى من صفحة متابعة الشكوى.' },
    },
    privacy: 'يحفظ الاستبيان التقييم وتعليق العميل الاختياري لهذه الشكوى فقط.',
  },
} as const;

export function resolvePortalSurveyLocale(value: string | string[] | undefined): PortalSurveyLocale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === 'ar' ? 'ar' : 'en';
}
