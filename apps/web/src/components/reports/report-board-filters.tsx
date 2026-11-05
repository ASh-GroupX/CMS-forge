'use client';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export function ReportBoardFilters({ locale, departmentId, departments, from, to, onDepartment, onFrom, onTo }: {
  locale: Locale; departmentId: string | null; departments: { id: string; name: string; nameAr?: string; nameEn?: string }[];
  from: string; to: string; onDepartment: (value: string | null) => void; onFrom: (value: string) => void; onTo: (value: string) => void;
}) {
  const copy = reportsAnalyticsI18n[locale].statusBoard;
  return <div className="flex flex-wrap items-end gap-2 border-y border-border/70 py-3 text-xs">
    <label className="flex flex-col gap-1">{copy.department}
      <Select value={departmentId ?? 'all'} onValueChange={value => onDepartment(value === 'all' ? null : value)}>
        <SelectTrigger aria-label={copy.department} className="h-9 min-w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">{copy.allDepartments}</SelectItem>
          {departments.map(department => <SelectItem key={department.id} value={department.id}>{locale === 'ar' ? department.nameAr || department.name : department.nameEn || department.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
    <label className="flex flex-col gap-1">{copy.createdFrom}<Input aria-label={copy.createdFrom} type="date" value={from} max={to || undefined} onChange={event => onFrom(event.target.value)} className="h-9 w-auto" /></label>
    <label className="flex flex-col gap-1">{copy.createdThrough}<Input aria-label={copy.createdThrough} type="date" value={to} min={from || undefined} onChange={event => onTo(event.target.value)} className="h-9 w-auto" /></label>
    {(from || to) && <Button type="button" variant="ghost" size="sm" onClick={() => { onFrom(''); onTo(''); }} className="h-9 px-3">{copy.clearDates}</Button>}
  </div>;
}
