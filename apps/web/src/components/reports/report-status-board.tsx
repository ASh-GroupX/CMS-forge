'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, UserRound } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Locale } from '../../i18n/staff-shell';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { ComplaintRecordRow, TicketRecordRow } from '../../lib/staff-reports-analytics-api';
import { fetchComplaintsRecords, fetchTicketsRecords } from '../../lib/staff-reports-analytics-api';
import { reportRecordDetailHref, type ReportReturnContext } from '../../lib/staff-report-navigation';

type Item = {
  id: string; type: 'ticket' | 'complaint'; ref: string; title: string; status: string; kind: string; created: string;
  creator: string; accepted: string | null; assigned: string; from: string; to: string; urgency: string;
};

const statuses = [
  'DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'PENDING_APPROVAL', 'NEW',
  'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'REOPENED', 'RESOLVED', 'COMPLETED', 'CLOSED', 'REJECTED',
];
const ticketStatuses = ['PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'];
const complaintStatuses = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'REOPENED', 'RESOLVED', 'COMPLETED', 'CLOSED', 'REJECTED'];
const pageSize = 25;
export const STATUS_BOARD_PAGE_SIZE = pageSize;

type StatusColumn = {
  tickets: TicketRecordRow[]; complaints: ComplaintRecordRow[];
  ticketTotal: number; complaintTotal: number; ticketOffset: number; complaintOffset: number;
};

type BoardFilterExtras = {
  creatingDepartmentId?: string | null;
  assignedEmployeeId?: string | null;
  ownerId?: string | null;
  categoryId?: string | null;
  priority?: string | null;
  severity?: string | null;
};

function emptyColumns(): Record<string, StatusColumn> {
  return Object.fromEntries(statuses.map((status) => [status, emptyColumn()]));
}

function emptyColumn(): StatusColumn {
  return { tickets: [], complaints: [], ticketTotal: 0, complaintTotal: 0, ticketOffset: 0, complaintOffset: 0 };
}

type Props = {
  locale: Locale; departmentId: string | null; branchId: string | null; search: string;
  type: 'all' | 'tickets' | 'complaints';
  departments: { id: string; name: string; nameEn?: string; nameAr?: string }[];
  showBoardFilters?: boolean;
  externalDateFrom?: string | null;
  externalDateTo?: string | null;
  dateDimension?: 'createdAt' | 'firstResponseAt' | 'dueAt' | 'resolvedAt' | 'closedAt';
  returnTo?: ReportReturnContext;
  selectedStatus?: string | null;
  filterExtras?: BoardFilterExtras;
};

export function buildStatusBoardFilters(input: {
  from: string; to: string; search: string; branchId: string | null; departmentId: string | null; status: string;
  dateDimension?: 'createdAt' | 'firstResponseAt' | 'dueAt' | 'resolvedAt' | 'closedAt';
  view?: 'active' | 'resolved' | 'overdue' | 'unassigned';
  extras?: BoardFilterExtras;
}) {
  const ticketDateDimension = input.dateDimension === 'firstResponseAt' ? 'createdAt' : input.dateDimension;
  const complaintDateDimension = input.dateDimension === 'dueAt' ? 'createdAt'
    : input.dateDimension === 'firstResponseAt' ? 'createdAt' : input.dateDimension;
  const common = {
    dateFrom: input.from || (input.to ? '1970-01-01' : null),
    dateTo: input.to || (input.from ? '9999-12-31' : null),
    search: input.search.trim() || null,
    branchId: input.branchId,
    ...(input.view ? { view: input.view } : {}),
  };
  return {
    tickets: {
      ...common, ...(ticketDateDimension ? { dateDimension: ticketDateDimension } : {}), targetDepartmentId: input.departmentId,
      ...(input.extras?.creatingDepartmentId ? { creatingDepartmentId: input.extras.creatingDepartmentId } : {}),
      ...(input.extras?.assignedEmployeeId ? { assignedEmployeeId: input.extras.assignedEmployeeId } : {}),
      ...(input.extras?.categoryId ? { categoryId: input.extras.categoryId } : {}),
      ...(input.extras?.priority ? { priority: input.extras.priority } : {}), status: input.status,
    },
    complaints: {
      ...common, ...(complaintDateDimension ? { dateDimension: complaintDateDimension } : {}), departmentId: input.departmentId,
      ...(input.extras?.ownerId ? { ownerId: input.extras.ownerId } : {}),
      ...(input.extras?.categoryId ? { categoryId: input.extras.categoryId } : {}),
      ...(input.extras?.severity ? { severity: input.extras.severity } : {}), status: input.status,
    },
  };
}

