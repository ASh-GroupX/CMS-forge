'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { BookingClosure } from '../../../../lib/staff-booking-closures-api';
import type { Locale } from '../../../../i18n/staff-shell';
import { bookingClosuresText } from '../../../../i18n/staff-booking-closures';

export function ClosureMonthCalendar({ closures, startDate, endDate, locale, onSelect }: {
  closures: BookingClosure[];
  startDate: string;
  endDate: string;
  locale: Locale;
  onSelect: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const t = bookingClosuresText[locale];
  const days = useMemo(() => {
    const first = month.getUTCDay();
    const count = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => {
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1));
      return date.toISOString().slice(0, 10);
    })] as Array<string | null>;
  }, [month]);
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const weekday = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-GB', { timeZone: 'UTC', weekday: locale === 'ar' ? 'narrow' : 'short' });
  const shift = (offset: number) => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1)));

  return <div className="mt-5 rounded-xl border border-line-subtle bg-surface-canvas/40 p-4" aria-label={t.calendar}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <Button aria-label={t.previousMonth} onClick={() => shift(-1)} size="icon" type="button" variant="outline"><ChevronLeft className="size-4" /></Button>
      <h3 aria-live="polite" className="font-semibold text-content-strong">{fmt.format(month)}</h3>
      <Button aria-label={t.nextMonth} onClick={() => shift(1)} size="icon" type="button" variant="outline"><ChevronRight className="size-4" /></Button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center">
      {Array.from({ length: 7 }, (_, index) => <span className="py-1 text-xs font-semibold text-content-muted" key={index}>{weekday.format(new Date(Date.UTC(2026, 10, 15 + index)))}</span>)}
      {days.map((date, index) => {
        if (!date) return <span aria-hidden="true" key={`empty-${index}`} />;
        const closure = closures.find((item) => item.startDate.slice(0, 10) <= date && item.endDate.slice(0, 10) >= date);
        const selected = date === startDate || date === endDate;
        const inRange = !!startDate && !!endDate && date > startDate && date < endDate;
        const label = `${date}${closure ? `, ${t.closedDay}: ${closure.reason}` : ''}`;
        return <Button aria-label={label} aria-pressed={selected || inRange} className={`h-10 w-full p-0 text-xs ${closure ? 'bg-status-error-bg text-status-error hover:bg-status-error-bg' : selected ? 'bg-brand text-primary-foreground hover:bg-brand' : inRange ? 'bg-brand/10 text-brand' : ''}`}
          key={date} onClick={() => onSelect(date)} title={label} type="button" variant="ghost">{Number(date.slice(-2))}</Button>;
      })}
    </div>
  </div>;
}
