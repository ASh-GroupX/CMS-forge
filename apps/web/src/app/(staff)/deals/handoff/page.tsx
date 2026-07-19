import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AssignmentPicker } from '../../../../components/shared/assignment-picker';
import { StateBlock } from '../../../../components/shared/ui-primitives';
import { dealStageLabel } from '../../../../i18n/domain-labels';
import { dealHandoffText } from '../../../../i18n/staff-deal-handoff';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { formatDisplayDate, formatDurationMinutes } from '../../../../lib/locale-format';
import { getAssignableStaff, type AssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getStaffAssignmentOptions, type StaffAssignmentOptions } from '../../../../lib/staff-assignment-options-api';
import { getComplaintFormOptions, type ComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getDealHandoffBoardLoadResult, type DealBoardItem, type DealHandoffBoard, type DealHolderBucket, type DealStageBucket } from '../../../../lib/staff-deals-api';
import { advanceDealAction, clearDealBlockerAction, createDealAction, setDealBlockerAction, updateDealDetailsAction } from './actions';
import { DealActionHistoryList, DealActionSummary } from './deal-action-history';

type SearchParams = { deal?: string | string[]; locale?: string | string[] };
type Copy = (typeof dealHandoffText)[Locale];
type DealFeedback = 'denied' | 'error' | 'success';
export default async function DealHandoffPage({ cookieHeader, fetchImpl, searchParams }: { cookieHeader?: string; fetchImpl?: typeof fetch; searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const [data, staff, options, assignmentOptions] = await Promise.all([getDealHandoffBoardLoadResult(apiInput), getAssignableStaff(apiInput), getComplaintFormOptions(apiInput), getStaffAssignmentOptions(apiInput)]);
  return <DealHandoffBoardView assignmentOptions={assignmentOptions} data={data.status === 'ready' ? data.data : null} feedback={resolveFeedback(readParam(params?.deal))} loadState={data.status === 'ready' ? undefined : data.status} locale={locale} options={options} staff={staff} />;
}

export function DealHandoffBoardView({ assignmentOptions, data, feedback, loadState, locale, options, staff }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; data: DealHandoffBoard | null; feedback?: DealFeedback | undefined; loadState?: 'denied' | 'error' | undefined; locale: Locale; options?: ComplaintFormOptions | null | undefined; staff?: AssignableStaff[] | null | undefined }) {
  const shell = staffShellText[locale];
  const t = dealHandoffText[locale];
  const total = data ? data.byStage.reduce((sum, bucket) => sum + bucket.count, 0) : 0;
  const branches = branchOptions(options, locale);

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
        {feedback ? <StateBlock className="mb-3" message={dealFeedbackMessage(t, feedback)} tone={feedback === 'success' ? 'success' : 'error'} /> : null}
        {data === null ? (
          <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{loadState === 'denied' ? t.states.denied : t.states.error}</p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            <CreateDealForm assignmentOptions={assignmentOptions} branches={branches} locale={locale} t={t} />
            {total === 0 && data.stuck.length === 0 && data.currentHolder.length === 0 ? (
              <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground xl:col-span-2" role="status">{t.states.empty}</p>
            ) : null}
            <StageSection assignmentOptions={assignmentOptions} buckets={data.byStage} locale={locale} staff={staff} t={t} />
            <HolderSection holders={data.currentHolder} locale={locale} t={t} />
            <DealSection assignmentOptions={assignmentOptions} deals={data.stuck} locale={locale} staff={staff} t={t} />
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

function StageSection({ assignmentOptions, buckets, locale, staff, t }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; buckets: DealStageBucket[]; locale: Locale; staff?: AssignableStaff[] | null | undefined; t: Copy }) {
  const [title, description] = t.sections.byStage;
  const activeBuckets = buckets.filter((bucket) => bucket.deals.length > 0);
  const emptyBuckets = buckets.filter((bucket) => bucket.deals.length === 0);
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={buckets.reduce((sum, bucket) => sum + bucket.count, 0)} description={description} locale={locale} title={title} />
      <div className="mt-3 grid gap-2">
        {activeBuckets.map((bucket) => <StageBucket assignmentOptions={assignmentOptions} bucket={bucket} key={bucket.stage} locale={locale} staff={staff} t={t} />)}
        {emptyBuckets.length ? <EmptyStageBuckets buckets={emptyBuckets} locale={locale} t={t} /> : null}
      </div>
    </section>
  );
}

function EmptyStageBuckets({ buckets, locale, t }: { buckets: DealStageBucket[]; locale: Locale; t: Copy }) {
  return (
    <details className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.states.sectionEmpty}</summary>
      <ul className="mt-2 grid gap-2 text-sm text-content-muted">
        {buckets.map((bucket) => <li className="flex items-center justify-between gap-2" key={bucket.stage}><span title={bucket.stage}>{dealStageLabel(locale, bucket.stage)}</span><span>{formatNumber(locale, bucket.count)}</span></li>)}
      </ul>
    </details>
  );
}