export function ReportStatusBoard({
  locale, departmentId, branchId, search, type, departments, showBoardFilters = true,
  externalDateFrom, externalDateTo, dateDimension, returnTo = 'reports', selectedStatus, filterExtras,
}: Props) {
  const ar = locale === 'ar';
  const copy = reportsAnalyticsI18n[locale].statusBoard;
  const [boardDepartmentId, setBoardDepartmentId] = useState(departmentId);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [columns, setColumns] = useState<Record<string, StatusColumn>>(emptyColumns);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [moreFailed, setMoreFailed] = useState<string | null>(null);
  const filterVersion = useRef(0);
  const activeFrom = showBoardFilters ? from : externalDateFrom || '';
  const activeTo = showBoardFilters ? to : externalDateTo || '';

  useEffect(() => setBoardDepartmentId(departmentId), [departmentId]);
  useEffect(() => { setFrom(externalDateFrom || ''); setTo(externalDateTo || ''); }, [externalDateFrom, externalDateTo]);
  const view = ({ open: 'active', overdue: 'overdue', unassigned: 'unassigned', resolved: 'resolved' } as const)[selectedStatus as 'open' | 'overdue' | 'unassigned' | 'resolved']
    ?? (selectedStatus === 'OPEN' ? 'active' : selectedStatus === 'OVERDUE' ? 'overdue' : undefined);
  const matchesStatus = (status: string) => !selectedStatus || !!view || selectedStatus.toUpperCase() === status;

  useEffect(() => {
    const controller = new AbortController();
    const version = ++filterVersion.current;
    setLoading(true);
    setFailed(false);
    setLoadingMore(null);
    setMoreFailed(null);
    setColumns(emptyColumns());
    const filterFor = (status: string) => buildStatusBoardFilters({ from: activeFrom, to: activeTo, search, branchId, departmentId: boardDepartmentId, status, ...(view ? { view } : {}), ...(dateDimension ? { dateDimension } : {}), ...(filterExtras ? { extras: filterExtras } : {}) });
    const ticketRequests = type === 'complaints' ? [] : ticketStatuses.filter(matchesStatus).map(async (status) => {
      const result = await fetchTicketsRecords(filterFor(status).tickets, pageSize, 0, undefined, undefined, { signal: controller.signal });
      if (!result) throw new Error('Report board request failed');
      return { status, ...result };
    });
    const complaintRequests = type === 'tickets' ? [] : complaintStatuses.filter(matchesStatus).map(async (status) => {
      const result = await fetchComplaintsRecords(filterFor(status).complaints, pageSize, 0, undefined, undefined, { signal: controller.signal });
      if (!result) throw new Error('Report board request failed');
      return { status, ...result };
    });
    Promise.all([Promise.all(ticketRequests), Promise.all(complaintRequests)]).then(([ticketPages, complaintPages]) => {
      if (!controller.signal.aborted && version === filterVersion.current) {
        setColumns((current) => {
          const next = { ...current };
          for (const page of ticketPages) next[page.status] = {
            ...(next[page.status] ?? emptyColumn()), tickets: page.items, ticketTotal: page.total, ticketOffset: page.items.length,
          };
          for (const page of complaintPages) next[page.status] = {
            ...(next[page.status] ?? emptyColumn()), complaints: page.items, complaintTotal: page.total, complaintOffset: page.items.length,
          };
          return next;
        });
        setLoading(false);
      }
    }).catch(() => {
      if (!controller.signal.aborted && version === filterVersion.current) {
        setFailed(true);
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [boardDepartmentId, branchId, search, type, activeFrom, activeTo, dateDimension, selectedStatus, filterExtras, reload]);

  const toTicketItem = (t: TicketRecordRow): Item => ({
      id: t.id, type: 'ticket', ref: t.referenceNumber, title: t.title, status: t.status, kind: copy.ticket,
      created: t.createdAt, creator: t.requestedByName, accepted: t.acceptedByName, assigned: localizedAssignee(t.assignedEmployeeName, copy.unassigned),
      from: t.creatingDepartmentName, to: t.targetDepartmentName, urgency: localizeCode(copy.priorities, t.priority),
    });
  const toComplaintItem = (c: ComplaintRecordRow): Item => ({
      id: c.id, type: 'complaint', ref: c.referenceNumber, title: c.subject, status: c.status, kind: copy.complaint,
      created: c.createdAt, creator: c.createdByName || c.customerName, accepted: c.acceptedByName, assigned: localizedAssignee(c.ownerName, copy.unassigned),
      from: copy.customerSource, to: c.departmentName, urgency: localizeCode(copy.severities, c.severity),
    });

  const loadMore = async (status: string) => {
    const column = columns[status];
    if (!column || loadingMore) return;
    const version = filterVersion.current;
    setLoadingMore(status);
    setMoreFailed(null);
    const filter = buildStatusBoardFilters({ from: activeFrom, to: activeTo, search, branchId, departmentId: boardDepartmentId, status, ...(view ? { view } : {}), ...(dateDimension ? { dateDimension } : {}), ...(filterExtras ? { extras: filterExtras } : {}) });
    try {
      const [ticketPage, complaintPage] = await Promise.all([
        type !== 'complaints' && column.ticketOffset < column.ticketTotal
          ? fetchTicketsRecords(filter.tickets, pageSize, column.ticketOffset)
          : Promise.resolve(null),
        type !== 'tickets' && column.complaintOffset < column.complaintTotal
          ? fetchComplaintsRecords(filter.complaints, pageSize, column.complaintOffset)
          : Promise.resolve(null),
      ]);
      if ((type !== 'complaints' && column.ticketOffset < column.ticketTotal && !ticketPage)
        || (type !== 'tickets' && column.complaintOffset < column.complaintTotal && !complaintPage)) throw new Error('Could not load more records');
      if (version !== filterVersion.current) return;
      setColumns((current) => ({
        ...current,
        [status]: {
          ...(current[status] ?? emptyColumn()),
          tickets: ticketPage ? [...(current[status] ?? emptyColumn()).tickets, ...ticketPage.items] : (current[status] ?? emptyColumn()).tickets,
          complaints: complaintPage ? [...(current[status] ?? emptyColumn()).complaints, ...complaintPage.items] : (current[status] ?? emptyColumn()).complaints,
          ticketOffset: ticketPage ? column.ticketOffset + ticketPage.items.length : column.ticketOffset,
          complaintOffset: complaintPage ? column.complaintOffset + complaintPage.items.length : column.complaintOffset,
        },
      }));
    } catch {
      if (version === filterVersion.current) setMoreFailed(status);
    } finally {
      if (version === filterVersion.current) setLoadingMore(null);
    }
  };

  const loadedTotal = Object.values(columns).reduce((sum, column) => sum + column.ticketTotal + column.complaintTotal, 0);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(ar ? 'ar-JO' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Amman',
  }), [ar]);

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold">{copy.title}</h3>
          <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
        </div>
        {showBoardFilters && <div className="flex flex-wrap items-end gap-2 border-y border-border/70 py-3 text-xs">
          <label className="flex flex-col gap-1">{copy.department}
            <Select value={boardDepartmentId ?? 'all'} onValueChange={(value) => setBoardDepartmentId(value === 'all' ? null : value)}>
              <SelectTrigger aria-label={copy.department} className="h-9 min-w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allDepartments}</SelectItem>
                {departments.map((department) => <SelectItem key={department.id} value={department.id}>{ar ? department.nameAr || department.name : department.nameEn || department.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1">{copy.createdFrom}
            <Input aria-label={copy.createdFrom} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-9 w-auto" />
          </label>
          <label className="flex flex-col gap-1">{copy.createdThrough}
            <Input aria-label={copy.createdThrough} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-9 w-auto" />
          </label>
          {(from || to) && <Button type="button" variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); }} className="h-9 px-3">{copy.clearDates}</Button>}
        </div>}
      </div>
      {loading && <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>}
      {failed && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
        <span>{copy.failed}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setReload((n) => n + 1)}>{copy.retry}</Button>
      </div>}
      {!loading && !failed && loadedTotal === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{copy.noMatches}</p>}
      <div role="region" aria-label={copy.title} tabIndex={0} className="flex gap-3 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
        {statuses.map((status) => {
          const column = columns[status] ?? emptyColumn();
          const group = [...column.tickets.map(toTicketItem), ...column.complaints.map(toComplaintItem)];
          const total = column.ticketTotal + column.complaintTotal;
          const hasMore = column.ticketOffset < column.ticketTotal || column.complaintOffset < column.complaintTotal;
          const nextCount = Math.min(pageSize, column.ticketTotal - column.ticketOffset) + Math.min(pageSize, column.complaintTotal - column.complaintOffset);
          const statusLabel = copy.statuses[status as keyof typeof copy.statuses] ?? status;
          return <section key={status} aria-label={statusLabel} className="w-[min(21rem,85vw)] shrink-0 rounded-xl border bg-muted/20 p-3">
            <header className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold">{statusLabel}</h4><Badge variant="outline">{total}</Badge>
            </header>
            <div role="region" aria-label={statusLabel} tabIndex={0} className="max-h-[38rem] space-y-2 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              {group.map((item) => <article key={`${item.kind}-${item.id}`} className="rounded-lg border bg-card p-3 shadow-xs">
                <div className="flex justify-between gap-2"><Link href={reportRecordDetailHref(item.type, item.id, locale, returnTo)} className="text-xs font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">{item.ref}</Link><Badge variant="outline" className="text-[10px]">{item.kind}</Badge></div>
                <p className="mt-2 break-words text-sm font-semibold leading-snug">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{copy.prioritySeverity}: {item.urgency}</p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 shrink-0" />{dateFormatter.format(new Date(item.created))}</p>
                  <p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 shrink-0" />{copy.createdBy}: {item.creator}</p>
                  <p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 shrink-0" />{copy.acceptedBy}: {item.accepted || copy.notRecorded}</p>
                  <p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 shrink-0" />{copy.currentOwner}: {item.assigned}</p>
                  <p className="flex min-w-0 items-center gap-1.5"><span className="truncate" title={item.from}>{item.from}</span><ArrowRight className="h-3 w-3 shrink-0 rtl:rotate-180" /><span className="truncate" title={item.to}>{item.to}</span></p>
                </div>
              </article>)}
              {total === 0 && !loading && !failed && <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{copy.noStateRecords}</p>}
              {hasMore && <Button type="button" variant="ghost" size="sm" className="w-full" disabled={loadingMore === status} onClick={() => void loadMore(status)}>{loadingMore === status ? copy.loadingMore : moreFailed === status ? copy.retryMore : copy.loadMore(nextCount)}</Button>}
            </div>
          </section>;
        })}
      </div>
    </Card>
  );
}

function localizeCode(values: Record<string, string>, value: string): string {
  return values[value] ?? value;
}

function localizedAssignee(value: string, unassignedLabel: string): string {
  return value.toLowerCase() === 'unassigned' ? unassignedLabel : value;
}
