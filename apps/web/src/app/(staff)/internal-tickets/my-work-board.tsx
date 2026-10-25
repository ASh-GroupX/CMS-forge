'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, PlusCircle, LayoutDashboard, Filter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { internalTicketsText } from '../../../i18n/staff-internal-tickets';
import { resolveLocale, type Locale } from '../../../i18n/staff-shell';

const STATUS_ORDER = ['PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'];

function getMeta(status: string, locale: Locale) {
  const dict = internalTicketsText[locale]?.statuses || internalTicketsText.en.statuses;
  return dict[status as keyof typeof dict] || dict.NEW;
}

function getDueDateColor(t: any) {
  if (!t.dueAt) return 'text-content-strong font-medium';
  const dueDate = new Date(t.dueAt);
  const now = new Date();
  const finishDate = t.resolvedAt ? new Date(t.resolvedAt) : (t.updatedAt ? new Date(t.updatedAt) : now);
  if (['RESOLVED', 'CLOSED'].includes(t.status)) {
    return finishDate <= dueDate ? 'text-emerald-600 font-bold' : 'text-purple-600 font-bold';
  }
  return now > dueDate ? 'text-red-600 font-bold' : 'text-orange-500 font-bold';
}

function getCardBorderClass(t: any) {
  if (!t.dueAt) return 'border-y-line-subtle border-r-line-subtle bg-surface';
  const dueDate = new Date(t.dueAt);
  const now = new Date();
  const finishDate = t.resolvedAt ? new Date(t.resolvedAt) : (t.updatedAt ? new Date(t.updatedAt) : now);
  if (['RESOLVED', 'CLOSED'].includes(t.status)) {
    return finishDate <= dueDate
      ? 'border-y-emerald-200 border-r-emerald-200 bg-emerald-50/70 ring-1 ring-inset ring-emerald-100/50 shadow-emerald-500/10 hover:border-y-emerald-300 hover:border-r-emerald-300 dark:bg-emerald-500/10 dark:border-y-emerald-500/30 dark:border-r-emerald-500/30 dark:ring-emerald-500/20 dark:hover:border-y-emerald-400/50 dark:hover:border-r-emerald-400/50'
      : 'border-y-purple-200 border-r-purple-200 bg-purple-50/70 ring-1 ring-inset ring-purple-100/50 shadow-purple-500/10 hover:border-y-purple-300 hover:border-r-purple-300 dark:bg-purple-500/10 dark:border-y-purple-500/30 dark:border-r-purple-500/30 dark:ring-purple-500/20 dark:hover:border-y-purple-400/50 dark:hover:border-r-purple-400/50';
  }
  return now > dueDate
    ? 'border-y-red-300 border-r-red-300 bg-red-50/70 ring-1 ring-inset ring-red-200/50 shadow-red-500/20 shadow-md hover:border-y-red-400 hover:border-r-red-400 dark:bg-red-500/10 dark:border-y-red-500/30 dark:border-r-red-500/30 dark:ring-red-500/20 dark:hover:border-y-red-400/50 dark:hover:border-r-red-400/50'
    : 'border-y-orange-200 border-r-orange-200 bg-orange-50/70 ring-1 ring-inset ring-orange-100/50 shadow-orange-500/10 hover:border-y-orange-300 hover:border-r-orange-300 dark:bg-orange-500/10 dark:border-y-orange-500/30 dark:border-r-orange-500/30 dark:ring-orange-500/20 dark:hover:border-y-orange-400/50 dark:hover:border-r-orange-400/50';
}

