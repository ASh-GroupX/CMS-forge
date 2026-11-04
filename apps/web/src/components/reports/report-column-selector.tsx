'use client';

import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export function ReportColumnSelector({ locale, statuses, selected, onChange }: {
  locale: Locale;
  statuses: string[];
  selected: string[];
  onChange: (statuses: string[]) => void;
}) {
  const copy = reportsAnalyticsI18n[locale].statusBoard;
  return <fieldset className="min-w-0 space-y-3 border-t border-border/70 pt-3">
    <legend className="px-1 text-xs font-semibold">{copy.visibleColumns}</legend>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
        <Checkbox aria-label={copy.selectAllColumns} checked={selected.length === statuses.length ? true : selected.length ? 'indeterminate' : false}
          onCheckedChange={(checked) => onChange(checked === true ? [...statuses] : [])} />
        {copy.selectAllColumns}
      </label>
      <Button type="button" variant="ghost" size="sm" disabled={!selected.length} onClick={() => onChange([])}>{copy.clearColumns}</Button>
      <span className="text-xs text-muted-foreground" role="status">{copy.columnsSelected(selected.length, statuses.length)}</span>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {statuses.map(status => <label key={status} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted/50">
        <Checkbox aria-label={copy.statuses[status as keyof typeof copy.statuses] ?? status} checked={selected.includes(status)} onCheckedChange={(checked) => onChange(checked === true ? [...selected, status] : selected.filter(value => value !== status))} />
        {copy.statuses[status as keyof typeof copy.statuses] ?? status}
      </label>)}
    </div>
    {!selected.length && <p role="status" className="text-sm text-muted-foreground">{copy.noColumnsSelected}</p>}
  </fieldset>;
}
