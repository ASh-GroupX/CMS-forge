'use client';
import { useEffect, useState } from 'react';
import type { EnterpriseReportCriteria } from './use-enterprise-report-data';

type ReportLocation = EnterpriseReportCriteria & { view: string; officerId: string | null };
const keys = ['recordType', 'departmentId', 'branchId', 'status', 'datePreset', 'dateFrom', 'dateTo', 'search', 'view', 'officerId'] as const;

export function useReportUrl(value: ReportLocation, restore: (value: Partial<ReportLocation>) => void) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restored: Record<string, string | null> = {};
    for (const key of keys) {
      const item = params.get('report.' + key);
      if (item !== null) restored[key] = item || null;
    }
    if (!['all', 'complaints', 'tickets'].includes(String(restored.recordType))) delete restored.recordType;
    if (!['all', 'today', 'week', 'month', 'custom'].includes(String(restored.datePreset))) delete restored.datePreset;
    if (!['overview', 'trends', 'departments', 'records'].includes(String(restored.view))) delete restored.view;
    restore(restored as Partial<ReportLocation>);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    for (const key of keys) {
      const item = value[key];
      if (item) url.searchParams.set('report.' + key, item);
      else url.searchParams.delete('report.' + key);
    }
    window.history.replaceState(window.history.state, '', url);
  }, [ready, JSON.stringify(value)]);
}
