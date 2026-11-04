import type { Locale } from '../i18n/staff-shell';

export type ReportRecordKind = 'ticket' | 'complaint';
export type StaffDetailFallback = 'tickets' | 'complaints';
export type ReportReturnContext = 'reports' | 'complaint-reports' | 'ticket-reports';

export function reportRecordDetailHref(kind: ReportRecordKind, id: string, locale: Locale, returnTo: ReportReturnContext = 'reports'): string {
  const segment = kind === 'ticket' ? 'internal-tickets' : 'complaints';
  return `/${segment}/${encodeURIComponent(id)}?returnTo=${returnTo}&locale=${locale}`;
}

export function staffDetailBackHref(returnTo: string | undefined, locale: Locale, fallback: StaffDetailFallback): string {
  const reportPaths: Record<ReportReturnContext, string> = {
    reports: '/reports', 'complaint-reports': '/reports/complaints', 'ticket-reports': '/reports/internal-tickets',
  };
  const path = returnTo && returnTo in reportPaths
    ? reportPaths[returnTo as ReportReturnContext]
    : fallback === 'tickets' ? '/internal-tickets' : '/complaints';
  return `${path}?locale=${locale}`;
}
