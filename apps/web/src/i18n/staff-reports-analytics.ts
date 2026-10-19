import type { Locale } from './staff-shell';
import { reportsAnalyticsEn } from './staff-reports-analytics-en';
import { reportsAnalyticsAr } from './staff-reports-analytics-ar';

export type ReportsAnalyticsDictionary = typeof reportsAnalyticsEn;

export const reportsAnalyticsI18n: Record<Locale, ReportsAnalyticsDictionary> = {
  en: reportsAnalyticsEn,
  ar: reportsAnalyticsAr, // تقارير وتحليلات العمليات
};