function StageBucket({ assignmentOptions, bucket, locale, staff, t }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; bucket: DealStageBucket; locale: Locale; staff?: AssignableStaff[] | null | undefined; t: Copy }) {
  return (
    <div className="rounded-sm border border-border bg-muted p-2">
      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold" title={bucket.stage}>{dealStageLabel(locale, bucket.stage)}</span><Badge variant="outline">{formatNumber(locale, bucket.count)}</Badge></div>
      {bucket.deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-2 grid gap-2">{bucket.deals.map((deal) => <DealCard assignmentOptions={assignmentOptions} deal={deal} key={deal.id} locale={locale} staff={staff} t={t} />)}</div>}
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
          <TableBody>{holders.map((holder) => <TableRow key={holder.currentHolderId}><TableCell>{holder.currentHolderName ?? t.states.unknownStaff}</TableCell><TableCell className="text-end font-semibold">{formatNumber(locale, holder.count)}</TableCell></TableRow>)}</TableBody>
        </Table>
      )}
    </section>
  );
}

function DealSection({ assignmentOptions, deals, locale, staff, t }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; deals: DealBoardItem[]; locale: Locale; staff?: AssignableStaff[] | null | undefined; t: Copy }) {
  const [title, description] = t.sections.stuck;
  return (
    <section className="rounded-md border border-border bg-background p-3 xl:col-span-2" aria-label={title}>
      <SectionHeader count={deals.length} description={description} locale={locale} title={title} />
      {deals.length === 0 ? <EmptyLine t={t} /> : <div className="mt-3 grid gap-2 md:grid-cols-2">{deals.map((deal) => <DealCard assignmentOptions={assignmentOptions} deal={deal} key={deal.id} locale={locale} staff={staff} t={t} />)}</div>}
    </section>
  );
}

function CreateDealForm({ assignmentOptions, branches, locale, t }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; branches: { id: string; name: string }[]; locale: Locale; t: Copy }) {
  return (
    <details className="rounded-sm border border-line-subtle bg-surface-raised xl:col-span-2">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-content-strong">{t.actions.create}</summary>
      <form action={createDealAction} className="grid gap-3 border-t border-line-subtle p-3">
        <input name="locale" type="hidden" value={locale} />
        <div className="grid gap-3 md:grid-cols-4">
          <FieldInput label={t.fields.title} name="title" required />
          <SelectInput label={t.fields.branch} name="branchId" options={branches.map((branch) => [branch.id, branch.name])} />
          <div className="md:col-span-2"><AssignmentPicker departmentName="assignedDepartmentId" locale={locale} options={assignmentOptions} userName="currentHolderId" /></div>
          <FieldInput label={t.fields.due} name="stageDueAt" required type="datetime-local" />
        </div>
        <Button className="w-fit" size="sm" type="submit">{t.actions.create}</Button>
      </form>
    </details>
  );
}

