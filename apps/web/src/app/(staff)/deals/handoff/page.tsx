import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dealHandoffText } from '../../../../i18n/staff-deal-handoff';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { getDealHandoffBoard, type DealBoardItem, type DealHandoffBoard, type DealHolderBucket, type DealStageBucket } from '../../../../lib/staff-deals-api';

type SearchParams = { locale?: string | string[] };
type Copy = (typeof dealHandoffText)[Locale];

export default async function DealHandoffPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const data = await getDealHandoffBoard({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return <DealHandoffBoardView data={data} locale={locale} />;
}

export function DealHandoffBoardView({ data, locale }: { data: DealHandoffBoard | null; locale: Locale }) {
  const shell = staffShellText[locale];
  const t = dealHandoffText[locale];
  const total = data ? data.byStage.reduce((sum, bucket) => sum + bucket.count, 0) : 0;

  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          {data ? <Badge className="border-brand/30 bg-brand/10 text-brand" variant="outline">{formatCount(locale, total, t.total)}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {data === null ? (
          <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{t.states.error}</p>
        ) : total === 0 && data.stuck.length === 0 && data.currentHolder.length === 0 ? (
          <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{t.states.empty}</p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            <StageSection buckets={data.byStage} locale={locale} t={t} />
            <HolderSection holders={data.currentHolder} locale={locale} t={t} />
            <DealSection deals={data.stuck} locale={locale} t={t} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DealHandoffLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = dealHandoffText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-muted-foreground" role="status">{t.states.loading}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div className="h-28 animate-pulse rounded-md border border-border bg-muted" key={index} />)}
      </CardContent>
    </Card>
  );
}

function StageSection({ buckets, locale, t }: { buckets: DealStageBucket[]; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.byStage;
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={buckets.reduce((sum, bucket) => sum + bucket.count, 0)} description={description} locale={locale} title={title} />
      <div className="mt-3 grid gap-2">{buckets.map((bucket) => <StageBucket bucket={bucket} key={bucket.stage} locale={locale} t={t} />)}</div>
    </section>
  );
}

function StageBucket({ bucket, locale, t }: { bucket: DealStageBucket; locale: Locale; t: Copy }) {
  return (
    <div className="rounded-sm border border-border bg-muted p-2">
      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{bucket.stage}</span><Badge variant="outline">{formatNumber(locale, bucket.count)}</Badge></div>
      {bucket.deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-2 grid gap-2">{bucket.deals.map((deal) => <DealCard deal={deal} key={deal.id} locale={locale} t={t} />)}</div>}
    </div>
  );
}

function HolderSection({ holders, locale, t }: { holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.currentHolder;
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={holders.length} description={description} locale={locale} title={title} />
      {holders.length === 0 ? <EmptyLine t={t} /> : (
        <Table className="mt-3">
          <TableHeader><TableRow><TableHead className="text-start">{t.fields.holder}</TableHead><TableHead className="text-end">{t.fields.count}</TableHead></TableRow></TableHeader>
          <TableBody>{holders.map((holder) => <TableRow key={holder.currentHolderId}><TableCell title={holder.currentHolderId}>{shortId(holder.currentHolderId)}</TableCell><TableCell className="text-end font-semibold">{formatNumber(locale, holder.count)}</TableCell></TableRow>)}</TableBody>
        </Table>
      )}
    </section>
  );
}

function DealSection({ deals, locale, t }: { deals: DealBoardItem[]; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.stuck;
  return (
    <section className="rounded-md border border-border bg-background p-3 xl:col-span-2" aria-label={title}>
      <SectionHeader count={deals.length} description={description} locale={locale} title={title} />
      {deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-3 grid gap-2 md:grid-cols-2">{deals.map((deal) => <DealCard deal={deal} key={deal.id} locale={locale} t={t} />)}</div>}
    </section>
  );
}

function DealCard({ deal, locale, t }: { deal: DealBoardItem; locale: Locale; t: Copy }) {
  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{deal.title}</h3><p className="mt-1 text-xs text-muted-foreground">{deal.id}</p></div>
        <Badge variant={deal.blocker ? 'destructive' : 'outline'}>{deal.stage}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Field label={t.fields.holder} title={deal.currentHolderId} value={shortId(deal.currentHolderId)} />
        <Field label={t.fields.delay} value={formatMinutes(locale, deal.delayAgeMinutes)} />
        <Field label={t.fields.due} value={formatDate(deal.stageDueAt)} />
        <Field label={t.fields.updated} value={formatDate(deal.updatedAt)} />
        <Field label={t.fields.owner} title={deal.ownerId} value={shortId(deal.ownerId)} />
        <Field label={t.fields.branch} title={deal.branchId} value={shortId(deal.branchId)} />
      </dl>
      {deal.blocker ? <p className="mt-3 rounded-sm border border-status-warning bg-status-warning/10 px-3 py-2 text-sm text-status-warning">{t.fields.blocker}: {deal.blocker}</p> : null}
    </article>
  );
}

function SectionHeader({ count, description, locale, title }: { count: number; description: string; locale: Locale; title: string }) {
  return <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-semibold tracking-normal">{title}</h2><p className="text-xs text-muted-foreground">{description}</p></div><Badge variant="outline">{formatNumber(locale, count)}</Badge></div>;
}

function Field({ label, title, value }: { label: string; title?: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="break-words" title={title}>{value}</dd></div>;
}

function EmptyLine({ t }: { t: Copy }) {
  return <p className="mt-2 rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">{t.states.sectionEmpty}</p>;
}

function formatCount(locale: Locale, value: number, label: string): string {
  return `${formatNumber(locale, value)} ${label}`;
}

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatMinutes(locale: Locale, value: number): string {
  return `${formatNumber(locale, value)}m`;
}

function formatDate(value: string): string {
  return value.slice(0, 16).replace('T', ' ');
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
