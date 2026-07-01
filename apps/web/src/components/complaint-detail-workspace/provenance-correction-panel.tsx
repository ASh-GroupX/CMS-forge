'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintDetail, DmsCustomerVehicleMatch, StaffComplaintCorrectionRequest } from '../../lib/staff-complaints-api';
import { correctStaffComplaint } from '../../lib/staff-complaints-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { CustomerVehicleLookup, type LookupPreviewState, type LookupSelection } from '../customer-vehicle-lookup';

type Source = ComplaintDetail['customerSource'];
type VehicleSource = ComplaintDetail['vehicleSource'];
type VehicleFieldSource = Exclude<VehicleSource, null> | 'NONE';

export type CorrectionFields = {
  clearVehicleId: boolean;
  customerId: string;
  customerSource: Source;
  manualCustomer: boolean;
  manualVehicle: boolean;
  vehicleDataUnavailableReason: string;
  vehicleId: string;
  vehicleRelated: boolean;
  vehicleSource: VehicleFieldSource;
};

export type ProvenanceCorrectionText = {
  title: string;
  description: string;
  fields: { customerId: string; customerSource: string; manualCustomer: string; vehicleId: string; clearVehicleId: string; vehicleSource: string; manualVehicle: string; vehicleRelated: string; vehicleDataUnavailableReason: string; reason: string };
  actions: { save: string; reload: string };
  sourceLabels: Record<Source | 'NONE', string>;
  states: { idle: string; loading: string; success: string; error: string; conflict: string; validation: string; denied: string };
};

