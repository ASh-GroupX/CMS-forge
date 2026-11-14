'use client';

import React, { useEffect, useState } from 'react';
import { Gauge, Pencil, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';
import type { Locale } from '../../../../i18n/staff-shell';
import { fetchServiceBookingLanes, type ServiceBookingLane, type ServiceCenter } from '../../../../lib/staff-service-bookings-api';
import { saveBookingLaneAction } from './booking-lane-actions';

const emptyLane = (centerId: string): ServiceBookingLane => ({ id: '', serviceCenterId: centerId, code: '', nameEn: '', nameAr: '',
  maxDailyAppointments: 80, maxPerHour: 5, maxPerSlot: 2, position: 0, isActive: true, updatedAt: '' });

export function BookingLanesTab({ centers, locale, t }: { centers: ServiceCenter[]; locale: Locale; t: ServiceBookingCopy }) {
  const copy = t.adminSettings.lanes;
  const [centerId, setCenterId] = useState(centers[0]?.id ?? '');
  const [lanes, setLanes] = useState<ServiceBookingLane[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState<ServiceBookingLane | null>(null);
  const [saving, setSaving] = useState(false);

  const load = React.useCallback(async () => {
    if (!centerId) return;
    setState('loading');
    try { setLanes(await fetchServiceBookingLanes(centerId, true)); setState('ready'); }
    catch { setState('error'); }
  }, [centerId]);
  useEffect(() => { void load(); }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await saveBookingLaneAction({
      ...editing,
      ...(editing.updatedAt ? { expectedUpdatedAt: editing.updatedAt } : {}),
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.conflict ? copy.conflict : result.error);
      if (result.conflict) await load();
      return;
    }
    toast.success(copy.saved);
    setEditing(null);
    await load();
  };

  return <section className="space-y-4" aria-label={copy.title}>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-56 space-y-1.5"><Label>{copy.center}</Label>
        <Select value={centerId} onValueChange={setCenterId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          {centers.filter((center) => center.isActive).map((center) => <SelectItem key={center.id} value={center.id}>{locale === 'ar' ? center.nameAr : center.nameEn}</SelectItem>)}
        </SelectContent></Select></div>
      <Button className="gap-2" disabled={!centerId} onClick={() => setEditing(emptyLane(centerId))} type="button"><Plus className="size-4" />{copy.add}</Button>
    </div>
    <p className="max-w-2xl text-sm text-content-muted">{copy.description}</p>
    {state === 'loading' && <div className="h-28 animate-pulse rounded-2xl bg-surface-sunken" aria-label={copy.loading} />}
    {state === 'error' && <div className="rounded-2xl border border-status-error-border bg-status-error-bg p-4" role="alert"><p>{copy.error}</p><Button className="mt-3 gap-2" onClick={() => void load()} variant="outline"><RotateCw className="size-4" />{copy.retry}</Button></div>}
    {state === 'ready' && lanes.length === 0 && <div className="rounded-2xl border border-dashed border-line-subtle p-8 text-center text-content-muted">{copy.empty}</div>}
    {state === 'ready' && lanes.length > 0 && <div className="grid gap-3 lg:grid-cols-2">{lanes.map((lane) =>
      <article className={`rounded-2xl border border-line-subtle bg-surface p-4 ${lane.isActive ? '' : 'opacity-60'}`} key={lane.id}>
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-content-strong">{locale === 'ar' ? lane.nameAr : lane.nameEn}</h3><p className="text-xs text-content-muted">{lane.code}</p></div>
          <Button aria-label={`${copy.edit} ${lane.nameEn}`} onClick={() => setEditing(lane)} size="icon" variant="ghost"><Pencil className="size-4" /></Button></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><Metric label={copy.daily} value={lane.maxDailyAppointments} /><Metric label={copy.hourly} value={lane.maxPerHour} /><Metric label={copy.slot} value={lane.maxPerSlot} /></div>
      </article>)}</div>}
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing?.id ? copy.edit : copy.add}</DialogTitle><DialogDescription>{copy.formDescription}</DialogDescription></DialogHeader>
      {editing && <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
        <Field label={copy.nameEn}><Input aria-label={copy.nameEn} required value={editing.nameEn} onChange={(event) => setEditing({ ...editing, nameEn: event.target.value })} /></Field>
        <Field label={copy.nameAr}><Input aria-label={copy.nameAr} required dir="rtl" value={editing.nameAr} onChange={(event) => setEditing({ ...editing, nameAr: event.target.value })} /></Field>
        <Field label={copy.code}><Input aria-label={copy.code} required value={editing.code} onChange={(event) => setEditing({ ...editing, code: event.target.value.toUpperCase() })} /></Field>
        <Field label={copy.position}><Input aria-label={copy.position} min={0} type="number" value={editing.position} onChange={(event) => setEditing({ ...editing, position: Number(event.target.value) })} /></Field>
        <Field label={copy.daily}><Input aria-label={copy.daily} min={1} required type="number" value={editing.maxDailyAppointments} onChange={(event) => setEditing({ ...editing, maxDailyAppointments: Number(event.target.value) })} /></Field>
        <Field label={copy.hourly}><Input aria-label={copy.hourly} min={1} required type="number" value={editing.maxPerHour} onChange={(event) => setEditing({ ...editing, maxPerHour: Number(event.target.value) })} /></Field>
        <Field label={copy.slot}><Input aria-label={copy.slot} min={1} required type="number" value={editing.maxPerSlot} onChange={(event) => setEditing({ ...editing, maxPerSlot: Number(event.target.value) })} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><Checkbox checked={editing.isActive} onCheckedChange={(checked) => setEditing({ ...editing, isActive: checked === true })} />{copy.active}</label>
        <div className="flex justify-end gap-2 border-t border-line-subtle pt-4 sm:col-span-2"><Button onClick={() => setEditing(null)} type="button" variant="outline">{t.modal.cancel}</Button><Button disabled={saving} type="submit">{saving ? t.modal.saving : copy.save}</Button></div>
      </form>}
    </DialogContent></Dialog>
  </section>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-surface-canvas p-2"><Gauge className="mx-auto mb-1 size-3.5 text-brand" /><b className="block text-content-strong">{value}</b><span className="text-content-muted">{label}</span></div>; }
