import type { Locale } from './staff-shell';

export const complaintAuditText: Record<Locale, {
  title: string;
  empty: string;
  error: string;
  actorFallback: string;
}> = {
  en: {
    title: 'Audit log',
    empty: 'No audit records are available for this complaint.',
    error: 'Audit records could not be loaded. Refresh the page and try again.',
    actorFallback: 'System',
  },
  ar: {
    title: 'سجل التدقيق',
    empty: 'لا توجد سجلات تدقيق لهذه الشكوى.',
    error: 'تعذر تحميل سجلات التدقيق. حدّث الصفحة وحاول مرة أخرى.',
    actorFallback: 'النظام',
  },
};
