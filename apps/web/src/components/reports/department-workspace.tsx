'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Locale } from '../../i18n/staff-shell';
import { reportDetailText } from '../../i18n/report-detail-workspace';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type { ComplaintsAnalyticsResponse, TicketsAnalyticsResponse } from '../../lib/staff-reports-analytics-api';
import type { EnterpriseReportCriteria } from './use-enterprise-report-data';
import { departmentWorkload, officerWorkload } from './report-workspace-rows';
import { InlineReportRecords } from './inline-report-records';

export function DepartmentWorkspace({ locale, departments, complaints, tickets, criteria }: {
  locale: Locale; departments: DepartmentPerformanceRow[];
  complaints: ComplaintsAnalyticsResponse | null; tickets: TicketsAnalyticsResponse | null;
  criteria: EnterpriseReportCriteria;
}) {
  const copy = reportDetailText[locale];
  const [expanded, setExpanded] = useState<string | null>(null);
  const typeLabel = criteria.recordType === 'all' ? copy.all : criteria.recordType === 'tickets' ? copy.tickets : copy.complaints;
  const officers = officerWorkload(complaints, tickets, criteria.recordType);
  const toggle = (id: string) => setExpanded(value => value === id ? null : id);
  const expandButton = (id: string, name: string) => <Button size="sm" variant="ghost" aria-expanded={expanded === id} aria-controls={expanded === id ? `details-${id}` : undefined}
    aria-label={`${expanded === id ? copy.collapse : copy.expand} · ${name}`} onClick={() => toggle(id)} className="h-auto gap-1 whitespace-normal px-1 text-xs sm:px-3">
    {expanded === id ? copy.collapse : copy.expand}{expanded === id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
  </Button>;
  return <div className="space-y-6">
    <Card className="min-w-0 overflow-hidden">
      <header className="border-b p-4"><h2 className="font-semibold">{copy.departments}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.scope} · {typeLabel}</p></header>
      <Table className="table-fixed [&_th]:px-2 [&_th]:text-xs [&_th]:[overflow-wrap:anywhere] [&_td]:px-2">
        <TableHeader><TableRow><TableHead className="w-1/4 text-start">{copy.department}</TableHead><TableHead>{copy.total}</TableHead><TableHead>{copy.open}</TableHead><TableHead>{copy.resolved}</TableHead><TableHead>{copy.overdue}</TableHead><TableHead className="w-24 sm:w-36"><span className="sr-only">{copy.expand}</span></TableHead></TableRow></TableHeader>
        <TableBody>{departments.length ? departments.map(department => {
          const id = `department-${department.departmentId}`;
          const name = locale === 'ar' ? department.nameAr : department.nameEn;
          const counts = departmentWorkload(department, criteria.recordType);
          return <React.Fragment key={id}>
            <TableRow className={expanded === id ? 'bg-muted/40' : ''}><TableCell className="whitespace-normal break-words font-medium">{name}</TableCell><TableCell>{counts.total}</TableCell><TableCell>{counts.open}</TableCell><TableCell>{counts.resolved}</TableCell><TableCell>{counts.overdue}</TableCell><TableCell>{expandButton(id, name)}</TableCell></TableRow>
            {expanded === id && <TableRow><TableCell id={`details-${id}`} colSpan={6} className="p-0">
              <InlineReportRecords locale={locale} criteria={{ ...criteria, departmentId: department.departmentId }} scopeLabel={`${copy.receiving} · ${name} · ${typeLabel}`} />
            </TableCell></TableRow>}
          </React.Fragment>;
        }) : <TableRow><TableCell colSpan={6}>{copy.empty}</TableCell></TableRow>}</TableBody>
      </Table>
    </Card>
    <Card className="min-w-0 overflow-hidden">
      <header className="border-b p-4"><h2 className="font-semibold">{copy.officers}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.scope} · {typeLabel}</p></header>
      <Table className="table-fixed [&_th]:px-2 [&_th]:text-xs [&_th]:[overflow-wrap:anywhere] [&_td]:px-2">
        <TableHeader><TableRow><TableHead className="w-1/3 text-start">{copy.officer}</TableHead><TableHead>{copy.open}</TableHead><TableHead>{copy.resolved}</TableHead><TableHead>{copy.overdue}</TableHead><TableHead className="w-24 sm:w-36"><span className="sr-only">{copy.expand}</span></TableHead></TableRow></TableHeader>
        <TableBody>{officers.length ? officers.map(officer => {
          const id = `officer-${officer.id}`;
          const name = locale === 'ar' ? officer.nameAr : officer.nameEn;
          return <React.Fragment key={id}>
            <TableRow className={expanded === id ? 'bg-muted/40' : ''}><TableCell className="whitespace-normal break-words font-medium">{name}</TableCell><TableCell>{officer.open}</TableCell><TableCell>{officer.resolved}</TableCell><TableCell>{officer.overdue}</TableCell><TableCell>{expandButton(id, name)}</TableCell></TableRow>
            {expanded === id && <TableRow><TableCell id={`details-${id}`} colSpan={5} className="p-0">
              <InlineReportRecords locale={locale} criteria={criteria} officerId={officer.id} scopeLabel={`${copy.owner} · ${name} · ${typeLabel}`} />
            </TableCell></TableRow>}
          </React.Fragment>;
        }) : <TableRow><TableCell colSpan={5}>{copy.empty}</TableCell></TableRow>}</TableBody>
      </Table>
    </Card>
  </div>;
}
