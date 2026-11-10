'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApiKeysText } from '@/i18n/staff-admin-api-keys';
import type { Locale } from '@/i18n/staff-shell';
import { createDataApiKeyAction, loadDataApiKeysAction, revokeDataApiKeyAction, testDataApiKeyAction } from '@/app/(staff)/admin/api-keys/actions';
import type { BranchOption, DataApiKey, DataResource, DataScope } from '@/lib/staff-integration-keys-api';

const resources: DataResource[] = ['customers', 'complaints', 'tasks', 'appointments'];
type Initial = Awaited<ReturnType<typeof loadDataApiKeysAction>>;

export function ApiKeysWorkspace({ initial, locale }: { initial: Initial; locale: Locale }) {
  const t = adminApiKeysText[locale];
  const [keys, setKeys] = useState<DataApiKey[]>(initial.status === 'ok' ? initial.keys : []);
  const [branches, setBranches] = useState<BranchOption[]>(initial.status === 'ok' ? initial.branches : []);
  const [loadStatus, setLoadStatus] = useState(initial.status);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<DataScope[]>(resources.map((resource): DataScope => `${resource}:read`));
  const [allBranches, setAllBranches] = useState(true);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [issued, setIssued] = useState<{ key: DataApiKey; secret: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'create' | 'revoke' | 'test' | 'load' | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  async function refresh() {
    setBusy('load');
    const result = await loadDataApiKeysAction();
    setLoadStatus(result.status);
    if (result.status === 'ok') { setKeys(result.keys); setBranches(result.branches); }
    setBusy(null);
  }

  function toggleScope(scope: DataScope) {
    setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  }

  async function create() {
    setNotice('');
    if (!name.trim() || scopes.length === 0 || (!allBranches && branchIds.length === 0)) {
      setNotice(t.validation); return;
    }
    setBusy('create');
    const result = await createDataApiKeyAction({ name: name.trim(), scopes, allBranches, branchIds: allBranches ? [] : branchIds });
    setBusy(null);
    if (result.status !== 'ok') { setNotice(t[result.status]); return; }
    setIssued({ key: result.key, secret: result.secret });
    setKeys((current) => [result.key, ...current]);
    setName('');
  }

  async function revoke() {
    if (!revokeId) return;
    setBusy('revoke'); setNotice('');
    const result = await revokeDataApiKeyAction(revokeId);
    setBusy(null); setRevokeId(null);
    if (result.status !== 'ok') { setNotice(t[result.status]); return; }
    if (issued?.key.id === revokeId) setIssued(null);
    await refresh();
  }

  async function test() {
    if (!issued) return;
    setBusy('test'); setNotice('');
    const selected = issued.key.scopes.map((scope) => scope.split(':')[0] as DataResource);
    const results = await Promise.all(selected.map((resource) => testDataApiKeyAction(issued.secret, resource)));
    setBusy(null);
    const denied = results.find((result) => result.status !== 'ok');
    if (denied) { setNotice(denied.status === 'forbidden' ? t.testDenied : denied.status === 'unauthorized' ? t.testInvalid : t[denied.status]); return; }
    const pages = results.filter((result): result is Extract<typeof result, { status: 'ok' }> => result.status === 'ok');
    setNotice(`${pages.every((page) => page.rowCount === 0) ? t.testEmpty : t.testSuccess}${pages.some((page) => page.hasMore) ? ` ${t.testMore}` : ''}`);
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice(t.copied); }
    catch { setNotice(t.copiedError); }
  }

  const sampleResource = issued?.key.scopes[0]?.split(':')[0] ?? 'customers';
  const sample = issued && origin
    ? `curl -H "Authorization: Bearer ${issued.secret}" "${origin}/api/external-data/${sampleResource}?limit=100"`
    : '';

  return <section aria-label={t.title} className="mx-auto max-w-5xl space-y-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <div>
      <h1 className="text-2xl font-semibold text-content-strong">{t.title}</h1>
      <p className="mt-1 text-sm text-content-muted">{t.intro}</p>
    </div>

    {loadStatus !== 'ok' && <Alert variant="destructive"><AlertDescription>{loadStatus === 'unauthorized' ? t.unauthorized : loadStatus === 'forbidden' ? t.forbidden : t.loadError}</AlertDescription></Alert>}
    {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}

    {loadStatus === 'ok' && <Card className="border-line-subtle bg-surface">
      <CardHeader><CardTitle>{t.createTitle}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="api-key-name">{t.name}</Label>
          <Input id="api-key-name" maxLength={100} placeholder={t.namePlaceholder} value={name} onChange={(event) => setName(event.target.value)} /></div>
        <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium text-content-strong">{t.data}</legend>
          <div className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => {
            const scope: DataScope = `${resource}:read`;
            return <label className="flex items-center gap-3 text-sm text-content-strong" key={resource}>
              <Checkbox aria-label={t.resources[resource]} checked={scopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} />{t.resources[resource]}
            </label>;
          })}</div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium text-content-strong">{t.branches}</legend>
          <label className="flex items-center gap-3 text-sm"><Checkbox checked={allBranches} onCheckedChange={(checked) => setAllBranches(checked === true)} />{t.allBranches}</label>
          {!allBranches && (branches.length ? <div className="grid gap-3 sm:grid-cols-2">{branches.map((branch) => <label className="flex items-center gap-3 text-sm" key={branch.id}>
            <Checkbox checked={branchIds.includes(branch.id)} onCheckedChange={(checked) => setBranchIds((current) => checked === true ? [...current, branch.id] : current.filter((id) => id !== branch.id))} />
            {locale === 'ar' ? branch.nameAr : branch.nameEn}
          </label>)}</div> : <p className="text-sm text-content-muted">{t.noBranches}</p>)}
        </fieldset>
        <Button disabled={busy !== null || !name.trim() || scopes.length === 0 || (!allBranches && branchIds.length === 0)} onClick={() => void create()}>{busy === 'create' ? t.creating : t.create}</Button>
      </CardContent>
    </Card>}

    {issued && <Card className="border-status-success-border bg-status-success-bg">
      <CardHeader><CardTitle>{t.createdTitle}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-content-strong">{t.createdHelp}</p>
        <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label={t.copyKey} dir="ltr" readOnly value={issued.secret} />
          <Button onClick={() => void copy(issued.secret)} variant="outline">{t.copyKey}</Button></div>
        <div className="space-y-2"><Label htmlFor="api-request">{t.sampleTitle}</Label>
          <Textarea id="api-request" dir="ltr" readOnly rows={3} value={sample} />
          <div className="flex flex-wrap gap-2"><Button onClick={() => void copy(sample)} variant="outline">{t.copyRequest}</Button>
            <Button disabled={busy !== null} onClick={() => void test()}>{busy === 'test' ? t.testing : t.test}</Button></div>
        </div>
      </CardContent>
    </Card>}

    <Card className="border-line-subtle bg-surface"><CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>{t.issuedTitle}</CardTitle>
      <Button disabled={busy !== null} onClick={() => void refresh()} size="sm" variant="outline">{busy === 'load' ? t.loading : t.refresh}</Button></CardHeader>
      <CardContent>{keys.length ? <ul className="divide-y divide-line-subtle">{keys.map((key) => <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={key.id}>
        <div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-content-strong">{key.name}</strong>
          <Badge variant={key.revokedAt ? 'outline' : 'default'}>{key.revokedAt ? t.revoked : t.active}</Badge></div>
          <p className="font-mono text-xs text-content-muted" dir="ltr">{key.keyPrefix}…</p>
          <p className="text-xs text-content-muted">{t.scope}: {key.scopes.map((scope) => t.resources[scope.split(':')[0] as DataResource]).join(', ')}</p>
          <p className="text-xs text-content-muted">{t.branches}: {key.allBranches ? t.all : key.branchIds.map((id) => branches.find((branch) => branch.id === id)?.[locale === 'ar' ? 'nameAr' : 'nameEn'] ?? id).join(', ')}</p>
          <p className="text-xs text-content-muted">{t.createdAt}: {formatDate(key.createdAt, locale)} · {t.lastUsed}: {key.lastUsedAt ? formatDate(key.lastUsedAt, locale) : t.never}</p>
        </div>{!key.revokedAt && <Button onClick={() => setRevokeId(key.id)} size="sm" variant="outline">{t.revoke}</Button>}
      </li>)}</ul> : <p className="py-6 text-center text-sm text-content-muted">{t.empty}</p>}</CardContent></Card>

    <Dialog open={revokeId !== null} onOpenChange={(open) => { if (!open && busy !== 'revoke') setRevokeId(null); }}>
      <DialogContent dir={locale === 'ar' ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.confirmTitle}</DialogTitle><DialogDescription>{t.confirmBody}</DialogDescription></DialogHeader>
        <DialogFooter><Button disabled={busy === 'revoke'} onClick={() => setRevokeId(null)} variant="outline">{t.cancel}</Button>
          <Button disabled={busy === 'revoke'} onClick={() => void revoke()}>{busy === 'revoke' ? t.revoking : t.confirm}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
