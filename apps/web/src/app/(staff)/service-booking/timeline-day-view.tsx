'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Plus, User, Wrench } from 'lucide-react';
import { useServiceBooking } from './service-booking-context';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 to 17:00 (ends 18:00)
const SLOTS_PER_HOUR = ['00', '15', '30', '45'];

export function TimelineDayView() {
  const {
    appointments,
    branches,
    locale,
    openNewModalWithSlot,
    selectedBranchId,
    selectedDate,
    setIsDetailModalOpen,
    setSelectedAppointment,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      // Only show between 08:00 and 18:00
      if (mins >= 8 * 60 && mins <= 18 * 60) {
        setCurrentMinutes(mins);
      } else {
        setCurrentMinutes(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeBranches =
    selectedBranchId === 'ALL'
      ? branches
      : branches.filter((b) => b.id === selectedBranchId);

  // Group appointments by branch
  const dateAppointments = appointments.filter(
    (a) => a.date === selectedDate && a.status !== 'CANCELLED',
  );

  return (
    <div className="relative flex flex-col rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
      {/* Branch Headers */}
      <div className="grid grid-cols-[4.5rem_1fr] border-b border-line-subtle bg-surface-canvas/60">
        <div className="p-3 text-center text-xs font-semibold text-content-muted">
          {t.timeline.time}
        </div>
        <div className={`grid grid-cols-${activeBranches.length} divide-x divide-line-subtle`}>
          {activeBranches.map((b) => (
            <div className="p-3 text-center font-bold text-sm text-content-strong flex items-center justify-center gap-2" key={b.id}>
              <span>{isAr ? b.nameAr : b.nameEn}</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                {dateAppointments.filter((a) => a.branchId === b.id).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative divide-y divide-line-subtle/70 overflow-x-auto">
        {/* Live Red Current Time Marker */}
        {isToday && currentMinutes !== null && (
          <div
            className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
            style={{
              top: `${((currentMinutes - 8 * 60) / 60) * 112 + 4}px`, // 112px per hour
            }}
          >
            <div className="size-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/25 -ms-1" />
            <div className="h-0.5 flex-1 bg-rose-500 shadow-sm" />
            <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm me-2">
              {t.timeline.now}
            </span>
          </div>
        )}

        {HOURS.map((hour) => {
          const hourKey = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div className="grid grid-cols-[4.5rem_1fr] min-h-[7rem]" key={hour}>
              {/* Hour Label */}
              <div className="border-e border-line-subtle/80 bg-surface-canvas/30 p-2 text-center text-xs font-semibold text-content-muted">
                {hourKey}
              </div>

              {/* Branch Columns */}
              <div className={`grid grid-cols-${activeBranches.length} divide-x divide-line-subtle`}>
                {activeBranches.map((branch) => {
                  const branchHourApts = dateAppointments.filter(
                    (a) =>
                      a.branchId === branch.id &&
                      a.startTime.startsWith(String(hour).padStart(2, '0')),
                  );
                  const isHourFull = branchHourApts.length >= 3;
                  const isHourPartial = branchHourApts.length > 0 && !isHourFull;

                  return (
                    <div className="relative flex flex-col divide-y divide-line-subtle/30" key={branch.id}>
                      {/* Hour Capacity Badge */}
                      <div className="absolute top-1 end-1 z-10 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                        <span
                          className={`size-1.5 rounded-full ${
                            isHourFull
                              ? 'bg-status-error'
                              : isHourPartial
                                ? 'bg-status-warning'
                                : 'bg-status-success'
                          }`}
                        />
                        <span className="text-content-muted">
                          {branchHourApts.length}/3
                        </span>
                      </div>

                      {/* 4 x 15-minute slots */}
                      {SLOTS_PER_HOUR.map((slotMin) => {
                        const timeStr = `${String(hour).padStart(2, '0')}:${slotMin}`;
                        const slotApt = dateAppointments.find(
                          (a) => a.branchId === branch.id && a.startTime === timeStr,
                        );

                        return (
                          <div
                            className={`group relative min-h-[1.75rem] flex-1 px-2 py-1 transition-colors ${
                              isHourFull
                                ? 'bg-status-error-bg/40'
                                : isHourPartial
                                  ? 'bg-status-warning-bg/40'
                                  : 'hover:bg-brand/[0.03]'
                            }`}
                            key={slotMin}
                          >
                            {slotApt ? (
                              <button
                                className={`w-full text-start rounded-xl border p-2.5 shadow-sm transition-all hover:shadow-md ${statusStyle(
                                  slotApt.status,
                                )}`}
                                onClick={() => {
                                  setSelectedAppointment(slotApt);
                                  setIsDetailModalOpen(true);
                                }}
                                type="button"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs truncate">
                                    {slotApt.customerName}
                                  </span>
                                  <span className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold">
                                    {slotApt.startTime} - {slotApt.endTime}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-content-muted">
                                  <Wrench className="size-3 text-brand" />
                                  <span className="truncate">{slotApt.maintenanceTypeName}</span>
                                  <span>•</span>
                                  <span className="font-medium truncate">{slotApt.carModelName}</span>
                                </div>
                              </button>
                            ) : (
                              <button
                                className={`flex size-full items-center justify-center opacity-0 group-hover:opacity-100 rounded text-xs transition-opacity ${
                                  isHourFull
                                    ? 'cursor-not-allowed text-status-error'
                                    : 'text-brand hover:bg-brand/10'
                                }`}
                                disabled={isHourFull}
                                onClick={() =>
                                  openNewModalWithSlot({
                                    branchId: branch.id,
                                    date: selectedDate,
                                    time: timeStr,
                                  })
                                }
                                title={isHourFull ? t.timeline.hourFull : t.timeline.emptySlot}
                                type="button"
                              >
                                <Plus className="size-3.5" />
                                <span className="ms-1 text-[11px] font-medium">
                                  {isHourFull ? t.timeline.hourFull : timeStr}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusStyle(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100';
    case 'IN_SERVICE':
      return 'border-status-warning-border bg-status-warning-bg text-status-warning ring-1 ring-status-warning-border';
    case 'COMPLETED':
      return 'border-status-success-border bg-status-success-bg text-status-success';
    case 'CANCELLED':
      return 'border-status-error-border bg-status-error-bg text-status-error line-through';
    case 'NO_SHOW':
      return 'border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-200';
    default: // BOOKED
      return 'border-brand/30 bg-brand/10 text-brand dark:text-brand-foreground';
  }
}
