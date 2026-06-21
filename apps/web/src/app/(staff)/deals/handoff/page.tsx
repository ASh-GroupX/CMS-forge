import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { dealHandoffText } from '../../../../i18n/staff-deal-handoff';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { getDealHandoffBoard, type DealBoardItem, type DealHandoffBoard, type DealHolderBucket, type DealStageBucket } from '../../../../lib/staff-deals-api';
import { advanceDealAction, clearDealBlockerAction, createDealAction, setDealBlockerAction } from './actions';

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
  const holders = data ? holderOptions(data) : [];
  const branches = data ? branchOptions(data) : [];

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
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            <CreateDealForm branches={branches} holders={holders} locale={locale} t={t} />
            {total === 0 && data.stuck.length === 0 && data.currentHolder.length === 0 ? (
              <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground xl:col-span-2" role="status">{t.states.empty}</p>
            ) : null}
            <StageSection buckets={data.byStage} holders={holders} locale={locale} t={t} />
            <HolderSection holders={data.currentHolder} locale={locale} t={t} />
            <DealSection deals={data.stuck} holders={holders} locale={locale} t={t} />
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

function StageSection({ buckets, holders, locale, t }: { buckets: DealStageBucket[]; holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.byStage;
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={buckets.reduce((sum, bucket) => sum + bucket.count, 0)} description={description} locale={locale} title={title} />
      <div className="mt-3 grid gap-2">{buckets.map((bucket) => <StageBucket bucket={bucket} holders={holders} key={bucket.stage} locale={locale} t={t} />)}</div>
    </section>
  );
}

function StageBucket({ bucket, holders, locale, t }: { bucket: DealStageBucket; holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  return (
    <div className="rounded-sm border border-border bg-muted p-2">
      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{bucket.stage}</span><Badge variant="outline">{formatNumber(locale, bucket.count)}</Badge></div>
      {bucket.deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-2 grid gap-2">{bucket.deals.map((deal) => <DealCard deal={deal} holders={holders} key={deal.id} locale={locale} t={t} />)}</div>}
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
          <TableBody>{holders.map((holder) => <TableRow key={holder.currentHolderId}><TableCell>{holder.currentHolderName ?? shortId(holder.currentHolderId)}</TableCell><TableCell className="text-end font-semibold">{formatNumber(locale, holder.count)}</TableCell></TableRow>)}</TableBody>
        </Table>
      )}
    </section>
  );
}

