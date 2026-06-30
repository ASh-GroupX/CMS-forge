'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { ComplaintDetail, StaffComplaintCorrectionRequest } from '../../lib/staff-complaints-api';
import { correctStaffComplaint } from '../../lib/staff-complaints-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';

type Source = ComplaintDetail['customerSource'];
type VehicleSource = ComplaintDetail['vehicleSource'];

export type ProvenanceCorrectionText = {
  title: string;
  description: string;
  fields: { customerId: string; customerSource: string; manualCustomer: string; vehicleId: string; clearVehicleId: string; vehicleSource: string; manualVehicle: string; vehicleRelated: string; vehicleDataUnavailableReason: string; reason: string };
  actions: { save: string; reload: string };
  sourceLabels: Record<Source | 'NONE', string>;
  states: { idle: string; loading: string; success: string; error: string; conflict: string; validation: string; denied: string };
};

export function ProvenanceCorrectionPanel({ detail, text }: { detail: StaffComplaintDetailView; text: ProvenanceCorrectionText }) {
  const [state, setState] = useState<keyof ProvenanceCorrectionText['states']>('idle');
  const [changed, setChanged] = useState<string[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = correctionBody(detail, new FormData(event.currentTarget));
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

  const message = state === 'success' && changed.length ? `${text.states.success}: ${changed.join(', ')}` : text.states[state];

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2" aria-label={text.title}>
      <h3 className="text-sm font-semibold">{text.title}</h3>
      <p className="mt-1 text-xs text-slate-600">{text.description}</p>
      <form className="mt-3 grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField id="correctionCustomerId" label={text.fields.customerId} name="customerId" />
          <SourceField defaultValue={detail.customerSource} label={text.fields.customerSource} labels={text.sourceLabels} name="customerSource" />
          <CheckField defaultChecked={detail.manualCustomer} label={text.fields.manualCustomer} name="manualCustomer" />
          <CheckField defaultChecked={detail.vehicleRelated} label={text.fields.vehicleRelated} name="vehicleRelated" />
          <TextField id="correctionVehicleId" label={text.fields.vehicleId} name="vehicleId" />
          <CheckField label={text.fields.clearVehicleId} name="clearVehicleId" />
          <SourceField defaultValue={detail.vehicleSource ?? 'NONE'} label={text.fields.vehicleSource} labels={text.sourceLabels} name="vehicleSource" />
          <CheckField defaultChecked={detail.manualVehicle} label={text.fields.manualVehicle} name="manualVehicle" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="vehicleDataUnavailableReason">{text.fields.vehicleDataUnavailableReason}</Label>
          <Textarea defaultValue={detail.vehicleDataUnavailableReason ?? ''} id="vehicleDataUnavailableReason" name="vehicleDataUnavailableReason" />
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

function correctionBody(detail: StaffComplaintDetailView, form: FormData): StaffComplaintCorrectionRequest | null {
  const reason = text(form, 'reason');
  if (!reason) return null;
  const correction: StaffComplaintCorrectionRequest = { expectedUpdatedAt: detail.updatedAt, reason };
  setText(correction, 'customerId', text(form, 'customerId'));
  setIfChanged(correction, 'customerSource', source(form.get('customerSource')), detail.customerSource);
  setIfChanged(correction, 'manualCustomer', form.has('manualCustomer'), detail.manualCustomer);
  if (form.has('clearVehicleId')) correction.vehicleId = null;
  else setText(correction, 'vehicleId', text(form, 'vehicleId'));
  setIfChanged(correction, 'vehicleSource', vehicleSource(form.get('vehicleSource')), detail.vehicleSource);
  setIfChanged(correction, 'manualVehicle', form.has('manualVehicle'), detail.manualVehicle);
  setIfChanged(correction, 'vehicleRelated', form.has('vehicleRelated'), detail.vehicleRelated);
  setVehicleReason(correction, text(form, 'vehicleDataUnavailableReason'), detail.vehicleDataUnavailableReason);
  return Object.keys(correction).length > 2 ? correction : null;
}

function text(form: FormData, name: string): string {
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

function source(value: FormDataEntryValue | null): Source {
  return value === 'MANUAL' || value === 'DMS' ? value : 'LOCAL';
}

function vehicleSource(value: FormDataEntryValue | null): VehicleSource {
  return value === 'LOCAL' || value === 'MANUAL' || value === 'DMS' ? value : null;
}

function SourceField({ defaultValue, label, labels, name }: { defaultValue: Source | 'NONE'; label: string; labels: ProvenanceCorrectionText['sourceLabels']; name: string }) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      <Select defaultValue={defaultValue} name={name}>
        <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {(['LOCAL', 'MANUAL', 'DMS', 'NONE'] as const).map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextField({ id, label, name }: { id: string; label: string; name: string }) {
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label><Input id={id} name={name} /></div>;
}

function CheckField({ defaultChecked = false, label, name }: { defaultChecked?: boolean; label: string; name: string }) {
  return <Label className="flex items-center gap-2 rounded-sm bg-white px-3 py-2 text-sm"><Input className="size-4" defaultChecked={defaultChecked} name={name} type="checkbox" />{label}</Label>;
}
