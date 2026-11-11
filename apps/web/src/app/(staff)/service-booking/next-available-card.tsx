'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarClock, RotateCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { fetchNextAvailableSlots, type NextAvailableSlot } from '../../../lib/staff-booking-suggestions-api';
import { useServiceBooking } from './service-booking-context';

export function NextAvailableCard() {
  const { appointments, locale, openNewModalWithSlot, selectedBranchId, setSelectedDate, t, userRules } = useServiceBooking();
  const [slots, setSlots] = useState<NextAvailableSlot[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    void fetchNextAvailableSlots(selectedBranchId, controller.signal).then((next) => {
      setSlots(next);
      setState('ready');
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [selectedBranchId, appointments, revision]);

  const isAr = locale === 'ar';
  return (
    <section aria-label={t.nextAvailable.title} className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-content-muted">
            <CalendarClock className="size-4 text-brand" />{t.nextAvailable.title}
          </h3>
          <p className="mt-1 text-[11px] text-content-muted">{t.nextAvailable.subtitle}</p>
        </div>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{state === 'ready' ? slots.length : 3}</span>
      </div>
      {state === 'loading' && <div aria-label={t.nextAvailable.loading} className="space-y-2">
        {[0, 1, 2].map((item) => <Skeleton className="h-[74px] rounded-xl" key={item} />)}
      </div>}
      {state === 'error' && <div role="alert" className="rounded-xl border border-status-error-border bg-status-error-bg/40 p-3 text-xs text-content-muted">
        <p>{t.nextAvailable.error}</p>
        <Button className="mt-2" onClick={() => setRevision((value) => value + 1)} size="sm" type="button" variant="outline">
          <RotateCw className="size-3.5" />{t.nextAvailable.retry}
        </Button>
      </div>}
      {state === 'ready' && slots.length === 0 && <p className="rounded-xl border border-line-subtle bg-surface-canvas/50 p-3 text-xs text-content-muted">{t.nextAvailable.empty}</p>}
      {state === 'ready' && slots.length > 0 && <ol className="space-y-2">
        {slots.map((slot) => {
          const dateLabel = new Date(`${slot.date}T00:00:00Z`).toLocaleDateString(isAr ? 'ar-JO' : 'en-US',
            { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
          return <li className="flex items-center gap-2 rounded-xl border border-line-subtle bg-surface-canvas/40 p-2.5 transition-colors hover:border-brand/40" key={`${slot.branchId}-${slot.date}-${slot.time}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tabular-nums text-content-strong" dir="ltr">{slot.time} <span className="text-xs font-medium text-content-muted">· {dateLabel}</span></p>
              <p className="mt-0.5 truncate text-[11px] text-content-muted">{isAr ? slot.branchNameAr : slot.branchNameEn}</p>
              <p className="text-[11px] font-semibold text-content-strong">{t.nextAvailable.places.replace('{count}', String(slot.remainingInSlot))}</p>
            </div>
            {userRules.canCreateBookings && <Button aria-label={`${t.nextAvailable.book} ${dateLabel} ${slot.time}`} className="shrink-0" onClick={() => {
              setSelectedDate(slot.date);
              openNewModalWithSlot({ branchId: slot.branchId, date: slot.date, time: slot.time });
            }} size="sm" type="button" variant="outline">{t.nextAvailable.book}<ArrowUpRight className="size-3.5" /></Button>}
          </li>;
        })}
      </ol>}
    </section>
  );
}
