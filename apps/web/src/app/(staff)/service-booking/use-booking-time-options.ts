'use client';

import { useEffect, useState } from 'react';
import { fetchSlotAvailability, type DayAvailability } from '../../../lib/staff-service-bookings-api';

const FALLBACK_TIMES = Array.from({ length: 40 }, (_, index) => {
  const minutes = 8 * 60 + index * 15;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

export function useBookingTimeOptions(open: boolean, branchId: string, date: string, selectedTime: string,
  today: string, nowTime: string) {
  const [day, setDay] = useState<DayAvailability | null>(null);
  useEffect(() => {
    if (!open || !branchId || !date) return;
    let active = true;
    setDay(null);
    void fetchSlotAvailability(branchId, date).then((availability) => {
      if (active) setDay(availability);
    }).catch(() => { if (active) setDay(null); });
    return () => { active = false; };
  }, [open, branchId, date]);

  const offered = day?.slots.map((slot) => slot.slot) ?? FALLBACK_TIMES;
  const times = Array.from(new Set([...offered, selectedTime])).sort();
  return times.map((time) => {
    const slot = day?.slots.find((item) => item.slot === time);
    const past = date < today || (date === today && time < nowTime);
    const full = day != null && (!day.isOpen || day.bookedDailyCount >= day.maxDailyAppointments
      || !slot || slot.remainingInHour <= 0 || slot.remainingInSlot <= 0);
    return { time, past, full, bookedCount: slot?.bookedCount ?? 0, maxPerSlot: slot?.maxPerSlot ?? 0 };
  });
}