function DealCard({ assignmentOptions, deal, locale, staff, t }: { assignmentOptions?: StaffAssignmentOptions | null | undefined; deal: DealBoardItem; locale: Locale; staff?: AssignableStaff[] | null | undefined; t: Copy }) {
  const canAdvance = deal.stage !== 'POST_DELIVERY' && !deal.blocker;
  return (
    <article className="rounded-sm border border-line-subtle bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="break-words text-base font-semibold text-content-strong">{deal.title}</h3></div>
        <Badge title={deal.stage} variant={deal.blocker ? 'destructive' : 'outline'}>{dealStageLabel(locale, deal.stage)}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 rounded-sm bg-surface-raised p-3 text-sm md:grid-cols-2">
        <Field label={t.fields.holder} value={staffDisplay(deal.currentHolderId, deal.currentHolderName, staff, locale, t)} />
        <Field label={t.fields.department} value={locale === 'ar' ? deal.assignedDepartmentNameAr ?? deal.assignedDepartmentName ?? t.states.unassigned : deal.assignedDepartmentName ?? deal.assignedDepartmentNameAr ?? t.states.unassigned} />
        <Field label={t.fields.delay} value={formatMinutes(locale, deal.delayAgeMinutes)} />
        <Field label={t.fields.due} value={formatDate(deal.stageDueAt, locale)} />
        <Field label={t.fields.updated} value={formatDate(deal.updatedAt, locale)} />
        <Field label={t.fields.owner} value={staffDisplay(deal.ownerId, deal.ownerName, staff, locale, t)} />
        <Field label={t.fields.branch} value={deal.branchName ?? t.states.unknownBranch} />
      </dl>
      {deal.blocker ? <p className="mt-3 rounded-sm border border-status-warning bg-status-warning/10 px-3 py-2 text-sm text-status-warning">{t.fields.blocker}: {deal.blocker}</p> : null}
      <DealActionSummary action={deal.lastAction} locale={locale} t={t} />
      <div className="mt-3 grid gap-2 border-t border-line-subtle pt-3">
        <form action={advanceDealAction}>
          <input name="dealId" type="hidden" value={deal.id} />
          <input name="locale" type="hidden" value={locale} />
          <input name="currentHolderId" type="hidden" value={deal.currentHolderId ?? ''} />
          <input name="assignedDepartmentId" type="hidden" value={deal.assignedDepartmentId ?? ''} />
          <input name="stageDueAt" type="hidden" value={toDateTimeLocal(deal.stageDueAt)} />
          <NoteField id={`advance-note-${deal.id}`} label={t.fields.updateNote} />
          <Button className="mt-2" disabled={!canAdvance} size="sm" type="submit">{t.actions.advance}</Button>
        </form>
        <details className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.actions.updateDetails}</summary>
          <form action={updateDealDetailsAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input name="dealId" type="hidden" value={deal.id} />
            <input name="locale" type="hidden" value={locale} />
            <div className="md:col-span-2"><AssignmentPicker departmentName="assignedDepartmentId" initialDepartmentId={deal.assignedDepartmentId ?? ''} initialUserId={deal.currentHolderId ?? ''} locale={locale} options={assignmentOptions} userName="currentHolderId" /></div>
            <FieldInput defaultValue={toDateTimeLocal(deal.stageDueAt)} label={t.fields.due} name="stageDueAt" required type="datetime-local" />
            <NoteField className="md:col-span-2" id={`details-note-${deal.id}`} label={t.fields.updateNote} />
            <Button className="self-end" size="sm" type="submit">{t.actions.saveDetails}</Button>
          </form>
          <form action={setDealBlockerAction} className="mt-3 grid gap-2">
            <input name="dealId" type="hidden" value={deal.id} />
            <input name="locale" type="hidden" value={locale} />
            <Label className="text-xs font-semibold text-muted-foreground" htmlFor={`blocker-${deal.id}`}>{t.fields.blocker}</Label>
            <Textarea className="min-h-16" defaultValue={deal.blocker ?? ''} id={`blocker-${deal.id}`} name="blocker" />
            <NoteField id={`blocker-note-${deal.id}`} label={t.fields.updateNote} />
            <Button className="w-fit" size="sm" type="submit" variant="outline">{t.actions.setBlocker}</Button>
          </form>
          {deal.blocker ? (
            <form action={clearDealBlockerAction} className="mt-2 grid gap-2">
              <input name="dealId" type="hidden" value={deal.id} />
              <input name="locale" type="hidden" value={locale} />
              <NoteField id={`clear-note-${deal.id}`} label={t.fields.updateNote} />
              <Button size="sm" type="submit" variant="secondary">{t.actions.clearBlocker}</Button>
            </form>
          ) : null}
          <DealActionHistoryList history={deal.history} locale={locale} t={t} />
        </details>
      </div>
    </article>
  );
}

function FieldInput({ defaultValue, label, name, required, type = 'text' }: { defaultValue?: string; label: string; name: string; required?: boolean; type?: string }) {
  return <div className="grid gap-1"><Label className="text-xs font-semibold text-muted-foreground" htmlFor={name}>{label}</Label><Input defaultValue={defaultValue} id={name} name={name} required={required} type={type} /></div>;
}

function NoteField({ className = '', id, label }: { className?: string; id: string; label: string }) {
  return <div className={`grid gap-1 ${className}`}><Label className="text-xs font-semibold text-muted-foreground" htmlFor={id}>{label}</Label><Textarea className="min-h-16" id={id} name="updateNote" required /></div>;
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
  return formatDurationMinutes(value, locale);
}

function formatDate(value: string, locale: Locale): string {
  return formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function toDateTimeLocal(value: string): string {
  return value.slice(0, 16);
}

function branchOptions(options: ComplaintFormOptions | null | undefined, locale: Locale): { id: string; name: string }[] {
  return (options?.branches ?? []).map((branch) => ({ id: branch.id, name: locale === 'ar' ? branch.nameAr : branch.nameEn }));
}

function staffDisplay(id: string | null, fallback: string | null, staff: AssignableStaff[] | null | undefined, locale: Locale, t: Copy): string {
  if (!id) return fallback ?? t.states.unassigned;
  const person = staff?.find((item) => item.userId === id);
  if (!person) return fallback ?? t.states.unknownStaff;
  const name = locale === 'ar' ? person.displayNameAr : person.displayName;
  const role = locale === 'ar' ? person.roleAr : person.role;
  const branch = locale === 'ar' ? person.branchLabelAr : person.branchLabel;
  return [name, role, branch].filter(Boolean).join(' - ');
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveFeedback(value: string | undefined): DealFeedback | undefined {
  return value === 'success' || value === 'error' || value === 'denied' ? value : undefined;
}

function dealFeedbackMessage(t: Copy, feedback: DealFeedback): string {
  const states = t.states as typeof t.states & Partial<Record<'actionError' | 'actionSuccess', string>>;
  if (feedback === 'success') return states.actionSuccess ?? t.states.empty;
  if (feedback === 'denied') return states.denied ?? t.states.error;
  return states.actionError ?? t.states.error;
}
