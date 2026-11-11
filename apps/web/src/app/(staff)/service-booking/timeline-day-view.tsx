'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useServiceBooking } from './service-booking-context';
import {
  getNowTimeParts,
  getTodayDateString,
  matchesBranch,
} from './service-booking-utils';
import { TimelineSlotContent } from './timeline-slot-content';
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
    slotAvailability,
    setIsDetailModalOpen,
    setSelectedAppointment,
    t,
    userRules,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const todayAmman = getTodayDateString();
  const nowParts = getNowTimeParts();
  const currentTime = `${String(nowParts.hour).padStart(2, '0')}:${String(nowParts.minute).padStart(2, '0')}`;
  const isToday =
    selectedDate === todayAmman ||
    selectedDate === new Date().toLocaleDateString('en-CA') ||
    selectedDate === new Date().toISOString().slice(0, 10);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const scrolledDateRef = useRef<string | null>(null);

  const [markerTop, setMarkerTop] = useState<number | null>(null);
  const [formattedNowTime, setFormattedNowTime] = useState<string>('');
  const [showPastHours, setShowPastHours] = useState(false);
  const pastHourCount = selectedDate < todayAmman ? HOURS.length
    : selectedDate === todayAmman ? HOURS.filter((hour) => hour < nowParts.hour).length : 0;

  useEffect(() => { setShowPastHours(false); }, [selectedDate]);

  const updateMarkerPosition = useCallback(() => {
    const { hour, minute } = getNowTimeParts();
    const now = new Date();

    const timeStr = now.toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setFormattedNowTime(timeStr);

    const container = timelineContainerRef.current;
    if (!container) return;
    if (!isToday) { setMarkerTop(null); return; }

    if (hour < 8) {
      const firstRow = container.querySelector('[data-hour="8"]') as HTMLElement | null;
      if (firstRow) {
        setMarkerTop(firstRow.offsetTop);
      }
      return;
    }

    if (hour >= 18) {
      const lastRow = container.querySelector('[data-hour="17"]') as HTMLElement | null;
      if (lastRow) {
        setMarkerTop(lastRow.offsetTop + lastRow.offsetHeight);
      } else setMarkerTop(null);
      return;
    }

    const rowEl = container.querySelector(`[data-hour="${hour}"]`) as HTMLElement | null;
    if (rowEl) {
      const top = rowEl.offsetTop + (minute / 60) * rowEl.offsetHeight;
      setMarkerTop(Math.round(top));
    }
  }, [isAr, isToday]);

  useEffect(() => {
    updateMarkerPosition();
    const interval = setInterval(updateMarkerPosition, 30000);

    const container = timelineContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateMarkerPosition());
      observer.observe(container);
    }

    return () => {
      clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, [updateMarkerPosition, appointments, selectedBranchId, showPastHours]);

  // Auto-scroll to the red line marker when today's view is opened or navigated to
  useEffect(() => {
    if (!isToday) {
      scrolledDateRef.current = null;
      return;
    }

    if (markerTop !== null && scrolledDateRef.current !== selectedDate) {
      scrolledDateRef.current = selectedDate;

      const timer = setTimeout(() => {
        const el = markerRef.current || document.getElementById('timeline-current-time-marker');
        try {
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          el?.scrollIntoView(true);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isToday, markerTop, selectedDate]);

  const activeBranches =
    selectedBranchId === 'ALL'
      ? branches
      : branches.filter((b) => b.id === selectedBranchId || b.code === selectedBranchId);

  // Group appointments by branch with normalized date comparison
  const dateAppointments = appointments.filter((a) => {
    const aDate = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10);
    return aDate === selectedDate;
  });
  const hiddenCancelledCount = dateAppointments.filter((appointment) =>
    appointment.status === 'CANCELLED' &&
    activeBranches.some((branch) => matchesBranch(appointment, branch)) &&
    (selectedDate < todayAmman || Number(appointment.startTime.slice(0, 2)) < nowParts.hour),
  ).length;

  return (
    <div className="relative flex flex-col rounded-2xl border border-line-subtle bg-surface shadow-sm overflow-hidden">
      {/* Branch Headers */}
      <div className="grid grid-cols-[4.5rem_1fr] border-b border-line-subtle bg-surface-canvas/60">
        <div className="p-3 text-center text-xs font-semibold text-content-muted">
          {t.timeline.time}
        </div>
        <div
          className="grid divide-x divide-line-subtle"
          style={{ gridTemplateColumns: `repeat(${Math.max(activeBranches.length, 1)}, minmax(0, 1fr))` }}
        >
          {activeBranches.map((b) => (
            <div className="p-3 text-center font-bold text-sm text-content-strong flex items-center justify-center gap-2" key={b.id}>
              <span>{isAr ? b.nameAr : b.nameEn}</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                {dateAppointments.filter((a) => matchesBranch(a, b)).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div ref={timelineContainerRef} className="relative divide-y divide-line-subtle/70 overflow-x-auto">
        {pastHourCount > 0 && <Button aria-expanded={showPastHours}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-none border-b border-line-subtle bg-surface-canvas/60 text-xs font-semibold text-content-strong hover:bg-surface-canvas focus-visible:ring-2 focus-visible:ring-brand"
          onClick={() => setShowPastHours((visible) => !visible)} type="button" variant="ghost">
          <ChevronDown className={`size-4 transition-transform ${showPastHours ? 'rotate-180' : ''}`} />
          {showPastHours ? t.timeline.hidePastHours : t.timeline.showPastHours.replace('{count}', String(pastHourCount))}
          {!showPastHours && hiddenCancelledCount > 0 && <span className="rounded-full bg-status-error-bg px-2 py-0.5 text-status-error">{hiddenCancelledCount} {t.status.CANCELLED}</span>}
        </Button>}
        {/* Live Red Current Time Marker */}
        {isToday && markerTop !== null && (
          <div
            id="timeline-current-time-marker"
            ref={markerRef}
            className="pointer-events-none absolute inset-x-0 z-30 flex -translate-y-1/2 items-center transition-[top] duration-300 ease-out"
            style={{
              top: `${markerTop}px`,
            }}
          >
            <div className="size-3.5 rounded-full bg-rose-500 ring-4 ring-rose-500/30 -ms-1.5 shadow-md animate-pulse" />
            <div className="h-0.5 flex-1 bg-rose-500 shadow-sm" />
            <span className="rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md me-3 whitespace-nowrap tracking-wide flex items-center gap-1.5">
              <Clock className="size-3" />
              <span>{t.timeline.now}{formattedNowTime ? ` • ${formattedNowTime}` : ''}</span>
            </span>
          </div>
        )}

        {HOURS.filter((hour) => showPastHours || selectedDate > todayAmman || (selectedDate === todayAmman && hour >= nowParts.hour)).map((hour) => {
          const hourKey = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div className="grid grid-cols-[4.5rem_1fr] min-h-[7rem]" key={hour} data-hour={hour}>
              {/* Hour Label */}
              <div className="border-e border-line-subtle/80 bg-surface-canvas/30 p-2 text-center text-xs font-semibold text-content-muted">
                {hourKey}
              </div>

              {/* Branch Columns */}
              <div
                className="grid divide-x divide-line-subtle"
                style={{ gridTemplateColumns: `repeat(${Math.max(activeBranches.length, 1)}, minmax(0, 1fr))` }}
              >
                {activeBranches.map((branch) => {
                  const branchHourApts = dateAppointments.filter(
                    (a) =>
                      matchesBranch(a, branch) &&
                      a.startTime.startsWith(String(hour).padStart(2, '0')),
                  );
                  const availability = slotAvailability[branch.id];
                  const hourLimit = availability?.slots.find((slot) => slot.hour === `${String(hour).padStart(2, '0')}:00`)?.maxPerHour;
                  const activeHourCount = branchHourApts.filter((apt) => apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW').length;
                  const isHourFull = hourLimit !== undefined && activeHourCount >= hourLimit;
                  const isHourPartial = activeHourCount > 0 && !isHourFull;

                  return (
                    <div className="relative flex flex-col divide-y divide-line-subtle/30" key={branch.id}>
                      {/* Hour Capacity Badge */}
                      <div className="flex h-6 items-center justify-end gap-1 border-b border-line-subtle/30 px-2 text-[10px] font-bold">
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
                          {activeHourCount}/{hourLimit ?? '—'}
                        </span>
                      </div>

                      {/* 4 x 15-minute slots */}
                      {SLOTS_PER_HOUR.map((slotMin) => {
                        const timeStr = `${String(hour).padStart(2, '0')}:${slotMin}`;
                        const slotApts = dateAppointments.filter(
                          (a) => matchesBranch(a, branch) && a.startTime === timeStr,
                        );
                        const slotCapacity = availability?.slots.find((slot) => slot.slot === timeStr);
                        const isPastSlot = selectedDate < todayAmman || (selectedDate === todayAmman && timeStr < currentTime);
                        const mayAdd = userRules.canCreateBookings && !isPastSlot && !!slotCapacity &&
                          slotCapacity.remainingInSlot > 0 && slotCapacity.remainingInHour > 0 &&
                          availability!.bookedDailyCount < availability!.maxDailyAppointments;
                        const blockedReason = slotCapacity?.remainingInSlot === 0 ? t.timeline.slotFull
                          : slotCapacity?.remainingInHour === 0 ? t.timeline.hourFull
                          : availability && availability.bookedDailyCount >= availability.maxDailyAppointments ? t.timeline.dayFull
                          : isPastSlot ? t.modal.pastTime : !userRules.canCreateBookings ? t.timeline.noCreatePermission : undefined;

                        return (
                          <div
                            className={`group relative min-h-[1.75rem] shrink-0 px-2 py-1 transition-colors ${
                              isHourFull
                                ? 'bg-status-error-bg/40'
                                : isHourPartial
                                  ? 'bg-status-warning-bg/40'
                                  : 'hover:bg-brand/[0.03]'
                            }`}
                            data-branch-id={branch.id}
                            data-slot-time={timeStr}
                            key={slotMin}
                          >
                            <TimelineSlotContent
                              appointments={slotApts}
                              blockedReason={blockedReason}
                              capacity={slotCapacity}
                              mayAdd={mayAdd}
                              onAdd={() => openNewModalWithSlot({ branchId: branch.id, date: selectedDate, time: timeStr })}
                              onSelect={(appointment) => {
                                setSelectedAppointment(appointment);
                                setIsDetailModalOpen(true);
                              }}
                              slotTime={timeStr}
                              timeline={t.timeline}
                              locale={locale}
                              periodicName={t.modal.periodicMaintenance}
                              cancelledLabel={t.status.CANCELLED}
                            />
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
