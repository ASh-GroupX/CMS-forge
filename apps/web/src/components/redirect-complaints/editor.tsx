'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { FormSelect } from '../ui/form-select';
import { ComplaintVehicleSelect } from '../shared/complaint-vehicle-select';
import { PortalCustomFields, customValues } from '../portal-submission/custom-fields';
import { Alert, AlertDescription } from '../ui/alert';
import { redirectComplaintsText } from '../../i18n/redirect-complaints';
import { severityLabel } from '../../i18n/domain-labels';
import type { Locale } from '../../i18n/staff-shell';
import type { IntakeComplaint, IntakeChoices, Option } from '../../lib/redirect-complaints-api';
import { intakeClaimAction, intakeCorrectionAction, loadRedirectDetail } from '../../app/(staff)/redirect-complaints/actions';
export function RedirectComplaintEditor({ initial, choices, actorId, admin, locale }: { initial: IntakeComplaint; choices: IntakeChoices; actorId: string; admin: boolean; locale: Locale }) {
  const t = redirectComplaintsText[locale];
  const [item, setItem] = useState(initial); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [stale, setStale] = useState(false); const [sent, setSent] = useState(false); const [revision, setRevision] = useState(0);
  const [branch, setBranch] = useState(initial.branchId); const [department, setDepartment] = useState(initial.departmentId ?? ''); const [category, setCategory] = useState(initial.categoryId); const [owner, setOwner] = useState(initial.ownerId ?? '');
  const mine = item.claim?.assignedUserId === actorId;
  const label = (option: Option) => locale === 'ar' ? option.nameAr : option.nameEn;
  async function claim(release = false) {
    setBusy(true); setMessage(''); const result = await intakeClaimAction(item.id, item.expectedVersion, release).catch(() => ({ status: 'error' as const }));
    if (result.status === 'ok') { setItem(result.data); setStale(false); }
    else { setMessage(t[result.status]); if (result.status === 'conflict') setStale(true); }
    setBusy(false);
  }
  async function reload() {
    setBusy(true); const result = await loadRedirectDetail(item.id).catch(() => ({ status: 'error' as const }));
    if (result.status === 'ok') { setItem(result.data); setBranch(result.data.branchId); setDepartment(result.data.departmentId ?? ''); setCategory(result.data.categoryId); setOwner(result.data.ownerId ?? ''); setStale(false); setMessage(''); setRevision((value) => value + 1); }
    else setMessage(t[result.status]); setBusy(false);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const redirect = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'redirect';
    const input: Record<string, unknown> = {}; form.forEach((value, key) => { input[key] = value; });
    input.expectedVersion = item.expectedVersion; input.odometer = input.odometer === '' ? null : Number(input.odometer); input.incidentAt = new Date(String(input.incidentAt)).toISOString();
    if (item.portalData?.fields) input.customFields = customValues(form, item.portalData.fields);
    input.branchId = branch; input.categoryId = category; input.departmentId = department || null; input.ownerId = owner || null;
    setBusy(true); setMessage(''); const result = await intakeCorrectionAction(item.id, input, redirect).catch(() => ({ status: 'error' as const }));
    if (result.status === 'ok') { setItem(result.data); setMessage(redirect ? t.sent : t.saved); setSent(redirect); }
    else { setMessage(t[result.status]); if (result.status === 'conflict') setStale(true); }
    setBusy(false);
  }
  const select = (key: 'branchId' | 'categoryId' | 'departmentId' | 'ownerId', value: string, options: Option[], change: (value: string) => void, required = false) => <div className="grid gap-2"><Label htmlFor={key}>{t.fields[key]}</Label><FormSelect id={key} name={key} value={value} onValueChange={change} placeholder={t.choose} required={required} options={[...(!required ? [{ value: '', label: t.none }] : []), ...options.map((option) => ({ value: option.id, label: label(option) }))]} /></div>;
  return <section dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto grid max-w-5xl gap-5">
    <a className="text-sm text-brand underline" href={`/redirect-complaints?locale=${locale}`}>{t.back}</a>
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{t.title}</h1><p className="mt-1 tabular-nums text-content-muted">{item.referenceNumber}</p></div>{!sent && <div className="flex flex-wrap gap-2">{!item.claim?.assignedUserId && <Button disabled={busy || stale} onClick={() => claim()}>{t.claim}</Button>}{(mine || admin && item.claim?.assignedUserId) && <Button variant="outline" disabled={busy || stale} onClick={() => claim(true)}>{t.release}</Button>}<Button variant="outline" disabled={busy} onClick={reload}>{t.reload}</Button></div>}</header>
    {message && <Alert variant={stale ? 'destructive' : 'default'}><AlertDescription role="status">{message}</AlertDescription></Alert>}
    {!sent && <><p className="text-sm text-content-muted">{mine ? '' : item.claim?.assignedUserId ? t.other : t.claimFirst}</p><form onSubmit={submit} key={revision} aria-busy={busy}><fieldset disabled={!mine || busy || stale} className="grid gap-5">
      <Card><CardHeader><CardTitle className="text-base">{item.customerName}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        {(['customerName', 'customerPhone', 'vehicleVin', 'odometer'] as const).map((key) => <div className="grid gap-2" key={key}><Label htmlFor={key}>{t.fields[key]}</Label><Input id={key} name={key} defaultValue={item[key] ?? ''} required={!['vehicleVin', 'odometer'].includes(key)} type={key === 'odometer' ? 'number' : key === 'customerPhone' ? 'tel' : 'text'} {...(key === 'odometer' ? { min: 0, max: 10000000, step: 1 } : key === 'customerPhone' ? { pattern: '\\+[1-9][0-9]{7,14}', dir: 'ltr' } : key === 'vehicleVin' ? { maxLength: 17, pattern: '[A-HJ-NPR-Za-hj-npr-z0-9]{17}', dir: 'ltr' } : { maxLength: 200 })} /></div>)}
        <ComplaintVehicleSelect models={choices.carModels ?? []} locale={locale} brandName="vehicleMake" modelName="vehicleModel" brandLabel={t.fields.vehicleMake} modelLabel={t.fields.vehicleModel} defaultBrand={item.vehicleMake} defaultModel={item.vehicleModel} />
        <div className="grid gap-2"><Label htmlFor="incidentAt">{t.fields.incidentAt}</Label><Input id="incidentAt" name="incidentAt" type="date" required defaultValue={item.incidentAt?.slice(0, 10) ?? ''} /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="description">{t.fields.description}</Label><Textarea id="description" name="description" required maxLength={10000} rows={5} defaultValue={item.descriptionEn} /></div>
      </CardContent></Card>
      {item.portalData?.fields.some((field) => field.enabled && field.key.startsWith('custom_')) && <Card><CardHeader><CardTitle className="text-base">{locale === 'ar' ? 'حقول العميل الإضافية' : 'Additional customer fields'}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><PortalCustomFields fields={item.portalData.fields} values={item.portalData.values} locale={locale} error={() => undefined} /></CardContent></Card>}
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        {select('branchId', branch, choices.branches, (value) => { setBranch(value); setCategory(''); setDepartment(''); setOwner(''); }, true)}
        {select('categoryId', category, choices.categories.filter((option) => !option.branchId || option.branchId === branch), setCategory, true)}
        <div className="grid gap-2"><Label htmlFor="severity">{t.fields.severity}</Label><FormSelect id="severity" name="severity" defaultValue={item.severity} options={choices.severities.map((value) => ({ value, label: severityLabel(locale, value) }))} /></div>
        {select('departmentId', department, choices.departments.filter((option) => !option.branchId || option.branchId === branch), (value) => { setDepartment(value); setOwner(''); })}
        {select('ownerId', owner, choices.users.filter((option) => option.branchId === branch && option.departmentId === department), setOwner)}
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="reason">{t.reason}</Label><Textarea id="reason" name="reason" required maxLength={500} rows={2} /></div>
      </CardContent></Card>
      <div className="flex flex-wrap gap-3"><Button type="submit" name="action" value="save" variant="outline">{busy ? t.busy : t.save}</Button><Button type="submit" name="action" value="redirect" disabled={!department}>{busy ? t.busy : t.redirect}</Button></div>
    </fieldset></form></>}
  </section>;
}
