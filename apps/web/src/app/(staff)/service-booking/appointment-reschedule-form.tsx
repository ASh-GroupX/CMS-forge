'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { rescheduleAppointmentAction } from './actions';
import type { BranchOption } from './service-booking-context';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';
import type { ServiceBookingCopy } from '../../../i18n/staff-service-booking';

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  for (const m of ['00', '15', '30', '45']) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

export function AppointmentRescheduleForm({
  appointment,
  branches,
  isAr,
  onSuccess,
  t,
}: {
  appointment: ServiceAppointment;
  branches: BranchOption[];
  isAr: boolean;
  onSuccess: (updated: ServiceAppointment) => void;
  t: ServiceBookingCopy;
}) {
  const initialCenter = appointment.serviceCenterId || appointment.branchId || branches[0]?.id || '';
  const [branchId, setBranchId] = useState(initialCenter);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.startTime);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (date < todayStr || (date === todayStr && time < nowTime)) {
      setErrorMsg(t.modal.pastSlotError);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const res = await rescheduleAppointmentAction(appointment.id, branchId, date, time);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to reschedule');
      return;
    }
    toast.success(t.modal.successUpdated);
    onSuccess(res.appointment as ServiceAppointment);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMsg && (
        <div className="rounded-xl border border-status-error-border bg-status-error-bg p-3 text-xs font-semibold text-status-error">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-content-strong mb-1">
          {t.modal.branch}
        </label>
        <select
          className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
          onChange={(e) => setBranchId(e.target.value)}
          value={branchId}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {isAr ? b.nameAr : b.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.date}
          </label>
          <input
            className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
            min={todayStr}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.timeSlot}
          </label>
          <select
            className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm"
            onChange={(e) => setTime(e.target.value)}
            value={time}
          >
            {TIME_SLOTS.map((s) => {
              const isPast = date === todayStr && s < nowTime;
              return (
                <option disabled={isPast} key={s} value={s}>
                  {s} {isPast ? `(${isAr ? 'مضى' : 'Passed'})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <Button className="w-full rounded-xl bg-brand text-primary-foreground font-semibold" disabled={loading} type="submit">
        {loading ? t.modal.saving : t.modal.reschedule}
      </Button>
    </form>
  );
}
