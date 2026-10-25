'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { useServiceBooking } from './service-booking-context';
import { createAppointmentAction } from './actions';
import { BookingCustomerFields } from './booking-customer-fields';
import { MaintenanceTypeSelector } from './maintenance-type-selector';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  for (const m of ['00', '15', '30', '45']) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m}`);
  }
}

export function NewAppointmentModal() {
  const {
    appointments,
    branches,
    carModels,
    isNewModalOpen,
    locale,
    maintenanceTypes,
    prefillSlot,
    selectedBranchId,
    selectedDate,
    setAppointments,
    setIsNewModalOpen,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const defaultBranch =
    prefillSlot?.branchId ||
    (selectedBranchId !== 'ALL' ? selectedBranchId : branches[0]?.id || '');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vin, setVin] = useState('');
  const [carModelId, setCarModelId] = useState('');
  const [maintenanceTypeId, setMaintenanceTypeId] = useState('');
  const [branchId, setBranchId] = useState(defaultBranch);
  const [date, setDate] = useState(prefillSlot?.date || selectedDate);
  const [startTime, setStartTime] = useState(prefillSlot?.time || '09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefillSlot) {
      if (prefillSlot.branchId) setBranchId(prefillSlot.branchId);
      if (prefillSlot.date) setDate(prefillSlot.date);
      if (prefillSlot.time) setStartTime(prefillSlot.time);
    } else {
      setBranchId(selectedBranchId !== 'ALL' ? selectedBranchId : branches[0]?.id || '');
      setDate(selectedDate);
    }
  }, [prefillSlot, selectedBranchId, selectedDate, branches]);

  const selectedHour = startTime.split(':')[0] || '09';
  const hourBookedCount = appointments.filter(
    (a) =>
      a.branchId === branchId &&
      a.date === date &&
      a.status !== 'CANCELLED' &&
      a.startTime.startsWith(selectedHour),
  ).length;

  const isHourAtLimit = hourBookedCount >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !customerPhone.trim() || !carModelId || !maintenanceTypeId || !notes.trim()) {
      setErrorMsg(t.modal.mandatoryError);
      return;
    }

    setLoading(true);
    const selectedMaint = maintenanceTypes.find((m) => m.id === maintenanceTypeId);
    const res = await createAppointmentAction({
      branchId,
      carModelId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date,
      durationMinutes: selectedMaint?.estimatedDurationMinutes || 30,
      maintenanceTypeId,
      notes: notes.trim(),
      startTime,
      vin: vin.trim() || null,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to book appointment');
      return;
    }

    if (res.appointment) {
      setAppointments((prev) => [...prev, res.appointment as ServiceAppointment]);
    }

    toast.success(t.modal.successCreated);
    setIsNewModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setVin('');
    setCarModelId('');
    setMaintenanceTypeId('');
    setNotes('');
  };

  return (
    <Dialog onOpenChange={setIsNewModalOpen} open={isNewModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-content-strong">
            {t.modal.newTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-content-muted">
            {t.modal.newSubtitle}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-status-error-border bg-status-error-bg p-3 text-xs font-semibold text-status-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <BookingCustomerFields
            carModelId={carModelId}
            carModels={carModels}
            customerName={customerName}
            customerPhone={customerPhone}
            isAr={isAr}
            onCarSelect={(id) => setCarModelId(id)}
            onNameChange={(val) => setCustomerName(val)}
            onPhoneChange={(val) => setCustomerPhone(val)}
            onVinChange={(val) => setVin(val)}
            t={t}
            vin={vin}
          />

          <div>
            <label className="block text-xs font-bold text-content-strong mb-1">
              {t.modal.maintenanceType} <span className="text-status-error">*</span>
            </label>
            <MaintenanceTypeSelector
              durationUnit={t.appointmentCard.duration}
              isAr={isAr}
              maintenanceTypeId={maintenanceTypeId}
              maintenanceTypes={maintenanceTypes}
              onSelect={(id) => setMaintenanceTypeId(id)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-content-strong mb-1">
                {t.modal.branch}
              </label>
              <select
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                onChange={(e) => setBranchId(e.target.value)}
                value={branchId}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{isAr ? b.nameAr : b.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-strong mb-1">
                {t.modal.date}
              </label>
              <input
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
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
                className={`w-full rounded-xl border bg-surface px-3 py-2 text-sm ${
                  isHourAtLimit
                    ? 'border-status-error text-status-error'
                    : 'border-line-subtle focus:border-brand'
                }`}
                onChange={(e) => setStartTime(e.target.value)}
                value={startTime}
              >
                {TIME_SLOTS.map((slot) => {
                  const hr = slot.split(':')[0] || '08';
                  const countInHr = appointments.filter(
                    (a) =>
                      a.branchId === branchId &&
                      a.date === date &&
                      a.status !== 'CANCELLED' &&
                      a.startTime.startsWith(hr),
                  ).length;
                  const full = countInHr >= 3;
                  return (
                    <option key={slot} value={slot}>
                      {slot} {full ? `(${t.timeline.hourFull})` : countInHr > 0 ? `(${countInHr}/3)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-content-strong mb-1">
              {t.modal.notes} <span className="text-status-error">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-line-subtle bg-surface p-3 text-sm focus:border-brand focus:outline-none min-h-[4.5rem]"
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.modal.notesPlaceholder}
              required
              rows={2}
              value={notes}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-subtle">
            <Button className="rounded-xl" onClick={() => setIsNewModalOpen(false)} type="button" variant="outline">
              {t.modal.cancel}
            </Button>
            <Button className="rounded-xl bg-brand font-semibold text-primary-foreground shadow-sm" disabled={loading} type="submit">
              {loading ? t.modal.saving : t.modal.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
