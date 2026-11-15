'use client';

import React from 'react';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { ServiceBookingCopy } from '../../../i18n/staff-service-booking';
import type { ServiceAppointment, SlotAvailability } from '../../../lib/staff-service-bookings-api';
import { laneColor, laneColors } from '../../../lib/booking-lane-colors';
import { appointmentStatusStyle, maintenanceLabel } from './service-booking-utils';

export function TimelineSlotContent({
  appointments,
  blockedReason,
  capacity,
  mayAdd,
  onAdd,
  onSelect,
  slotTime,
  timeline,
  locale,
  periodicName,
  cancelledLabel,
  laneColor: configuredLaneColor,
  statusLabels,
}: {
  appointments: ServiceAppointment[];
  blockedReason: string | undefined;
  capacity: SlotAvailability | undefined;
  mayAdd: boolean;
  onAdd: () => void;
  onSelect: (appointment: ServiceAppointment) => void;
  slotTime: string;
  timeline: ServiceBookingCopy['timeline'];
  locale: 'en' | 'ar';
  periodicName: string;
  cancelledLabel: string;
  laneColor: string;
  statusLabels: ServiceBookingCopy['status'];
}) {
  const color = laneColor(configuredLaneColor);
  const statusDots = { BOOKED: 'bg-sky-500', CONFIRMED: 'bg-sky-600', IN_SERVICE: 'bg-status-warning',
    COMPLETED: 'bg-status-success', CANCELLED: 'bg-status-error', NO_SHOW: 'bg-violet-600' } as const;
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex h-6 min-w-0 items-center justify-between gap-2 text-[11px]">
        <span className="shrink-0 font-semibold tabular-nums text-content-muted">{slotTime}</span>
        {capacity ? (
          <span className={`max-w-[75%] truncate whitespace-nowrap rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
            capacity.status === 'FULL'
              ? 'bg-status-error-bg text-status-error'
              : blockedReason ? 'bg-surface-sunken text-content-muted'
              : capacity.bookedCount > 0
                ? 'bg-status-warning-bg text-status-warning'
                : 'bg-status-success-bg text-status-success'
          }`} title={blockedReason}>
            {timeline.slotOccupancy}: {capacity.bookedCount}/{capacity.maxPerSlot}
            {blockedReason ? ` · ${blockedReason}` : ''}
          </span>
        ) : <span className="truncate text-content-muted">{timeline.loadingAvailability}</span>}
      </div>
      <div className="flex min-w-0 items-stretch gap-2" dir="ltr">
        {mayAdd && capacity && (
          <Button
            aria-label={`${timeline.addAppointment} ${slotTime}`}
            className="h-[4.5rem] w-10 shrink-0 rounded-lg border border-dashed border-brand/50 bg-brand/[0.06] text-brand hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-brand"
            onClick={onAdd}
            title={`${timeline.addAppointment} ${slotTime}`}
            type="button"
          >
            <Plus className="size-4" />
          </Button>
        )}
        <div aria-label={`${slotTime} ${timeline.appointment}`} className="flex h-[4.5rem] min-w-0 flex-1 items-start gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" role="region" tabIndex={0}>
          {appointments.map((appointment, index) => (
            <button
              aria-label={`${timeline.appointment} ${index + 1}: ${appointment.customerName}, ${appointment.startTime}, ${statusLabels[appointment.status]}`}
              className={`h-[4rem] min-w-44 max-w-52 shrink-0 rounded-lg border border-s-4 p-2 text-start text-content-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${laneColors[color].stripe} ${appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW' ? appointmentStatusStyle(appointment.status) : laneColors[color].card}`}
              data-lane-color={color}
              dir="auto"
              key={appointment.id}
              onClick={() => onSelect(appointment)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5"><span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${statusDots[appointment.status]}`} title={statusLabels[appointment.status]} /><span className="truncate text-xs font-semibold">{appointment.customerName}</span></span>
                <span className="shrink-0 text-[10px] font-medium tabular-nums">{appointment.startTime}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-content-muted">
                <Wrench className="size-3 shrink-0 text-brand" />
                <span className="truncate">{maintenanceLabel(appointment, locale, periodicName)}</span>
              </div>
              {appointment.status === 'CANCELLED'
                ? <span className="inline-block rounded bg-status-error-bg px-1.5 text-[10px] font-bold text-status-error">{cancelledLabel}</span>
                : <span className="block truncate text-[10px] text-content-muted">{appointment.carModelName}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
