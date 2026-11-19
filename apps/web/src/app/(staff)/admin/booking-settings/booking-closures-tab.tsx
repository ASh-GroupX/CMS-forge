'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, LockKeyhole, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { FormSelect } from '../../../../components/ui/form-select';
import { bookingClosuresText } from '../../../../i18n/staff-booking-closures';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceCenter } from '../../../../lib/staff-service-bookings-api';
import { createBookingClosure, deleteBookingClosure, listBookingClosures, type BookingClosure } from '../../../../lib/staff-booking-closures-api';
import { ClosureMonthCalendar } from './closure-month-calendar';

export function BookingClosuresTab({ centers, locale }: { centers: ServiceCenter[]; locale: Locale }) {
  const t = bookingClosuresText[locale];
  const [centerId, setCenterId] = useState(centers[0]?.id ?? '');
  const [closures, setClosures] = useState<BookingClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const reload = useCallback(async () => {
    if (!centerId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try { setClosures(await listBookingClosures(centerId)); }
    catch { setError(t.loadError); }
    finally { setLoading(false); }
  }, [centerId, t.loadError]);

  useEffect(() => { void reload(); }, [reload]);

  async function save() {
    if (!startDate || !endDate || endDate < startDate || !reason.trim()) { setError(t.invalid); return; }
    setBusy(true);
    setError('');
    try {
      await createBookingClosure(centerId, { startDate, endDate, reason: reason.trim() });
      setStartDate(''); setEndDate(''); setReason('');
      toast.success(t.saved);
      await reload();
    } catch (failure) {
      setError(failure instanceof Error && failure.message === 'CONFLICT' ? t.conflict : t.saveError);
    } finally { setBusy(false); }
  }

  function selectDate(date: string) {
    if (!startDate || endDate || date < startDate) { setStartDate(date); setEndDate(''); }
    else { setEndDate(date); }
  }

  async function reopen(id: string) {
    if (!window.confirm(t.confirm)) return;
    setBusy(true);
    setError('');
    try { await deleteBookingClosure(centerId, id); toast.success(t.deleted); await reload(); }
    catch { setError(t.deleteError); }
    finally { setBusy(false); }
  }

  return <section aria-label={t.title} className="space-y-5">
    <div className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-brand/10 p-2 text-brand"><CalendarDays aria-hidden="true" className="size-5" /></div>
        <div><h2 className="font-bold text-content-strong">{t.title}</h2><p className="mt-1 text-sm text-content-muted">{t.description}</p></div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 text-sm font-medium text-content-strong"><span id="closure-center-label">{t.center}</span>
          <FormSelect aria-label={t.center} onValueChange={setCenterId} options={centers.map((center) => ({ value: center.id, label: locale === 'ar' ? center.nameAr : center.nameEn }))} value={centerId} />
        </div>
        <label className="space-y-1.5 text-sm font-medium text-content-strong">{t.start}<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium text-content-strong">{t.end}<Input min={startDate} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium text-content-strong">{t.reason}<Input maxLength={200} placeholder={t.reasonPlaceholder} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      </div>
      <ClosureMonthCalendar closures={closures} endDate={endDate} locale={locale} onSelect={selectDate} startDate={startDate} />
      <div className="mt-4 flex justify-end"><Button disabled={busy || !centerId} onClick={() => void save()} type="button"><LockKeyhole aria-hidden="true" className="me-2 size-4" />{busy ? t.saving : t.close}</Button></div>
      {error ? <p role="alert" className="mt-3 text-sm text-status-error">{error} <Button size="sm" variant="ghost" onClick={() => void reload()}>{t.retry}</Button></p> : null}
    </div>
    <div className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-xs">
      <h3 className="font-semibold text-content-strong">{t.closedRanges}</h3>
      {loading ? <p className="mt-4 text-sm text-content-muted" role="status">{t.loading}</p> : null}
      {!loading && !error && closures.length === 0 ? <p className="mt-4 text-sm text-content-muted">{t.empty}</p> : null}
      {!loading && closures.length > 0 ? <ul className="mt-4 divide-y divide-line-subtle">{closures.map((closure) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={closure.id}>
        <div><p className="font-medium text-content-strong"><time dateTime={closure.startDate.slice(0, 10)}>{closure.startDate.slice(0, 10)}</time> – <time dateTime={closure.endDate.slice(0, 10)}>{closure.endDate.slice(0, 10)}</time></p><p className="text-sm text-content-muted">{closure.reason}</p></div>
        <Button disabled={busy} onClick={() => void reopen(closure.id)} size="sm" type="button" variant="outline"><RotateCcw aria-hidden="true" className="me-2 size-4" />{t.reopen}</Button>
      </li>)}</ul> : null}
    </div>
  </section>;
}
