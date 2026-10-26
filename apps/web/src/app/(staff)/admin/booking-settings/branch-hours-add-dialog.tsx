'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import type { DayRule } from '../../../../lib/staff-service-bookings-api';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function BranchHoursAddDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  currentRules,
  t,
  isAr,
  saving,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rule: Omit<DayRule, 'branchId' | 'slotDurationMinutes'>) => void;
  currentRules: DayRule[];
  t: ServiceBookingCopy;
  isAr: boolean;
  saving: boolean;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [isDayOpen, setIsDayOpen] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxDaily, setMaxDaily] = useState(24);
  const [maxPerHour, setMaxPerHour] = useState(3);
  const [maxPerSlot, setMaxPerSlot] = useState(1);

  useEffect(() => {
    if (isOpen) {
      const existingDays = new Set(currentRules.map((r) => r.dayOfWeek));
      const firstFreeDay = [0, 1, 2, 3, 4, 5, 6].find((d) => !existingDays.has(d)) ?? 0;
      setDayOfWeek(firstFreeDay);
      setIsDayOpen(true);
      setStartTime('08:00');
      setEndTime('17:00');
      setMaxDaily(24);
      setMaxPerHour(3);
      setMaxPerSlot(1);
    }
  }, [isOpen, currentRules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      dayOfWeek,
      isOpen: isDayOpen,
      startTime,
      endTime,
      maxDailyAppointments: Number(maxDaily),
      maxPerHour: Number(maxPerHour),
      maxPerSlot: Number(maxPerSlot),
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-line-subtle">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-content-strong flex items-center gap-2">
            <Clock className="size-4 text-brand" />
            <span>{t.adminSettings.addHours}</span>
          </DialogTitle>
        </DialogHeader>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-bold text-content-muted">
              {isAr ? 'اليوم' : 'Day of Week'}
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-bold text-content-strong"
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              value={dayOfWeek}
            >
              {t.adminSettings.days.map((dayName, index) => (
                <option key={index} value={index}>
                  {dayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-subtle p-3 bg-surface-canvas/40">
            <span className="text-xs font-bold text-content-strong">
              {isAr ? 'حالة العمل' : 'Working Status'}
            </span>
            <button
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isDayOpen
                  ? 'bg-status-success-bg text-status-success'
                  : 'bg-status-error-bg text-status-error'
              }`}
              onClick={() => setIsDayOpen(!isDayOpen)}
              type="button"
            >
              {isDayOpen ? t.adminSettings.isOpen : t.adminSettings.closed}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-content-muted">
                {t.adminSettings.from}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-mono"
                disabled={!isDayOpen}
                onChange={(e) => setStartTime(e.target.value)}
                type="time"
                value={startTime}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-content-muted">
                {t.adminSettings.to}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-3 py-2 text-xs font-mono"
                disabled={!isDayOpen}
                onChange={(e) => setEndTime(e.target.value)}
                type="time"
                value={endTime}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-content-muted">
                {isAr ? 'اليومي' : 'Daily Max'}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-2.5 py-2 text-xs font-bold"
                disabled={!isDayOpen}
                min={0}
                onChange={(e) => setMaxDaily(Number(e.target.value))}
                type="number"
                value={maxDaily}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-content-muted">
                {isAr ? 'بالساعة' : 'Per Hour'}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-2.5 py-2 text-xs font-bold"
                disabled={!isDayOpen}
                min={1}
                onChange={(e) => setMaxPerHour(Number(e.target.value))}
                type="number"
                value={maxPerHour}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-content-muted">
                {isAr ? 'بالفترة' : 'Per Slot'}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-line-subtle bg-surface-canvas px-2.5 py-2 text-xs font-bold"
                disabled={!isDayOpen}
                min={1}
                onChange={(e) => setMaxPerSlot(Number(e.target.value))}
                type="number"
                value={maxPerSlot}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              className="rounded-xl border border-line-subtle bg-surface text-xs font-bold text-content-strong hover:bg-surface-canvas"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              {t.modal.cancel}
            </Button>
            <Button
              className="rounded-xl bg-brand text-xs font-bold text-primary-foreground shadow-sm"
              disabled={saving}
              type="submit"
            >
              {saving ? t.modal.saving : t.adminSettings.saveChanges}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
