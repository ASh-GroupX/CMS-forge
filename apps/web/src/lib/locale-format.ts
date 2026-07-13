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

export function formatZonedDateTimeLocal(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = dateTimeParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const desired = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  let instant = desired;
  for (let index = 0; index < 3; index += 1) {
    const parts = dateTimeParts(new Date(instant), timeZone);
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    instant += desired - represented;
  }
  return new Date(instant).toISOString();
}

function dateTimeParts(date: Date, timeZone: string): Record<'year' | 'month' | 'day' | 'hour' | 'minute', string> {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(values.map((part) => [part.type, part.value])) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>;
}
