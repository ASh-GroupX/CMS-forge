'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, Phone, Search, X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useServiceBooking } from './service-booking-context';
import { bookingSearchCopy } from './booking-search-copy';
import { findBookings } from './booking-search-utils';
import { matchesBranch } from './service-booking-utils';

const RESULT_LIMIT = 20;

export function BookingSearch({ loadError = false }: { loadError?: boolean }) {
  const {
    appointments, branches, locale, setIsDetailModalOpen, setSelectedAppointment,
    setSelectedBranchId, setSelectedDate, setView, t,
  } = useServiceBooking();
  const copy = bookingSearchCopy[locale];
  const [query, setQuery] = useState('');
  const matches = useMemo(() => findBookings(appointments, query), [appointments, query]);
  const hasQuery = query.trim().length >= 2;
  const dateLocale = locale === 'ar' ? 'ar-JO' : 'en-US';

  return <Card className="rounded-2xl border-line-subtle bg-surface shadow-sm" aria-label={copy.title}>
    <CardHeader className="gap-1 pb-3">
      <CardTitle className="flex items-center gap-2 text-base text-content-strong"><Search className="size-4 text-brand" />{copy.title}</CardTitle>
      <CardDescription className="text-content-muted">{copy.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="relative max-w-2xl">
        <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-content-muted" />
        <Input aria-label={copy.placeholder} autoComplete="off" className="h-11 rounded-xl border-line-subtle bg-surface-canvas ps-10 pe-10 focus-visible:ring-brand" disabled={loadError} onChange={(event) => setQuery(event.target.value)} placeholder={copy.placeholder} role="searchbox" type="text" value={query} />
        {query && <Button aria-label={copy.clear} className="absolute end-1 top-1/2 size-9 -translate-y-1/2 rounded-lg p-0" onClick={() => setQuery('')} size="icon" type="button" variant="ghost"><X className="size-4" /></Button>}
      </div>
      {loadError && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error" role="alert">
        <span>{copy.error}</span><Button onClick={() => window.location.reload()} size="sm" type="button" variant="outline">{copy.retry}</Button>
      </div>}
      {!loadError && <p aria-live="polite" className="mt-2 text-xs text-content-muted">
        {!hasQuery ? copy.hint : matches.length === 0 ? copy.empty : matches.length > RESULT_LIMIT
          ? copy.limited.replace('{count}', String(RESULT_LIMIT)) : copy.count.replace('{count}', String(matches.length))}
      </p>}
      {!loadError && hasQuery && matches.length > 0 && <div className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pe-1" role="list">
        {matches.slice(0, RESULT_LIMIT).map((appointment) => {
          const branch = branches.find((item) => matchesBranch(appointment, item));
          const branchName = branch ? (locale === 'ar' ? branch.nameAr : branch.nameEn) : null;
          const date = new Date(`${appointment.date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
          return <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-canvas/50 p-3 sm:flex-row sm:items-center sm:justify-between" key={appointment.id} role="listitem">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-content-strong">{appointment.customerName}</span>
                <Badge className={appointment.status === 'CANCELLED' ? 'border-status-error-border bg-status-error-bg text-status-error' : 'border-line-subtle bg-surface text-content-strong'} variant="outline">{t.status[appointment.status]}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
                <span className="inline-flex items-center gap-1"><Phone aria-hidden="true" className="size-3.5" /><span className="sr-only">{copy.phone}: </span><bdi>{appointment.customerPhone}</bdi></span>
                <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="size-3.5" /><span className="sr-only">{copy.date}: </span>{date}</span>
                <span><span className="sr-only">{copy.time}: </span><bdi>{appointment.startTime}–{appointment.endTime}</bdi></span>
                {branchName && <span>{copy.branch}: {branchName}</span>}
              </div>
            </div>
            <Button aria-label={`${copy.view}: ${appointment.customerName}, ${date}, ${appointment.startTime}`} className="shrink-0 gap-1.5 rounded-lg" onClick={() => {
              setSelectedBranchId(branch?.id ?? 'ALL');
              setSelectedDate(appointment.date.slice(0, 10));
              setView('day');
              setSelectedAppointment(appointment);
              setIsDetailModalOpen(true);
            }} type="button" variant="outline">{copy.view}<ArrowUpRight aria-hidden="true" className="size-4" /></Button>
          </div>;
        })}
      </div>}
    </CardContent>
  </Card>;
}
