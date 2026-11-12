import React from 'react';
import { loadRedirectQueue } from './actions';
import { resolveLocale } from '../../../i18n/staff-shell';
import { redirectComplaintsText } from '../../../i18n/redirect-complaints';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams?: Promise<{ locale?: string; filter?: string; page?: string }> }) {
  const params = await searchParams; const locale = resolveLocale(params?.locale); const t = redirectComplaintsText[locale];
  const filter = params?.filter ?? 'unclaimed'; const page = Number(params?.page ?? 1); const result = await loadRedirectQueue(filter, page);
  return <section dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto grid max-w-6xl gap-5"><header><h1 className="text-2xl font-semibold">{t.title}</h1><p className="mt-2 text-sm text-content-muted">{t.intro}</p></header>
    <nav className="flex flex-wrap gap-2" aria-label={t.title}>{(['unclaimed', 'mine', 'claimed', 'all'] as const).map((key) => <Button asChild variant={filter === key ? 'default' : 'outline'} key={key}><a aria-current={filter === key ? 'page' : undefined} href={`?locale=${locale}&filter=${key}`}>{t[key]}</a></Button>)}</nav>
    {result.status !== 'ok' ? <p role="alert">{t[result.status]}</p> : result.data.items.length === 0 ? <Card><CardContent className="p-8 text-center text-content-muted">{t.empty}</CardContent></Card> : <div className="grid gap-3">{result.data.items.map((item) => <Card key={item.id}><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2"><CardTitle className="text-base tabular-nums">{item.referenceNumber}</CardTitle><Badge variant="outline">{item.claim?.assignedUserId ? t.claimed : t.unclaimed}</Badge></CardHeader><CardContent className="grid items-center gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"><div><p className="font-medium">{item.customerName}</p><p dir="ltr" className="text-sm text-content-muted">{item.customerPhone}</p></div><p className="text-sm">{item.vehicleMake} {item.vehicleModel}</p><p className="line-clamp-2 text-sm text-content-muted">{item.descriptionEn}</p><Button asChild variant="outline"><a href={`/redirect-complaints/${encodeURIComponent(item.id)}?locale=${locale}`}>{t.open}</a></Button></CardContent></Card>)}</div>}
    {result.status === 'ok' && <nav className="flex gap-3" aria-label={t.title}>{page > 1 && <Button asChild variant="outline"><a href={`?locale=${locale}&filter=${filter}&page=${page - 1}`}>{t.previous}</a></Button>}{result.data.hasMore && <Button asChild variant="outline"><a href={`?locale=${locale}&filter=${filter}&page=${page + 1}`}>{t.more}</a></Button>}</nav>}
  </section>;
}