function DealSection({ deals, holders, locale, t }: { deals: DealBoardItem[]; holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.stuck;
  return (
    <section className="rounded-md border border-border bg-background p-3 xl:col-span-2" aria-label={title}>
      <SectionHeader count={deals.length} description={description} locale={locale} title={title} />
      {deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-3 grid gap-2 md:grid-cols-2">{deals.map((deal) => <DealCard deal={deal} holders={holders} key={deal.id} locale={locale} t={t} />)}</div>}
    </section>
  );
}

function CreateDealForm({ branches, holders, locale, t }: { branches: { id: string; name: string }[]; holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  return (
    <form action={createDealAction} className="rounded-md border border-border bg-background p-3 xl:col-span-2">
      <input name="locale" type="hidden" value={locale} />
      <h2 className="text-base font-semibold tracking-normal">{t.actions.create}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <FieldInput label={t.fields.title} name="title" required />
        <SelectInput label={t.fields.branch} name="branchId" options={branches.map((branch) => [branch.id, branch.name])} />
        <SelectInput label={t.fields.holder} name="currentHolderId" options={holders.map((holder) => [holder.currentHolderId, holder.currentHolderName ?? shortId(holder.currentHolderId)])} required />
        <FieldInput label={t.fields.due} name="stageDueAt" required type="datetime-local" />
      </div>
      <Button className="mt-3" size="sm" type="submit">{t.actions.create}</Button>
    </form>
  );
}

function DealCard({ deal, holders, locale, t }: { deal: DealBoardItem; holders: DealHolderBucket[]; locale: Locale; t: Copy }) {
  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{deal.title}</h3><p className="mt-1 text-xs text-muted-foreground">{deal.id}</p></div>
        <Badge variant={deal.blocker ? 'destructive' : 'outline'}>{deal.stage}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Field label={t.fields.holder} value={deal.currentHolderName ?? shortId(deal.currentHolderId)} />
        <Field label={t.fields.delay} value={formatMinutes(locale, deal.delayAgeMinutes)} />
        <Field label={t.fields.due} value={formatDate(deal.stageDueAt)} />
        <Field label={t.fields.updated} value={formatDate(deal.updatedAt)} />
        <Field label={t.fields.owner} value={deal.ownerName ?? shortId(deal.ownerId)} />
        <Field label={t.fields.branch} value={deal.branchName ?? shortId(deal.branchId)} />
      </dl>
      {deal.blocker ? <p className="mt-3 rounded-sm border border-status-warning bg-status-warning/10 px-3 py-2 text-sm text-status-warning">{t.fields.blocker}: {deal.blocker}</p> : null}
      <form action={advanceDealAction} className="mt-3 grid gap-2 border-t border-border pt-3 md:grid-cols-[1fr_1fr_auto]">
        <input name="dealId" type="hidden" value={deal.id} />
        <input name="locale" type="hidden" value={locale} />
        <SelectInput defaultValue={deal.currentHolderId} label={t.fields.holder} name="currentHolderId" options={holders.map((holder) => [holder.currentHolderId, holder.currentHolderName ?? shortId(holder.currentHolderId)])} required />
        <FieldInput defaultValue={toDateTimeLocal(deal.stageDueAt)} label={t.fields.due} name="stageDueAt" required type="datetime-local" />
        <Button className="self-end" disabled={deal.stage === 'POST_DELIVERY' || Boolean(deal.blocker)} size="sm" type="submit">{t.actions.advance}</Button>
      </form>
      <form action={setDealBlockerAction} className="mt-3 grid gap-2">
        <input name="dealId" type="hidden" value={deal.id} />
        <input name="locale" type="hidden" value={locale} />
        <Label className="text-xs font-semibold text-muted-foreground" htmlFor={`blocker-${deal.id}`}>{t.fields.blocker}</Label>
        <Textarea className="min-h-16" defaultValue={deal.blocker ?? ''} id={`blocker-${deal.id}`} name="blocker" />
        <Button className="w-fit" size="sm" type="submit" variant="outline">{t.actions.setBlocker}</Button>
      </form>
      {deal.blocker ? (
        <form action={clearDealBlockerAction} className="mt-2">
          <input name="dealId" type="hidden" value={deal.id} />
          <input name="locale" type="hidden" value={locale} />
          <Button size="sm" type="submit" variant="secondary">{t.actions.clearBlocker}</Button>
        </form>
      ) : null}
    </article>
  );
}

function FieldInput({ defaultValue, label, name, required, type = 'text' }: { defaultValue?: string; label: string; name: string; required?: boolean; type?: string }) {
  return <div className="grid gap-1"><Label className="text-xs font-semibold text-muted-foreground" htmlFor={name}>{label}</Label><Input defaultValue={defaultValue} id={name} name={name} required={required} type={type} /></div>;
}

function SelectInput({ defaultValue, label, name, options, required }: { defaultValue?: string; label: string; name: string; options: [string, string][]; required?: boolean }) {
  return <div className="grid gap-1"><Label className="text-xs font-semibold text-muted-foreground" htmlFor={name}>{label}</Label><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" defaultValue={defaultValue} id={name} name={name} required={required}>{!required ? <option value="" /> : null}{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>;
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

function toDateTimeLocal(value: string): string {
  return value.slice(0, 16);
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

function holderOptions(data: DealHandoffBoard): DealHolderBucket[] {
  const options = new Map<string, DealHolderBucket>();
  for (const deal of data.byStage.flatMap((bucket) => bucket.deals)) {
    options.set(deal.currentHolderId, { currentHolderId: deal.currentHolderId, currentHolderName: deal.currentHolderName, count: 0 });
  }
  for (const holder of data.currentHolder) options.set(holder.currentHolderId, holder);
  return [...options.values()];
}

function branchOptions(data: DealHandoffBoard): { id: string; name: string }[] {
  const options = new Map<string, string>();
  for (const deal of data.byStage.flatMap((bucket) => bucket.deals)) options.set(deal.branchId, deal.branchName ?? shortId(deal.branchId));
  return [...options].map(([id, name]) => ({ id, name }));
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
