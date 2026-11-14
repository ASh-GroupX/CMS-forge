'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useServiceBooking } from './service-booking-context';
import { createAppointmentAction } from './actions';
import { BookingCustomerFields } from './booking-customer-fields';
import { MaintenanceTypeSelector, isPeriodicMaintenanceType } from './maintenance-type-selector';
import type { ServiceAppointment } from '../../../lib/staff-service-bookings-api';
import { getNowTimeParts, getTodayDateString } from './service-booking-utils';
import { useBookingTimeOptions } from './use-booking-time-options';

const TIME_SLOTS = Array.from({ length: 40 }, (_, index) => `${String(8 + Math.floor(index / 4)).padStart(2, '0')}:${['00', '15', '30', '45'][index % 4]}`);

export function NewAppointmentModal() {
  const {
    appointments,
    branches,
    bookingLanes,
    carModels,
    isNewModalOpen,
    locale,
    maintenanceTypes,
    prefillSlot,
    selectedBranchIds,
    selectedDate,
    setAppointments,
    setIsNewModalOpen,
    t,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const defaultBranch =
    prefillSlot?.branchId ||
    (selectedBranchIds[0] ?? branches[0]?.id ?? '');
  const defaultLane = prefillSlot?.bookingLaneId || bookingLanes.find((lane) => lane.serviceCenterId === defaultBranch && lane.isActive)?.id || '';

  const todayStr = getTodayDateString();
  const nowParts = getNowTimeParts();
  const nowTime = `${String(nowParts.hour).padStart(2, '0')}:${String(nowParts.minute).padStart(2, '0')}`;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vin, setVin] = useState('');
  const [carModelId, setCarModelId] = useState('');
  const [maintenanceTypeId, setMaintenanceTypeId] = useState('');
  const [periodicMileageKm, setPeriodicMileageKm] = useState<number | null>(null);
  const [branchId, setBranchId] = useState(defaultBranch);
  const [bookingLaneId, setBookingLaneId] = useState(defaultLane);
  const [date, setDate] = useState(prefillSlot?.date || (selectedDate < todayStr ? todayStr : selectedDate));
  const initialSlot = prefillSlot?.time || (date === todayStr ? (TIME_SLOTS.find((s) => s >= nowTime) || '09:00') : '09:00');
  const [startTime, setStartTime] = useState(initialSlot);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timeOptions = useBookingTimeOptions(isNewModalOpen, branchId, bookingLaneId, date, startTime, todayStr, nowTime);

  useEffect(() => {
    if (prefillSlot) {
      if (prefillSlot.branchId) setBranchId(prefillSlot.branchId);
      if (prefillSlot.bookingLaneId) setBookingLaneId(prefillSlot.bookingLaneId);
      if (prefillSlot.date) setDate(prefillSlot.date);
      if (prefillSlot.time) setStartTime(prefillSlot.time);
    } else {
      const nextBranch = selectedBranchIds[0] ?? branches[0]?.id ?? '';
      setBranchId(nextBranch);
      setBookingLaneId(bookingLanes.find((lane) => lane.serviceCenterId === nextBranch && lane.isActive)?.id ?? '');
      setDate(selectedDate < todayStr ? todayStr : selectedDate);
    }
  }, [prefillSlot, selectedBranchIds, selectedDate, branches, bookingLanes, todayStr]);

  useEffect(() => {
    if (date === todayStr && startTime < nowTime) {
      const next = TIME_SLOTS.find((s) => s >= nowTime);
      if (next) setStartTime(next);
    }
  }, [date, todayStr, nowTime, startTime]);

  useEffect(() => {
    if (!maintenanceTypeId && maintenanceTypes.length > 0) setMaintenanceTypeId(maintenanceTypes.find((type) => type.isActive)?.id ?? '');
  }, [maintenanceTypes, maintenanceTypeId]);

  const isHourAtLimit = timeOptions.find((slot) => slot.time === startTime)?.full ?? false;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg(t.modal.mandatoryError);
      return;
    }
    if (!carModels.some(car => car.id === carModelId && car.isActive)) {
      setErrorMsg(t.modal.vehicleRequired);
      return;
    }
    if (!bookingLanes.some((lane) => lane.id === bookingLaneId && lane.serviceCenterId === branchId && lane.isActive)) {
      setErrorMsg(t.modal.bookingLaneRequired);
      return;
    }
    const isPeriodic = maintenanceTypes.some((type) => type.id === maintenanceTypeId && type.isActive && isPeriodicMaintenanceType(type));
    if (isPeriodic && periodicMileageKm == null) {
      setErrorMsg(t.modal.mileageRequired);
      return;
    }
    if (date < todayStr || (date === todayStr && startTime < nowTime)) {
      setErrorMsg(t.modal.pastSlotError);
      return;
    }

    setLoading(true);
    const effectiveCarModelId = carModelId;
    const effectiveMaintId = maintenanceTypeId || maintenanceTypes.find((type) => type.isActive)?.id || 'maint_periodic_10k';
    const matchedPeriodic = isPeriodic && periodicMileageKm != null
      ? maintenanceTypes.find((m) => m.isActive && m.id === `maint_periodic_${periodicMileageKm / 1000}k`) : null;
    const selectedMaint = matchedPeriodic ?? maintenanceTypes.find((m) => m.id === effectiveMaintId);
    const res = await createAppointmentAction({
      branchId: branchId || branches[0]?.id || 'center_main',
      bookingLaneId,
      carModelId: effectiveCarModelId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date,
      durationMinutes: selectedMaint?.estimatedDurationMinutes || 30,
      maintenanceTypeId: selectedMaint?.id ?? effectiveMaintId,
      periodicMileageKm: isPeriodic ? periodicMileageKm : null,
      notes: notes.trim() || 'Service appointment',
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
    setPeriodicMileageKm(null);
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
            maintenanceField={<MaintenanceTypeSelector
              maintenanceTypeLabel={t.modal.maintenanceType}
              isAr={isAr}
              maintenanceTypeId={maintenanceTypeId}
              maintenanceTypes={maintenanceTypes}
              onSelect={(id) => setMaintenanceTypeId(id)}
              periodicMileageKm={periodicMileageKm}
              onMileageChange={setPeriodicMileageKm}
              selectTypeLabel={t.modal.selectMaintenanceType}
              periodicLabel={t.modal.periodicMaintenance}
              mileageLabel={t.modal.periodicMileage}
              selectMileageLabel={t.modal.selectMileage}
            />}
            onCarSelect={(id) => setCarModelId(id)}
            onNameChange={(val) => setCustomerName(val)}
            onPhoneChange={(val) => setCustomerPhone(val)}
            onVinChange={(val) => setVin(val)}
            t={t}
            vin={vin}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-content-strong mb-1" htmlFor="booking-branch">
                {t.modal.branch}
              </label>
              <select
                id="booking-branch"
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                onChange={(e) => {
                  const nextBranch = e.target.value;
                  setBranchId(nextBranch);
                  setBookingLaneId(bookingLanes.find((lane) => lane.serviceCenterId === nextBranch && lane.isActive)?.id ?? '');
                }}
                value={branchId}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{isAr ? b.nameAr : b.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-strong mb-1" htmlFor="booking-lane">
                {t.modal.bookingLane}
              </label>
              <select id="booking-lane" className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                onChange={(event) => setBookingLaneId(event.target.value)} required value={bookingLaneId}>
                {bookingLanes.filter((lane) => lane.serviceCenterId === branchId && lane.isActive).map((lane) =>
                  <option key={lane.id} value={lane.id}>{isAr ? lane.nameAr : lane.nameEn}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-strong mb-1" htmlFor="booking-date">
                {t.modal.date}
              </label>
              <input
                id="booking-date"
                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                value={date}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-strong mb-1" htmlFor="booking-time">
                {t.modal.timeSlot}
              </label>
              <select
                id="booking-time"
                className={`w-full rounded-xl border bg-surface px-3 py-2 text-sm ${
                  isHourAtLimit
                    ? 'border-status-error text-status-error'
                    : 'border-line-subtle focus:border-brand'
                }`}
                onChange={(e) => setStartTime(e.target.value)}
                value={startTime}
              >
                {timeOptions.map(({ time: slot, past: isPast, full, bookedCount, maxPerSlot }) => {
                  return (
                    <option disabled={isPast || full} key={slot} value={slot}>
                      {slot} {isPast ? `(${t.modal.pastTime})` : full ? `(${t.timeline.slotFull})` : bookedCount > 0 ? `(${bookedCount}/${maxPerSlot})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-content-strong mb-1">
              {t.modal.notes}
            </label>
            <textarea
              className="w-full rounded-xl border border-line-subtle bg-surface p-3 text-sm focus:border-brand focus:outline-none min-h-[4.5rem]"
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.modal.notesPlaceholder}
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
