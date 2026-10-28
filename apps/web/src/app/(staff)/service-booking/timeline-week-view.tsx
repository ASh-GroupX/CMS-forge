'use client';

import React from 'react';
import { Calendar, Plus, Wrench } from 'lucide-react';
import { useServiceBooking } from './service-booking-context';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';

export function TimelineWeekView() {
  const {
    appointments,
    branches,
    locale,
    openNewModalWithSlot,
    selectedBranchId,
    selectedDate,
    setIsDetailModalOpen,
    setSelectedAppointment,
    setSelectedDate,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const currentDate = new Date(`${selectedDate}T00:00:00Z`);
  const dayOfWeek = currentDate.getUTCDay();

  // Start week on Sunday
  const startOfWeek = new Date(currentDate);
  startOfWeek.setUTCDate(currentDate.getUTCDate() - dayOfWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setUTCDate(startOfWeek.getUTCDate() + i);
    return d;
  });

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

  const weekApts = appointments.filter(
    (a) => a.status !== 'CANCELLED' && matchesSelectedBranch(a),
  );

  const defaultBranchId = selectedBranchId === 'ALL' ? branches[0]?.id || '' : selectedBranchId;

  return (
    <div className="rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-line-subtle border-b border-line-subtle bg-surface-canvas/60 text-center">
        {weekDays.map((dateObj, i) => {
          const dateStr = dateObj.toISOString().slice(0, 10);
          const isSelected = dateStr === selectedDate;
          const isFriday = dateObj.getUTCDay() === 5;
          const dayApts = weekApts.filter((a) => {
            const aDate = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10);
            return aDate === dateStr;
          });

          const dayName = dateObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            weekday: 'short',
            timeZone: 'UTC',
          });
          const dayNum = dateObj.getUTCDate();

          return (
            <div
              className={`p-3 transition-colors ${
                isSelected ? 'bg-brand/10' : ''
              } ${isFriday ? 'bg-rose-500/[0.04]' : ''}`}
              key={dateStr}
            >
              <p className="text-xs font-semibold text-content-muted">{dayName}</p>
              <button
                className={`mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-bold transition-transform hover:scale-105 ${
                  isSelected
                    ? 'bg-brand text-primary-foreground shadow-sm'
                    : 'text-content-strong'
                }`}
                onClick={() => setSelectedDate(dateStr)}
                type="button"
              >
                {dayNum}
              </button>
              <div className="mt-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFriday
                      ? 'bg-rose-500/10 text-rose-600'
                      : dayApts.length >= 24
                        ? 'bg-rose-500/10 text-rose-600'
                        : dayApts.length > 0
                          ? 'bg-brand/10 text-brand'
                          : 'bg-surface-sunken text-content-muted'
                  }`}
                >
                  {isFriday ? t.dailyStats.closed : `${dayApts.length} apts`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Columns Grid */}
      <div className="grid grid-cols-7 divide-x divide-line-subtle min-h-[30rem] bg-surface">
        {weekDays.map((dateObj) => {
          const dateStr = dateObj.toISOString().slice(0, 10);
          const isFriday = dateObj.getUTCDay() === 5;
          const dayApts = weekApts
            .filter((a) => a.date === dateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              className={`flex flex-col p-2 space-y-2 ${
                isFriday ? 'bg-rose-500/[0.02]' : ''
              }`}
              key={dateStr}
            >
              {isFriday ? (
                <div className="flex h-32 items-center justify-center text-center text-xs font-medium text-content-muted/60">
                  {t.dailyStats.closed}
                </div>
              ) : (
                <>
                  {dayApts.map((apt) => (
                    <button
                      className="w-full text-start rounded-xl border border-line-subtle bg-surface-canvas/50 p-2.5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setIsDetailModalOpen(true);
                      }}
                      type="button"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-brand">{apt.startTime}</span>
                        <span className="rounded bg-surface-sunken px-1 text-[9px] font-bold">
                          {apt.durationMinutes}m
                        </span>
                      </div>
                      <p className="mt-1 font-bold text-xs truncate text-content-strong">
                        {apt.customerName}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-content-muted truncate">
                        <Wrench className="size-2.5 text-brand shrink-0" />
                        <span className="truncate">{apt.maintenanceTypeName}</span>
                      </div>
                      <p className="text-[10px] text-content-muted truncate font-medium">
                        {apt.carModelName}
                      </p>
                    </button>
                  ))}

                  <button
                    className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line-subtle py-2 text-xs font-medium text-content-muted transition-colors hover:border-brand hover:text-brand"
                    onClick={() =>
                      openNewModalWithSlot({
                        branchId: defaultBranchId,
                        date: dateStr,
                        time: '09:00',
                      })
                    }
                    type="button"
                  >
                    <Plus className="size-3.5" />
                    <span>{t.timeline.emptySlot}</span>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