export function ProvenanceCorrectionPanel({
  detail,
  locale,
  lookupState,
  text,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
  lookupState?: LookupPreviewState | undefined;
  text: ProvenanceCorrectionText;
}) {
  const [state, setState] = useState<keyof ProvenanceCorrectionText['states']>('idle');
  const [changed, setChanged] = useState<string[]>([]);
  const [fields, setFields] = useState<CorrectionFields>(() => initialFields(detail));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = correctionBody(detail, fields, new FormData(event.currentTarget));
    if (!body) {
      setState('validation');
      return;
    }
    setState('loading');
    const result = await correctStaffComplaint(detail.id, body);
    if (result.ok) {
      setChanged(result.data.correction.changedFields);
      setState('success');
      return;
    }
    if (result.error.status === 409 || result.error.code === 'COMPLAINT_INVALID_TRANSITION') setState('conflict');
    else if (result.error.status === 401 || result.error.status === 403) setState('denied');
    else if (result.error.code === 'VALIDATION_FAILED') setState('validation');
    else setState('error');
  }

  function applyLookupSelection(selection: LookupSelection) {
    setFields((current) => selection.source === 'MANUAL' ? manualFields(current) : applyDmsMatchToCorrectionFields(current, selection.match));
  }

  const message = state === 'success' && changed.length ? `${text.states.success}: ${changed.join(', ')}` : text.states[state];

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2" aria-label={text.title}>
      <h3 className="text-sm font-semibold">{text.title}</h3>
      <p className="mt-1 text-xs text-slate-600">{text.description}</p>
      <div className="mt-3">
        <CustomerVehicleLookup locale={locale} onSelectionChange={applyLookupSelection} state={lookupState} surface="section" />
      </div>
      <form className="mt-3 grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField id="correctionCustomerId" label={text.fields.customerId} name="customerId" onChange={(customerId) => setFields((current) => ({ ...current, customerId }))} value={fields.customerId} />
          <SourceField label={text.fields.customerSource} labels={text.sourceLabels} name="customerSource" onChange={(customerSource) => customerSource !== 'NONE' && setFields((current) => ({ ...current, customerSource }))} value={fields.customerSource} />
          <CheckField checked={fields.manualCustomer} label={text.fields.manualCustomer} name="manualCustomer" onChange={(manualCustomer) => setFields((current) => ({ ...current, manualCustomer }))} />
          <CheckField checked={fields.vehicleRelated} label={text.fields.vehicleRelated} name="vehicleRelated" onChange={(vehicleRelated) => setFields((current) => ({ ...current, vehicleRelated }))} />
          <TextField id="correctionVehicleId" label={text.fields.vehicleId} name="vehicleId" onChange={(vehicleId) => setFields((current) => ({ ...current, vehicleId }))} value={fields.vehicleId} />
          <CheckField checked={fields.clearVehicleId} label={text.fields.clearVehicleId} name="clearVehicleId" onChange={(clearVehicleId) => setFields((current) => ({ ...current, clearVehicleId }))} />
          <SourceField label={text.fields.vehicleSource} labels={text.sourceLabels} name="vehicleSource" onChange={(vehicleSource) => setFields((current) => ({ ...current, vehicleSource }))} value={fields.vehicleSource} />
          <CheckField checked={fields.manualVehicle} label={text.fields.manualVehicle} name="manualVehicle" onChange={(manualVehicle) => setFields((current) => ({ ...current, manualVehicle }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="vehicleDataUnavailableReason">{text.fields.vehicleDataUnavailableReason}</Label>
          <Textarea id="vehicleDataUnavailableReason" name="vehicleDataUnavailableReason" onChange={(event) => setFields((current) => ({ ...current, vehicleDataUnavailableReason: event.currentTarget.value }))} value={fields.vehicleDataUnavailableReason} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="correctionReason">{text.fields.reason}</Label>
          <Textarea id="correctionReason" name="reason" required />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={state === 'loading'} type="submit">{state === 'loading' ? text.states.loading : text.actions.save}</Button>
          {state === 'conflict' ? <Button asChild type="button" variant="outline"><a href="">{text.actions.reload}</a></Button> : null}
        </div>
        {state === 'idle' ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
        {state !== 'idle' ? <p className={state === 'success' || state === 'loading' ? 'text-sm text-muted-foreground' : 'text-sm text-destructive'} role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{message}</p> : null}
      </form>
    </section>
  );
}

function initialFields(detail: StaffComplaintDetailView): CorrectionFields {
  return {
    clearVehicleId: false,
    customerId: '',
    customerSource: detail.customerSource,
    manualCustomer: detail.manualCustomer,
    manualVehicle: detail.manualVehicle,
    vehicleDataUnavailableReason: detail.vehicleDataUnavailableReason ?? '',
    vehicleId: '',
    vehicleRelated: detail.vehicleRelated,
    vehicleSource: detail.vehicleSource ?? 'NONE',
  };
}

function manualFields(current: CorrectionFields): CorrectionFields {
  return {
    ...current,
    customerSource: 'MANUAL',
    manualCustomer: true,
    manualVehicle: current.vehicleRelated ? true : current.manualVehicle,
    vehicleSource: current.vehicleRelated ? 'MANUAL' : current.vehicleSource,
  };
}

export function applyDmsMatchToCorrectionFields(current: CorrectionFields, match: DmsCustomerVehicleMatch): CorrectionFields {
  const hasVehicle = Boolean(match.vin || match.plateNumber || match.brand || match.model);
  return {
    ...current,
    clearVehicleId: match.vehicleId ? false : current.clearVehicleId,
    customerId: match.customerId ?? current.customerId,
    customerSource: 'DMS',
    manualCustomer: false,
    manualVehicle: hasVehicle ? false : current.manualVehicle,
    vehicleId: match.vehicleId ?? current.vehicleId,
    vehicleDataUnavailableReason: hasVehicle ? '' : current.vehicleDataUnavailableReason,
    vehicleRelated: hasVehicle || current.vehicleRelated,
    vehicleSource: hasVehicle ? 'DMS' : current.vehicleSource,
  };
}

function correctionBody(detail: StaffComplaintDetailView, fields: CorrectionFields, form: FormData): StaffComplaintCorrectionRequest | null {
  const reason = textValue(form, 'reason');
  if (!reason) return null;
  const correction: StaffComplaintCorrectionRequest = { expectedUpdatedAt: detail.updatedAt, reason };
  setText(correction, 'customerId', fields.customerId.trim());
  setIfChanged(correction, 'customerSource', fields.customerSource, detail.customerSource);
  setIfChanged(correction, 'manualCustomer', fields.manualCustomer, detail.manualCustomer);
  if (fields.clearVehicleId) correction.vehicleId = null;
  else setText(correction, 'vehicleId', fields.vehicleId.trim());
  setIfChanged(correction, 'vehicleSource', vehicleSource(fields.vehicleSource), detail.vehicleSource);
  setIfChanged(correction, 'manualVehicle', fields.manualVehicle, detail.manualVehicle);
  setIfChanged(correction, 'vehicleRelated', fields.vehicleRelated, detail.vehicleRelated);
  setVehicleReason(correction, fields.vehicleDataUnavailableReason.trim(), detail.vehicleDataUnavailableReason);
  return Object.keys(correction).length > 2 ? correction : null;
}

function textValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function setText<T extends 'customerId' | 'vehicleId'>(body: StaffComplaintCorrectionRequest, key: T, value: string) {
  if (value) body[key] = value;
}

function setIfChanged<T extends keyof StaffComplaintCorrectionRequest>(body: StaffComplaintCorrectionRequest, key: T, value: StaffComplaintCorrectionRequest[T], current: StaffComplaintCorrectionRequest[T]) {
  if (value !== current) body[key] = value;
}

function setVehicleReason(body: StaffComplaintCorrectionRequest, value: string, current: string | null) {
  if (value !== (current ?? '')) body.vehicleDataUnavailableReason = value || null;
}

function vehicleSource(value: VehicleFieldSource): VehicleSource {
  return value === 'LOCAL' || value === 'MANUAL' || value === 'DMS' ? value : null;
}

function SourceField({ label, labels, name, onChange, value }: { label: string; labels: ProvenanceCorrectionText['sourceLabels']; name: string; onChange: (value: Source | 'NONE') => void; value: Source | 'NONE' }) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      <Select name={name} onValueChange={(next) => onChange(next as Source | 'NONE')} value={value}>
        <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {(['LOCAL', 'MANUAL', 'DMS', 'NONE'] as const).map((option) => <SelectItem key={option} value={option}>{labels[option]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextField({ id, label, name, onChange, value }: { id: string; label: string; name: string; onChange: (value: string) => void; value: string }) {
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label><Input id={id} name={name} onChange={(event) => onChange(event.currentTarget.value)} value={value} /></div>;
}

function CheckField({ checked, label, name, onChange }: { checked: boolean; label: string; name: string; onChange: (value: boolean) => void }) {
  return <Label className="flex items-center gap-2 rounded-sm bg-white px-3 py-2 text-sm"><Input checked={checked} className="size-4" name={name} onChange={(event) => onChange(event.currentTarget.checked)} type="checkbox" />{label}</Label>;
}
