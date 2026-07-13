export type DisplayLocale = 'en' | 'ar';

const localeCodes: Record<DisplayLocale, string> = {
  ar: 'ar-EG',
  en: 'en-US',
};

export function missingDisplay(locale: DisplayLocale): string {
  return locale === 'ar' ? 'غير محدد' : 'Not set';
}

export function formatDisplayDate(value: string | null | undefined, locale: DisplayLocale, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeZone: 'UTC' }): string {
  if (!value) return missingDisplay(locale);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === 'ar' ? missingDisplay(locale) : value;
  return new Intl.DateTimeFormat(localeCodes[locale], options).format(date);
}

export function formatDisplayNumber(value: number | null | undefined, locale: DisplayLocale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return missingDisplay(locale);
  return new Intl.NumberFormat(localeCodes[locale]).format(value);
}

export function formatPercent(value: number | null | undefined, locale: DisplayLocale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return missingDisplay(locale);
  return `${formatDisplayNumber(value, locale)}%`;
}

export function formatDurationMinutes(value: number | null | undefined, locale: DisplayLocale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return missingDisplay(locale);
  const number = formatDisplayNumber(value, locale);
  return locale === 'ar' ? `${number} دقيقة` : `${number} min`;
}

export function formatDurationHours(value: number | null | undefined, locale: DisplayLocale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return missingDisplay(locale);
  const number = formatDisplayNumber(value, locale);
  return locale === 'ar' ? `${number} ساعة` : `${number} h`;
}
