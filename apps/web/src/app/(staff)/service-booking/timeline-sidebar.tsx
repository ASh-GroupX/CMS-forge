'use client';

import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { useServiceBooking } from './service-booking-context';

export function TimelineSidebar() {
  const {
    appointments,
    branches,
    locale,
    selectedBranchId,
    selectedDate,
    setSelectedDate,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const currentObj = new Date(`${selectedDate}T00:00:00Z`);
  const year = currentObj.getUTCFullYear();
  const month = currentObj.getUTCMonth();

  // Mini calendar generator
  const firstDayIndex = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthName = currentObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const handleMiniMonthChange = (offset: number) => {
    const next = new Date(Date.UTC(year, month + offset, 1));
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  // Compute daily booked count
  const dailyBooked = appointments.filter(
    (a) =>
      a.date === selectedDate &&
      a.status !== 'CANCELLED' &&
      (selectedBranchId === 'ALL' || a.branchId === selectedBranchId),
  ).length;

  const dayOfWeek = currentObj.getUTCDay();
  const isWeekend = dayOfWeek === 5; // Friday closed

  const weekDayLabels = isAr
    ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <aside className="flex flex-col gap-5 w-full lg:w-72 shrink-0">
      {/* Mini Calendar Card */}
      <div className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-content-strong">
            <CalendarIcon className="size-4 text-brand" />
            <span>{monthName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous Month"
              className="rounded p-1 text-content-muted hover:bg-surface-canvas hover:text-content-strong"
              onClick={() => handleMiniMonthChange(-1)}
              type="button"
            >
              {isAr ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
            </button>
            <button
              aria-label="Next Month"
              className="rounded p-1 text-content-muted hover:bg-surface-canvas hover:text-content-strong"
              onClick={() => handleMiniMonthChange(1)}
              type="button"
            >
              {isAr ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-content-muted mb-1">
          {weekDayLabels.map((lbl, idx) => (
            <div className={idx === 5 ? 'text-rose-500' : ''} key={idx}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {days.map((dayNum, idx) => {
            if (!dayNum) return <div key={`empty-${idx}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const hasApts = appointments.some(
              (a) =>
                a.date === dateStr &&
                a.status !== 'CANCELLED' &&
                (selectedBranchId === 'ALL' || a.branchId === selectedBranchId),
            );

            return (
              <button
                className={`relative flex size-8 items-center justify-center rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-brand font-bold text-primary-foreground shadow-sm'
                    : 'text-content-strong hover:bg-surface-canvas'
                }`}
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                type="button"
              >
                <span>{dayNum}</span>
                {hasApts && !isSelected && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workshop Daily Capacity Card */}
      <div className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-muted mb-3">
          <Clock className="size-3.5 text-brand" />
          <span>{t.dailyStats.title}</span>
        </h3>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-xl border border-line-subtle bg-surface-canvas/50 p-2.5">
            <span className="text-xs text-content-muted">{t.dailyStats.totalBooked}</span>
            <span className="text-sm font-bold text-content-strong">{dailyBooked}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-subtle bg-surface-canvas/50 p-2.5">
            <span className="text-xs text-content-muted">{t.dailyStats.status}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isWeekend
                  ? 'bg-status-error-bg text-status-error'
                  : 'bg-status-success-bg text-status-success'
              }`}
            >
              {isWeekend ? t.dailyStats.closed : t.dailyStats.open}
            </span>
          </div>
        </div>
      </div>

      {/* Capacity & Slot Legend */}
      <div className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-muted mb-3">
          <Info className="size-3.5 text-brand" />
          <span>{t.legend.title}</span>
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl border border-status-success-border bg-status-success-bg/40 p-2">
            <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-status-success ring-4 ring-status-success/20" />
            <div>
              <p className="font-semibold text-status-success">
                {t.legend.available}
              </p>
              <p className="text-[11px] text-content-muted">{t.legend.availableDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-status-warning-border bg-status-warning-bg/40 p-2">
            <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-status-warning ring-4 ring-status-warning/20" />
            <div>
              <p className="font-semibold text-status-warning">
                {t.legend.partial}
              </p>
              <p className="text-[11px] text-content-muted">{t.legend.partialDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-status-error-border bg-status-error-bg/40 p-2">
            <span className="mt-0.5 size-2.5 shrink-0 rounded-full bg-status-error ring-4 ring-status-error/20" />
            <div>
              <p className="font-semibold text-status-error">
                {t.legend.full}
              </p>
              <p className="text-[11px] text-content-muted">{t.legend.fullDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
