'use client';

import React from 'react';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { ServiceBookingCopy } from '../../../i18n/staff-service-booking';
import type { ServiceAppointment, SlotAvailability } from '../../../lib/staff-service-bookings-api';
import { appointmentStatusStyle } from './service-booking-utils';

export function TimelineSlotContent({
  appointments,
  capacity,
  mayAdd,
  onAdd,
  onSelect,
  timeline,
}: {
  appointments: ServiceAppointment[];
  capacity: SlotAvailability | undefined;
  mayAdd: boolean;
  onAdd: () => void;
  onSelect: (appointment: ServiceAppointment) => void;
  timeline: ServiceBookingCopy['timeline'];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {capacity && (
        <div className="flex justify-start">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
            capacity.remainingInSlot === 0
              ? 'bg-status-error-bg text-status-error'
              : capacity.bookedCount > 0
                ? 'bg-status-warning-bg text-status-warning'
                : 'bg-status-success-bg text-status-success'
          }`}>
            {timeline.slotOccupancy}: {capacity.bookedCount}/{capacity.maxPerSlot}
          </span>
        </div>
      )}
      {appointments.map((appointment, index) => (
        <button
          aria-label={`${timeline.appointment} ${index + 1}: ${appointment.customerName}, ${appointment.startTime}`}
          className={`w-full text-start rounded-xl border p-2.5 shadow-sm transition-all hover:shadow-md ${appointmentStatusStyle(appointment.status)}`}
          key={appointment.id}
          onClick={() => onSelect(appointment)}
          type="button"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-xs truncate">{appointment.customerName}</span>
            <span className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold">
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-content-muted">
            <Wrench className="size-3 text-brand" />
            <span className="truncate">{appointment.maintenanceTypeName}</span>
            <span>•</span>
            <span className="font-medium truncate">{appointment.carModelName}</span>
          </div>
        </button>
      ))}
      {mayAdd && capacity && (
        <Button
          className="h-8 w-full justify-center gap-1 rounded-lg border-dashed border-brand/40 bg-brand/[0.04] text-xs font-semibold text-brand hover:bg-brand/10"
          onClick={onAdd}
          title={timeline.addAppointment}
          type="button"
        >
          <Plus className="size-3.5" />
          <span>{timeline.addAppointment} · {capacity.bookedCount}/{capacity.maxPerSlot}</span>
        </Button>
      )}
    </div>
  );
}
