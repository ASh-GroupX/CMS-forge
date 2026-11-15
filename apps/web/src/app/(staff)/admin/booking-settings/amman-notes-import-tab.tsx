'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { FormSelect } from '../../../../components/ui/form-select';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  createAppointmentApi, fetchServiceAppointments, fetchServiceBookingLanes,
  type CarModel, type MaintenanceType, type ServiceAppointment,
} from '../../../../lib/staff-service-bookings-api';
import type { ServiceBookingLane } from '../../../../lib/staff-service-booking-lanes-api';
import {
  parseAmmanNotesRows, planAmmanNotesImport, sourceMarker, suggestCatalogModel,
  type AmmanImportRow,
} from '../../../../lib/amman-notes-import';
import type { Locale } from '../../../../i18n/staff-shell';
import { ammanNotesImportText } from '../../../../i18n/amman-notes-import';

export function AmmanNotesImportTab({ carModels, maintenanceTypes, locale }: {
  carModels: CarModel[]; maintenanceTypes: MaintenanceType[]; locale: Locale;
}) {
  const t = ammanNotesImportText[locale];
  const [rows, setRows] = useState<AmmanImportRow[]>([]);
  const [existing, setExisting] = useState<ServiceAppointment[]>([]);
  const [lane, setLane] = useState<ServiceBookingLane | null>(null);
  const [typeId, setTypeId] = useState('');
  const [modelByType, setModelByType] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(0);
  const [message, setMessage] = useState<string>(t.noFile);

  const kinds = useMemo(() => [...new Set(rows.map((row) => row.carType))].sort(), [rows]);
  const plan = useMemo(() => lane ? planAmmanNotesImport(rows, existing, lane, modelByType) : [], [rows, existing, lane, modelByType]);
  const ready = plan.filter((item) => item.startTime);
  const imported = plan.filter((item) => item.reason === 'already-imported');
  const conflicts = plan.filter((item) => item.reason && item.reason !== 'already-imported');
  const options = useMemo(() => carModels.filter((model) => model.isActive).map((model) => ({
    value: model.id, label: `${model.brand} · ${model.nameEn}`,
  })).sort((a, b) => a.label.localeCompare(b.label)), [carModels]);

  async function load(file: File | undefined) {
    if (!file) return;
    setBusy(true); setCreated(0); setMessage(t.loading); setRows([]);
    try {
      const parsed = parseAmmanNotesRows(JSON.parse(await file.text()) as unknown);
      if (parsed.length !== 359) throw new Error(t.count);
      const [lanes, appointments] = await Promise.all([
        fetchServiceBookingLanes('center_main'),
        fetchServiceAppointments({ branchId: 'center_main', fromDate: parsed[0]!.date, toDate: parsed.at(-1)!.date }),
      ]);
      const notesLane = lanes.find((item) => item.isActive && item.nameEn.toLowerCase() === 'notes');
      const notesType = maintenanceTypes.find((item) => item.isActive && item.nameEn.toLowerCase() === 'notes');
      if (!notesLane) throw new Error(t.noLane);
      if (!notesType) throw new Error(t.noType);
      setLane(notesLane); setTypeId(notesType.id); setExisting(appointments);
      setModelByType(Object.fromEntries([...new Set(parsed.map((row) => row.carType))].map((name) => [
        name, suggestCatalogModel(name, carModels),
      ])));
      setRows(parsed); setMessage('');
    } catch (error) {
      setMessage(error instanceof Error && ([t.count, t.noLane, t.noType] as string[]).includes(error.message) ? error.message : t.failed);
    }
    finally { setBusy(false); }
  }

  async function importReady() {
    if (!lane || !typeId || busy || ready.length === 0) return;
    setBusy(true); setCreated(0); setMessage('');
    let completed = 0;
    for (const item of ready) {
      const row = item.row;
      try {
        const result = await createAppointmentApi({
          branchId: 'center_main', bookingLaneId: lane.id, maintenanceTypeId: typeId,
          carModelId: modelByType[row.carType]!, customerName: row.customerName,
          customerPhone: row.customerPhone, date: row.date, startTime: item.startTime!,
          durationMinutes: 15,
          notes: `${sourceMarker(row.sourceKey)}\nSource car type: ${row.carType}\nSource hour: ${row.hour}\nOriginal: ${row.originalText}`,
        });
        if (!result.ok) throw new Error(result.message || t.failed);
        completed += 1; setCreated(completed);
        if (result.appointment) setExisting((previous) => [...previous, result.appointment!]);
      } catch (error) {
        setMessage(`${t.issue} ${row.sourceKey}: ${t.failed}${error instanceof Error && locale === 'en' ? ` ${error.message}` : ''}`);
        setBusy(false);
        return;
      }
    }
    setMessage(t.finished); setBusy(false);
  }

  return (
    <section aria-label={t.title} className="space-y-5 rounded-2xl border border-line-subtle bg-surface p-5">
      <div><h2 className="text-lg font-semibold text-content-strong">{t.title}</h2><p className="text-sm text-content-muted">{t.subtitle}</p></div>
      <div className="space-y-2"><Label htmlFor="amman-notes-file">{t.file}</Label>
        <Input id="amman-notes-file" type="file" accept=".json,application/json" disabled={busy}
          onClick={(event) => { event.currentTarget.value = ''; }}
          onChange={(event) => void load(event.target.files?.[0])} /></div>
      {rows.length > 0 ? <>
        <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <p className="rounded-xl bg-surface-sunken p-3 text-sm">{t.ready}: <strong>{ready.length}</strong></p>
          <p className="rounded-xl bg-surface-sunken p-3 text-sm">{t.imported}: <strong>{imported.length}</strong></p>
          <p className="rounded-xl bg-surface-sunken p-3 text-sm">{t.conflicts}: <strong>{conflicts.length}</strong></p>
        </div>
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-line-subtle p-3">
          {kinds.map((kind) => <div className="grid gap-2 sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,2fr)]" key={kind}>
            <Label htmlFor={`model-${kind}`}>{t.model} {kind} ({rows.filter((row) => row.carType === kind).length})</Label>
            <FormSelect id={`model-${kind}`} aria-label={`${t.model} ${kind}`} options={options}
              placeholder={t.choose} value={modelByType[kind] || ''} disabled={busy}
              onValueChange={(id) => setModelByType((previous) => ({ ...previous, [kind]: id }))} />
          </div>)}
        </div>
        {conflicts.length > 0 ? <details className="text-sm text-content-muted"><summary className="cursor-pointer">{t.details}</summary>
          <ul className="mt-2 max-h-40 list-disc overflow-y-auto ps-5">{conflicts.map(({ row, reason }) => <li key={row.sourceKey}>{row.sourceKey}: {reason}</li>)}</ul>
        </details> : null}
        <Button onClick={() => void importReady()} disabled={busy || ready.length === 0}>{t.start}</Button>
        <p aria-live="polite" className="text-sm text-content-muted">{t.progress}: {created}</p>
      </> : null}
      {message ? <p role={rows.length ? 'status' : 'alert'} className="text-sm text-content-muted">{message}</p> : null}
    </section>
  );
}