function DueDateLegend({ t }: { t: any }) {
  const items = [
    { color: 'bg-emerald-500', label: t.legend.onTime },
    { color: 'bg-purple-500', label: t.legend.completedLate },
    { color: 'bg-orange-500', label: t.legend.activeOnTime },
    { color: 'bg-red-500', label: t.legend.activeOverdue },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-content-muted mt-2 border-t border-line-subtle/50 pt-2">
      <span className="text-xs font-bold text-content-strong me-1">{t.legend.title}</span>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${it.color}`} />{it.label}</div>
      ))}
    </div>
  );
}

/* ── Progress Bar ──────────────────────────────────────────────────── */
function ProgressBar({ tickets, locale }: { tickets: any[]; locale: Locale }) {
  const total = tickets.length;
  if (total === 0) return null;

  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const s = t.status || 'NEW';
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div className="flex w-full h-3 rounded-full overflow-hidden bg-surface-raised shadow-inner">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] || 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        const meta = getMeta(status, locale);
        return (
          <Tooltip key={status}>
            <TooltipTrigger asChild>
              <div
                className={`${meta.barColor} transition-all duration-500 relative group`}
                style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="font-bold">
              <p className="text-xs">{meta.label}: {count}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/* ── Legend ─────────────────────────────────────────────────────────── */
function Legend({ tickets, locale }: { tickets: any[]; locale: Locale }) {
  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const s = t.status || 'NEW';
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] || 0;
        if (count === 0) return null;
        const meta = getMeta(status, locale);
        return (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${meta.dot}`} />
            <span className="text-xs font-semibold text-content-muted">{meta.label}</span>
            <span className="text-xs font-bold text-content-strong">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Collapsible Section ───────────────────────────────────────────── */
function StatusSection({ status, tickets, locale, t }: { status: string; tickets: any[]; locale: Locale; t: any }) {
  const [open, setOpen] = useState(status !== 'CLOSED' && status !== 'REJECTED');
  const meta = getMeta(status, locale);
  const isAr = locale === 'ar';

  return (
    <div className={`flex-shrink-0 w-[340px] rounded-xl border ${meta.border} overflow-hidden transition-all flex flex-col bg-surface-raised/50`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${meta.bg} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-2.5">
          {open
            ? <ChevronDown className={`size-4 ${meta.color}`} />
            : <ChevronRight className={`size-4 ${meta.color} ${isAr ? 'rotate-180' : ''}`} />
          }
          <span className={`size-2 rounded-full ${meta.dot}`} />
          <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${meta.color} ${meta.bg} border ${meta.border}`}>
          {tickets.length}
        </span>
      </button>

      {open && (
        <div className="p-2.5 flex flex-col gap-2.5 bg-surface">
          {tickets.map((ticketItem: any) => {
            const requestedByName = isAr && ticketItem.requestedBy?.nameAr ? ticketItem.requestedBy.nameAr : (ticketItem.requestedBy?.nameEn || t.card.unknown);
            const requestedByDept = isAr && ticketItem.requestedBy?.department?.nameAr ? ticketItem.requestedBy.department.nameAr : (ticketItem.requestedBy?.department?.nameEn || 'N/A');
            const targetDeptName = isAr && ticketItem.targetDepartment?.nameAr ? ticketItem.targetDepartment.nameAr : (ticketItem.targetDepartment?.nameEn || 'N/A');
            const assignedEmpName = isAr && ticketItem.assignedEmployee?.nameAr ? ticketItem.assignedEmployee.nameAr : ticketItem.assignedEmployee?.nameEn;
            const assignedLabel = assignedEmpName ? t.card.assigned.replace('{name}', assignedEmpName) : t.card.unassigned;

            return (
              <Tooltip key={ticketItem.id}>
                <TooltipTrigger asChild>
                  <a
                    href={`/internal-tickets/${ticketItem.id}?locale=${locale}`}
                    className={`group flex flex-col gap-1.5 rounded-lg border-s-[4px] p-3 shadow-sm hover:shadow-md transition-all border ${getCardBorderClass(ticketItem)}`}
                    style={{ borderInlineStartColor: meta.hex }}
                  >
                    {/* Top row: status pill + ref */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.color} ${meta.bg}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-content-muted font-mono tracking-tight">{ticketItem.referenceNumber || ticketItem.id?.slice(0, 12)}</span>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm text-content-strong group-hover:text-brand transition-colors line-clamp-2 mt-0.5">
                      {ticketItem.title}
                    </h4>

                    {/* Footer */}
                    <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-line-subtle">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col min-w-0 me-2 flex-1">
                          <span className="text-[9px] font-semibold text-content-muted uppercase tracking-wider">{t.card.from}</span>
                          <span className="text-xs font-medium text-content-strong truncate">
                            {requestedByName}
                          </span>
                          <span className="text-[10px] text-content-muted truncate" title={requestedByDept}>
                            {requestedByDept}
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-0 flex-1">
                          <span className="text-[9px] font-semibold text-content-muted uppercase tracking-wider">{t.card.to}</span>
                          <span className="text-xs font-medium text-content-strong truncate text-end" title={targetDeptName}>
                            {targetDeptName}
                          </span>
                          <span className="text-[10px] text-content-muted truncate text-end">
                            {assignedLabel}
                          </span>
                        </div>
                      </div>
                      {ticketItem.dueAt && (
                        <div className="flex items-center justify-between border-t border-line-subtle/50 pt-1.5">
                          <span className="text-[9px] font-semibold text-content-muted uppercase tracking-wider">{t.card.dueDate}</span>
                          <span className={`text-xs ${getDueDateColor(ticketItem)}`}>
                            {new Date(ticketItem.dueAt).toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">{meta.desc}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Board ────────────────────────────────────────────────────── */
export function MyWorkBoard({ tickets, propLocale }: { tickets: any[]; propLocale?: Locale }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryLocale = searchParams.get('locale');
  const locale = propLocale || resolveLocale(queryLocale || (typeof document !== 'undefined' ? document.documentElement.lang : undefined));
  const t = internalTicketsText[locale] || internalTicketsText.en;

  const currentFilter = searchParams.get('filter') || 'all';
  const currentStatus = searchParams.get('status') || 'all';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    if (!params.has('locale') && locale) {
      params.set('locale', locale);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Group tickets by status
  const grouped: Record<string, any[]> = {};
  for (const ticketItem of tickets) {
    const s = ticketItem.status || 'NEW';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(ticketItem);
  }

  // Ordered sections (only those with tickets)
  const sections = STATUS_ORDER.filter((s) => grouped[s] && grouped[s].length > 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-5 w-full min-w-0 max-w-full">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-content-strong flex items-center gap-2">
            <LayoutDashboard className="size-6 text-brand" />
            {t.board.title}
          </h2>
          <p className="text-sm text-content-muted mt-1">{t.board.subtitle}</p>
        </div>
        <a
          href={`/internal-tickets/new?locale=${locale}`}
          className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 hover:bg-brand-hover hover:-translate-y-0.5 transition-all"
        >
          <PlusCircle className="size-4" />
          {t.board.createRequest}
        </a>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line-subtle bg-surface p-3 shadow-sm">
        <div className="flex items-center gap-2 me-4 text-sm font-semibold text-content-muted">
          <Filter className="size-4" />
          {t.filters.title}
        </div>
        
        <div className="flex items-center gap-1 bg-surface-canvas rounded-lg p-1 border border-line-subtle">
          {(['all', 'sent', 'received'] as const).map((f) => (
            <button key={f} onClick={() => setParam('filter', f)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${currentFilter === f ? 'bg-white shadow-sm text-brand' : 'text-content-muted hover:text-content-strong'}`}>{t.filters[f]}</button>
          ))}
        </div>
        <div className="w-px h-6 bg-line-subtle hidden sm:block" />
        <div className="flex flex-wrap items-center gap-1 bg-surface-canvas rounded-lg p-1 border border-line-subtle">
          {([
            { key: 'all', label: t.filters.statusAll, color: 'text-brand' },
            { key: 'active', label: t.filters.active, color: 'text-brand' },
            { key: 'pending', label: t.filters.pending, color: 'text-brand' },
            { key: 'on-time', label: t.filters.onTime, color: 'text-status-success' },
            { key: 'overdue', label: t.filters.overdue, color: 'text-status-error' },
            { key: 'completed', label: t.filters.completed, color: 'text-brand' },
          ] as const).map(({ key, label, color }) => (
            <button key={key} onClick={() => setParam('status', key)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${currentStatus === key ? `bg-white shadow-sm ${color}` : 'text-content-muted hover:text-content-strong'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-line-subtle bg-surface-raised/30 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-content-strong">{t.board.pipeline}</h3>
          <span className="text-xs font-semibold text-content-muted">{t.board.total.replace('{count}', String(tickets.length))}</span>
        </div>
        <ProgressBar tickets={tickets} locale={locale} />
        <Legend tickets={tickets} locale={locale} />
        <DueDateLegend t={t} />
      </div>

      {/* Collapsible status sections */}
      {sections.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-subtle bg-surface-canvas p-14 flex flex-col items-center text-center">
          <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <svg className="size-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-content-strong text-lg">{t.board.emptyTitle}</p>
          <p className="text-sm text-content-muted mt-1">{t.board.emptySubtitle}</p>
        </div>
      ) : (
        <div className="w-full min-w-0 max-w-full rounded-3xl border border-line-subtle bg-surface-canvas/60 p-4 shadow-sm flex flex-col overflow-hidden">
          <div className="flex overflow-x-auto gap-4 pb-4 items-start min-w-0 max-w-full">
            {sections.map((status) => (
              <StatusSection key={status} status={status} tickets={grouped[status] || []} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

