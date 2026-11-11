'use client';

import React from 'react';
import { Calendar, Wrench } from 'lucide-react';
import { useServiceBooking } from './service-booking-context';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';
import { maintenanceLabel } from './service-booking-utils';

export function TimelineMonthView() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const {
    appointments,
    branches,
    locale,
    selectedBranchId,
    selectedDate,
    setSelectedDate,
    setView,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  React.useEffect(() => {
    scrollRef.current?.querySelector('[data-selected-date="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedDate]);
  const currentObj = new Date(`${selectedDate}T00:00:00Z`);
  const year = currentObj.getUTCFullYear();
  const month = currentObj.getUTCMonth();

  const firstDayIndex = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const weekDayLabels = isAr
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const matchesSelectedBranch = (a: ServiceAppointment) => {
    if (selectedBranchId === 'ALL') return true;
    const target = a.branchId || a.serviceCenterId || '';
    if (target === selectedBranchId) return true;
    const selectedBranch = branches.find((b) => b.id === selectedBranchId);
    if (selectedBranch?.code && target === selectedBranch.code) return true;
    if ((selectedBranchId === 'center_main' || selectedBranch?.code === 'MAIN_CENTER') && (target === 'center_main' || target === 'MAIN_CENTER')) return true;
    if ((selectedBranchId === 'center_north' || selectedBranch?.code === 'NORTH_CENTER') && (target === 'center_north' || target === 'NORTH_CENTER')) return true;
    return false;
  };

  const monthApts = appointments.filter(
    (a) => matchesSelectedBranch(a),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-line-subtle bg-surface shadow-sm" ref={scrollRef}>
      <div className="min-w-[980px]">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 divide-x divide-line-subtle border-b border-line-subtle bg-surface-canvas/60 text-center font-bold text-xs text-content-muted">
        {weekDayLabels.map((lbl, idx) => (
          <div className={`p-3 ${idx === 5 ? 'text-rose-500' : ''}`} key={idx}>
            {lbl}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-line-subtle bg-surface">
        {days.map((dayNum, idx) => {
          if (!dayNum) {
            return (
              <div
                className="min-h-[7rem] bg-surface-canvas/20 p-2"
                key={`empty-${idx}`}
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const isFriday = new Date(Date.UTC(year, month, dayNum)).getUTCDay() === 5;
          const dayApts = monthApts.filter((a) => {
            const aDate = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10);
            return aDate === dateStr;
          });

          return (
            <div
              className={`group min-h-[7.5rem] p-2 transition-all hover:bg-surface-canvas/40 cursor-pointer ${
                isSelected ? 'bg-brand/5' : ''
              } ${isFriday ? 'bg-rose-500/[0.02]' : ''}`}
              data-selected-date={isSelected}
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setView('day');
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? 'bg-brand text-primary-foreground'
                      : isFriday
                        ? 'text-rose-500'
                        : 'text-content-strong'
                  }`}
                >
                  {dayNum}
                </span>

                {dayApts.length > 0 && (
                  <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                    {dayApts.length}
                  </span>
                )}
              </div>

              {/* Preview top 2 appointments */}
              <div className="space-y-1">
                {isFriday && dayApts.length === 0 ? (
                  <p className="text-[10px] text-content-muted italic">
                    {t.dailyStats.closed}
                  </p>
                ) : (
                  <>
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium text-content-strong shadow-2xs ${apt.status === 'CANCELLED' ? 'border-status-error-border bg-status-error-bg/40' : 'border-line-subtle/80 bg-surface-canvas'}`}
                        key={apt.id}
                        title={`${apt.startTime} - ${apt.customerName} (${maintenanceLabel(apt, locale, t.modal.periodicMaintenance)})`}
                      >
                        <span className="font-semibold text-brand me-1">
                          {apt.startTime}
                        </span>
                        <span className="truncate">{apt.customerName}</span>
                        {apt.status === 'CANCELLED' && <span className="block font-bold text-status-error">{t.status.CANCELLED}</span>}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <p className="text-[9px] font-semibold text-content-muted ps-1">
                        +{dayApts.length - 2} more
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
