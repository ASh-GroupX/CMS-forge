'use client';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { portalIntakeText } from '../../i18n/portal-intake';
import type { Locale } from '../../i18n/staff-shell';
import type { IntakeOption } from '../../lib/portal-intake-settings-api';
import { loadIntakeSettings, saveIntakeSettings } from '../../app/(staff)/admin/portal-intake/actions';

export function PortalIntakeSettings({ initial, locale }: { initial: Awaited<ReturnType<typeof loadIntakeSettings>>; locale: Locale }) {
  const t = portalIntakeText[locale];
  const [data, setData] = useState(initial);
  const [branchId, setBranch] = useState(initial.status === 'ok' ? initial.settings?.branchId ?? '' : '');
  const [categoryId, setCategory] = useState(initial.status === 'ok' ? initial.settings?.categoryId ?? '' : '');
  const [memberIds, setMembers] = useState(initial.status === 'ok' ? initial.settings?.memberIds ?? [] : []);
  const [phoneCountryCode, setPhone] = useState(initial.status === 'ok' ? initial.settings?.phoneCountryCode ?? '+962' : '+962');
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [message, setMessage] = useState('');
  const url = data.status === 'ok' ? data.portalUrl : '';
  const qr = useRef<HTMLDivElement>(null);
  const label = (item: IntakeOption) => locale === 'ar' ? item.nameAr : item.nameEn;
  async function reload() {
    setBusy(true);
    const next = await loadIntakeSettings().catch(() => ({ status: 'error' as const })); setData(next);
    if (next.status === 'ok') { setBranch(next.settings?.branchId ?? ''); setCategory(next.settings?.categoryId ?? ''); setMembers(next.settings?.memberIds ?? []); setPhone(next.settings?.phoneCountryCode ?? '+962'); }
    setMessage(''); setBusy(false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (data.status !== 'ok') return;
    setBusy(true); setMessage('');
    const result = await saveIntakeSettings({ branchId, categoryId, memberIds, phoneCountryCode, expectedVersion: data.settings?.version ?? null }).catch(() => ({ status: 'error' as const }));
    if (result.status === 'ok') { setData({ ...data, settings: result.data }); setMessage(t.saved); }
    else setMessage(t[result.status]);
    setBusy(false);
  }
  function download() {
    const svg = qr.current?.querySelector('svg'); if (!svg) return;
    const blobUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    const anchor = document.createElement('a'); anchor.href = blobUrl; anchor.download = 'complaint-portal-qr.svg'; anchor.click(); URL.revokeObjectURL(blobUrl);
  }
  return <section dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto grid max-w-6xl gap-6">
    <header><h1 className="text-2xl font-semibold text-content-strong">{t.title}</h1><p className="mt-2 max-w-2xl text-sm text-content-muted">{t.intro}</p><Button asChild variant="outline" className="mt-3"><a href={`/admin/portal-intake/fields?locale=${locale}`}>{locale === 'ar' ? 'تخصيص حقول الشكوى' : 'Customize complaint fields'}</a></Button></header>
    {message && <Alert><AlertDescription role="status">{message}</AlertDescription></Alert>}
    {data.status !== 'ok' ? <Alert><AlertDescription>{t[data.status]} <Button disabled={busy} onClick={reload}>{t.retry}</Button></AlertDescription></Alert> :
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={save} className="grid gap-5" aria-busy={busy}>
          <Card><CardHeader><CardTitle>{t.defaults}</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
            {([{ key: 'branch', value: branchId, items: data.options.branches, change: (id: string) => { setBranch(id); setCategory(''); setMembers([]); } }, { key: 'category', value: categoryId, items: data.options.categories.filter((item) => !item.branchId || item.branchId === branchId), change: setCategory }] as const).map((field) => <div className="grid gap-2" key={field.key}><Label htmlFor={field.key}>{t[field.key]}</Label><Select value={field.value} onValueChange={field.change} disabled={busy}><SelectTrigger id={field.key}><SelectValue placeholder={t.choose} /></SelectTrigger><SelectContent>{field.items.map((item) => <SelectItem value={item.id} key={item.id}>{label(item)}</SelectItem>)}</SelectContent></Select></div>)}
            <div className="grid gap-2"><Label htmlFor="country">{t.country}</Label><Input id="country" dir="ltr" value={phoneCountryCode} onChange={(event) => setPhone(event.target.value)} required pattern="\+[1-9][0-9]{0,3}" disabled={busy} /></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>{t.team}</CardTitle><p className="text-sm text-content-muted">{t.teamHelp}</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{data.options.members.length === 0 ? <p>{t.empty}</p> : data.options.members.filter((member) => member.roleCode === 'ADMIN' || member.branchId === branchId).map((member) => <Label className="flex items-center gap-3 rounded-md border border-line-subtle p-3" key={member.id}><Checkbox disabled={busy} checked={memberIds.includes(member.id)} onCheckedChange={(checked) => setMembers((current) => checked === true ? [...current, member.id] : current.filter((id) => id !== member.id))} />{label(member)}</Label>)}</CardContent></Card>
          <div className="flex gap-3"><Button type="submit" disabled={!hydrated || busy || !branchId || !categoryId || memberIds.length === 0}>{busy ? t.saving : t.save}</Button><Button type="button" variant="outline" disabled={busy} onClick={reload}>{t.retry}</Button></div>
        </form>
        <Card><CardHeader><CardTitle>{t.qr}</CardTitle><p className="text-sm text-content-muted">{t.qrHelp}</p></CardHeader><CardContent className="grid gap-4"><div ref={qr} className="mx-auto">{url && <QRCodeSVG value={url} size={224} marginSize={4} title={t.qr} />}</div><p dir="ltr" className="break-all text-center text-xs text-content-muted">{url}</p><Button variant="outline" disabled={!url} onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage(t.copied); } catch { setMessage(t.error); } }}>{t.copy}</Button><Button disabled={!url} onClick={download}>{t.download}</Button></CardContent></Card>
      </div>}
  </section>;
}
