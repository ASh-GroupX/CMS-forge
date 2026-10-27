'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Eye, Network, Search, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintRecordRow, TicketRecordRow } from '../../lib/staff-reports-analytics-api';

export type UnifiedRecord = {
  id: string;
  type: 'complaint' | 'ticket';
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  departmentName: string;
  sourceDepartmentName?: string;
  personName: string;
  ownerName: string;
  createdAt: string;
  targetAt: string | null;
  resolvedAt: string | null;
  isOverdue: boolean;
};

interface UnifiedRecordsTableProps {
  locale: Locale;
  complaints: ComplaintRecordRow[];
  tickets: TicketRecordRow[];
  activeTypeFilter?: 'all' | 'ticket' | 'complaint';
  onInspect: (record: UnifiedRecord) => void;
}

export function UnifiedRecordsTable({
  locale,
  complaints,
  tickets,
  activeTypeFilter = 'all',
  onInspect,
}: UnifiedRecordsTableProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const [tab, setTab] = useState<'all' | 'ticket' | 'complaint'>(activeTypeFilter);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const unifiedList = useMemo<UnifiedRecord[]>(() => {
    const list: UnifiedRecord[] = [];
    if (tab === 'all' || tab === 'complaint') {
      for (const c of complaints) {
        list.push({
          id: c.id, type: 'complaint', referenceNumber: c.referenceNumber, title: c.subject,
          status: c.status, priority: c.severity, departmentName: c.departmentName,
          sourceDepartmentName: '', personName: c.customerName, ownerName: c.ownerName,
          createdAt: c.createdAt, targetAt: null, resolvedAt: c.resolvedAt, isOverdue: c.isOverdue,
        });
      }
    }
    if (tab === 'all' || tab === 'ticket') {
      for (const tk of tickets) {
        list.push({
          id: tk.id, type: 'ticket', referenceNumber: tk.referenceNumber, title: tk.title,
          status: tk.status, priority: tk.priority, departmentName: tk.targetDepartmentName,
          sourceDepartmentName: tk.creatingDepartmentName, personName: tk.requestedByName,
          ownerName: tk.assignedEmployeeName, createdAt: tk.createdAt, targetAt: tk.dueAt,
          resolvedAt: tk.resolvedAt, isOverdue: tk.isOverdue,
        });
      }
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((r) =>
      r.referenceNumber.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q) ||
      (r.sourceDepartmentName && r.sourceDepartmentName.toLowerCase().includes(q)) ||
      r.ownerName.toLowerCase().includes(q) ||
      r.personName.toLowerCase().includes(q)
    );
  }, [complaints, tickets, tab, search]);

  const totalPages = Math.ceil(unifiedList.length / pageSize) || 1;
  const pagedRecords = unifiedList.slice((page - 1) * pageSize, page * pageSize);

  const formatJordanDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-JO' : 'en-US', {
        timeZone: 'Asia/Amman', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="p-5 border bg-card shadow-xs space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{t.recordsTable.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.recordsTable.subtitle}</p>
        </div>

        {/* Tab Selector & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
            {(['all', 'ticket', 'complaint'] as const).map((tabKey) => {
              const count = tabKey === 'all' ? complaints.length + tickets.length : tabKey === 'ticket' ? tickets.length : complaints.length;
              const label = tabKey === 'all' ? (isRtl ? 'الكل' : 'All') : tabKey === 'ticket' ? (isRtl ? 'التذاكر الداخلية' : 'Tickets') : (isRtl ? 'شكاوى CRM' : 'Complaints');
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => { setTab(tabKey); setPage(1); }}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                    tab === tabKey ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t.recordsTable.search}
              aria-label={t.recordsTable.search}
              className="h-9 ps-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 font-semibold text-muted-foreground">
              <th className="py-2.5 px-3 text-start">{t.recordsTable.refNumber}</th>
              <th className="py-2.5 px-3 text-start">{isRtl ? 'النوع' : 'Type'}</th>
              <th className="py-2.5 px-3 text-start">{t.recordsTable.titleCol}</th>
              <th className="py-2.5 px-3 text-start min-w-[240px]">{t.recordsTable.flowCol}</th>
              <th className="py-2.5 px-3 text-start">{t.recordsTable.owner}</th>
              <th className="py-2.5 px-3 text-center">{t.recordsTable.status}</th>
              <th className="py-2.5 px-3 text-center">{t.recordsTable.createdAt}</th>
              <th className="py-2.5 px-3 text-end">{isRtl ? 'معاينة' : 'Inspect'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t.recordsTable.empty}
                </td>
              </tr>
            ) : (
              pagedRecords.map((r) => {
                const isTicket = r.type === 'ticket';
                return (
                  <tr
                    key={`${r.type}-${r.id}`}
                    onClick={() => onInspect(r)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                      {r.referenceNumber}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isTicket ? (
                        <Badge variant="outline" className="text-3xs font-semibold gap-1 text-indigo-600 border-indigo-200 dark:border-indigo-800">
                          <Network className="h-2.5 w-2.5" />
                          <span>{isRtl ? 'تذكرة' : 'Ticket'}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-3xs font-semibold gap-1 text-blue-600 border-blue-200 dark:border-blue-800">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          <span>{isRtl ? 'شكوى' : 'Complaint'}</span>
                        </Badge>
                      )}
                    </td>

                    <td className="py-2.5 px-3 max-w-xs">
                      <p className="font-semibold text-foreground truncate">{r.title}</p>
                      <p className="text-3xs text-muted-foreground truncate">{r.personName}</p>
                    </td>

                    {/* Full Flow Routing column */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap text-2xs">
                        {isTicket ? (
                          <>
                            <span className="font-semibold text-foreground">{r.sourceDepartmentName || '—'}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rtl:rotate-180" />
                            <span className="font-semibold text-foreground">{r.departmentName}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-foreground">{r.personName}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 rtl:rotate-180" />
                            <span className="font-semibold text-foreground">{r.departmentName}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-foreground whitespace-nowrap">
                      {r.ownerName || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-muted text-foreground">
                        {r.isOverdue && <AlertCircle className="h-2.5 w-2.5 text-rose-500" />}
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap text-3xs">
                      {formatJordanDate(r.createdAt)}
                    </td>

                    <td className="py-2.5 px-3 text-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        aria-label={isRtl ? 'عرض التفاصيل' : 'View details'}
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          {t.recordsTable.showingRecords} {pagedRecords.length} of {unifiedList.length}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 w-8 p-0"
            aria-label={isRtl ? 'الصفحة السابقة' : 'Previous page'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 w-8 p-0"
            aria-label={isRtl ? 'الصفحة التالية' : 'Next page'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
