import React from 'react';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { complaintTabsText } from '../../i18n/staff-complaint-tabs';
import { complaintRelationsText } from '../../i18n/staff-complaint-relations';
import { caseLifecycleStatusLabel, caseTypeLabel, complaintStatusLabel, severityLabel, slaStateLabel } from '../../i18n/domain-labels';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { formatDisplayDate, formatDisplayNumber, missingDisplay } from '../../lib/locale-format';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { StaffComplaintRelationsView } from '../../lib/staff-complaint-relations-api';
import type { StaffComplaintComment } from '../../lib/staff-complaint-comments-api';
import type { StaffComplaintSurvey } from '../../lib/staff-complaint-surveys-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { ComplaintAttachmentControls, type ComplaintAttachmentFixtureState } from '../complaint-attachment-controls';
import { ComplaintCommentsPanel, type ComplaintCommentsFixtureState } from '../complaint-comments-panel';
import { ComplaintWorkflowModal, type ComplaintWorkflowFixtureState } from '../complaint-workflow-modal';
import type { LookupFixtureState } from '../customer-vehicle-lookup';
import { PageHeader, StateBlock, StatusBadge, Timeline } from '../shared/ui-primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CaseCapaPanel } from './case-capa-panel';
import { CommunicationTimelinePanel } from './communication-timeline-panel';
import { ComplaintRelationsPanel } from './complaint-relations-panel';
import { ProvenanceCorrectionPanel } from './provenance-correction-panel';

export type ComplaintDetailFixtureState = 'loading' | 'empty' | 'error' | 'denied' | 'notFound';
export type { ComplaintAttachmentFixtureState };
export type { ComplaintCommentsFixtureState };
export type { ComplaintWorkflowFixtureState };

export function ComplaintDetailWorkspace({
  attachmentState,
  comments,
  commentsState,
  commentVisibility,
  detail,
  locale,
  lookupState,
  initialTab = 'work',
  options,
  relations,
  staff,
  state,
  surveys,
  workflowState,
}: {
  attachmentState?: ComplaintAttachmentFixtureState | undefined;
  comments?: StaffComplaintComment[] | null | undefined;
  commentsState?: ComplaintCommentsFixtureState | undefined;
  commentVisibility?: 'INTERNAL' | 'PUBLIC' | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  initialTab?: 'work' | 'communication' | 'details' | undefined;
  lookupState?: LookupFixtureState | undefined;
  options?: ComplaintFormOptions | null | undefined;
  relations?: StaffComplaintRelationsView | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state?: ComplaintDetailFixtureState | undefined;
  surveys?: StaffComplaintSurvey[] | null | undefined;
  workflowState?: ComplaintWorkflowFixtureState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = complaintDetailText[locale];
  const tabs = complaintTabsText[locale];
  const values = detail ? detailValues(detail, t.values, locale) : t.values;
  const caseTimeline = detail?.caseTimeline ?? [];
  const provenance = detail ? provenanceValues(detail, t) : null;
  const effectiveState = state ?? (!detail && !commentsState && !attachmentState && !workflowState ? 'empty' : undefined);

  return (
    <section aria-label={t.title} className="grid gap-4" dir={shell.dir}>
      <PageHeader description={t.subtitle} eyebrow={detail ? values.reference : undefined} title={detail?.subject ?? t.title} />
      {effectiveState ? (
        <StateBlock message={t.states[effectiveState]} tone={effectiveState === 'empty' || effectiveState === 'loading' ? 'neutral' : 'error'} />
      ) : (
        <div className="grid gap-4">
          {detail ? <DetailSummary deadlineLabel={tabs.deadlineState} detail={detail} locale={locale} text={t} values={values} /> : null}
          <Tabs defaultValue={initialTab} dir={shell.dir}>
            <TabsList className="grid h-auto w-full grid-cols-3"><TabsTrigger value="work">{tabs.work}</TabsTrigger><TabsTrigger value="communication">{tabs.communication}</TabsTrigger><TabsTrigger value="details">{tabs.details}</TabsTrigger></TabsList>
            <TabsContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)]" value="work">
              <ComplaintWorkflowModal allowedActions={detail?.allowedActions} complaintId={detail?.id} locale={locale} options={options} staff={staff} status={detail?.status} vehicleNeedsUnavailableReason={Boolean(detail?.vehicleRelated && !detail.vehicle && !detail.vehicleDataUnavailableReason)} workflowState={workflowState} />
              <DetailPanel title={t.sections.ownership} rows={[[t.labels.owner, values.owner], [tabs.deadlineState, values.sla], [t.labels.nextAction, detail?.nextAction ? actionDisplay(detail.nextAction, t, locale) : t.workflow.states.empty]]} />
            </TabsContent>
            <TabsContent className="grid gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" value="communication">
              {detail ? <CommunicationTimelinePanel detail={detail} locale={locale} text={t} /> : <DetailPanel title={t.sections.communicationTimeline}><StateBlock message={t.commentStates.empty} /></DetailPanel>}
              <ComplaintCommentsPanel comments={comments} commentsState={commentsState} complaintId={detail?.id} initialVisibility={commentVisibility} locale={locale} timeZone={detail?.displayTimeZone ?? 'UTC'} />
            </TabsContent>
            <TabsContent className="grid gap-3 lg:grid-cols-2" value="details">
              <div className="grid min-w-0 content-start gap-3">
                <DetailPanel title={t.sections.facts} rows={[[t.labels.reference, values.reference], [t.labels.status, values.status], [t.labels.severity, values.severity]]} />
                <DetailPanel title={t.sections.customer} rows={[[t.labels.customer, detail?.customer.name ?? t.values.customer], [t.labels.contact, detail?.customer.phone ?? t.values.contact], [t.labels.customerNumber, detail?.customer.identifier ?? t.values.none], [t.labels.customerSource, provenance?.customerSource ?? t.values.customerSource], [t.labels.manualCustomer, provenance?.manualCustomer ?? t.values.manualCustomer]]} />
                <DetailPanel title={t.sections.vehicle} rows={vehicleRows(detail, t, provenance)} />
                {detail ? <ProvenanceCorrectionPanel detail={detail} locale={locale} lookupState={lookupState} text={{ ...t.correction, title: tabs.dms }} /> : null}
                <ComplaintAttachmentControls attachmentState={attachmentState} complaintId={detail?.id} locale={locale} />
              </div>
              <aside className="grid min-w-0 content-start gap-3">
                <DetailPanel title={t.sections.caseTimeline} rows={detail?.case ? [[t.labels.caseType, caseTypeLabel(locale, detail.case.type)], [t.labels.status, complaintStatusLabel(locale, detail.case.status)], [t.labels.caseLifecycle, caseLifecycleStatusLabel(locale, detail.case.lifecycleStatus)], [t.labels.caseBranch, detail.case.branchName], [t.labels.caseOwner, detail.case.ownerName ?? t.values.owner]] : [[t.labels.caseLifecycle, t.states.empty]]}>{caseTimeline.length ? <Timeline emptyText={t.states.empty} items={caseTimeline.map((item) => ({ meta: '', text: `${item.label} - ${formatDate(item.at, locale)}` }))} /> : null}</DetailPanel>
                <CaseCapaPanel caseId={detail?.case?.id} caseOwnerId={detail?.case?.ownerId ?? undefined} items={detail?.capaActions ?? []} locale={locale} staff={staff} text={{ ...t.capa, title: tabs.capa }} />
                <DetailPanel title={t.sections.survey} rows={surveyRows(surveys, t, locale)} />
                <ComplaintRelationsPanel complaintId={detail?.id} locale={locale} relations={relations} text={complaintRelationsText[locale]} />
              </aside>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </section>
  );
}

function surveyRows(surveys: StaffComplaintSurvey[] | null | undefined, t: typeof complaintDetailText.en, locale: Locale): readonly (readonly [string, string])[] {
  const latest = surveys?.[0];
  return [
    [t.labels.rating, latest ? `${latest.rating} / 5` : t.values.none],
    [t.labels.submitted, latest ? formatDate(latest.submittedAt, locale) : t.values.none],
  ];
}

function DetailSummary({ deadlineLabel, detail, locale, text, values }: { deadlineLabel: string; detail: StaffComplaintDetailView; locale: Locale; text: typeof complaintDetailText.en; values: typeof complaintDetailText.en.values }) {
  return (
    <section className="grid gap-2 rounded-md border border-line-subtle bg-surface p-3 md:grid-cols-3 xl:grid-cols-7" aria-label={text.sections.facts}>
      <SummaryItem label={text.labels.status} value={<StatusBadge tone="brand">{values.status}</StatusBadge>} />
      <SummaryItem label={text.labels.severity} value={<StatusBadge tone="danger">{values.severity}</StatusBadge>} />
      <SummaryItem label={text.labels.category} value={<bdi>{values.category}</bdi>} />
      <SummaryItem label={text.labels.owner} value={values.owner} />
      <SummaryItem label={deadlineLabel} value={values.sla} />
      <SummaryItem label={text.labels.nextAction} value={detail.nextAction ? actionDisplay(detail.nextAction, text, locale) : text.workflow.states.empty} />
      <SummaryItem label={text.labels.lastUpdated} value={formatDate(detail.updatedAt, locale, detail.displayTimeZone)} />
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <dl className="rounded-sm bg-surface-raised px-3 py-2 text-sm">
      <dt className="text-content-muted">{label}</dt>
      <dd className="mt-1 font-medium text-content-strong">{value}</dd>
    </dl>
  );
}

function vehicleRows(detail: StaffComplaintDetailView | undefined, t: typeof complaintDetailText.en, provenance: ReturnType<typeof provenanceValues> | null): readonly (readonly [string, string])[] {
  if (!detail) {
    return [
      [t.labels.vehicle, t.values.vehicle],
      [t.labels.vin, t.values.vin],
      [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
      [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
      [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
      [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
    ];
  }
  if (!detail.vehicle) {
    return [
      [t.labels.vehicle, detail.vehicleRelated ? detail.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason : t.values.none],
      [t.labels.vin, t.values.none],
      [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
      [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
      [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
      [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
    ];
  }
  return [
    [t.labels.vehicle, `${detail.vehicle.make} ${detail.vehicle.model} ${detail.vehicle.year}`],
    [t.labels.vin, detail.vehicle.vin],
    [t.labels.plate, detail.vehicle.plate],
    [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
    [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
    [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
    [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
  ];
}

function detailValues(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values, locale: Locale): typeof complaintDetailText.en.values {
  return {
    ...fallback,
    reference: detail.reference,
    status: complaintStatusLabel(locale, detail.status),
    severity: severityLabel(locale, detail.severity),
    category: locale === 'ar' ? detail.categoryNameAr || detail.categoryName : detail.categoryName || detail.categoryNameAr,
    owner: detail.assignee ?? fallback.owner,
    sla: slaLabel(detail, fallback, locale),
  };
}

function slaLabel(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values, locale: Locale): string {
  const percent = detail.slaPercentElapsed === null || detail.slaPercentElapsed === undefined ? '' : ` ${formatDisplayNumber(detail.slaPercentElapsed, locale)}%`;
  const due = detail.slaDueAt ? ` - ${formatDisplayDate(detail.slaDueAt, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: detail.displayTimeZone })} (${detail.displayTimeZone})` : '';
  return `${slaStateLabel(locale, detail.slaState)}${percent}${due}` || fallback.sla;
}

function provenanceValues(detail: StaffComplaintDetailView, t: typeof complaintDetailText.en) {
  return {
    customerSource: t.correction.sourceLabels[detail.customerSource],
    manualCustomer: detail.manualCustomer ? t.values.yes : t.values.no,
    vehicleRelated: detail.vehicleRelated ? t.values.yes : t.values.no,
    vehicleSource: t.correction.sourceLabels[detail.vehicleSource ?? 'NONE'],
    manualVehicle: detail.manualVehicle ? t.values.yes : t.values.no,
    vehicleDataUnavailableReason: detail.vehicleDataUnavailableReason ?? t.values.none,
  };
}

function actionDisplay(action: string, text: typeof complaintDetailText.en, locale: Locale): string {
  const key = action.toUpperCase().replaceAll(' ', '_');
  const labels = text.workflow.actionLabels as Partial<Record<string, string>>;
  const label = labels[action] ?? labels[key];
  if (label) return label;
  return locale === 'ar' && /^[\x00-\x7F]+$/.test(action) ? missingDisplay(locale) : action;
}

function formatDate(value: string, locale: Locale, timeZone = 'UTC'): string {
  return `${formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone })} (${timeZone})`;
}

function DetailPanel({ children, rows, title }: { children?: React.ReactNode; rows?: readonly (readonly [string, string])[]; title: string }) {
  return (
    <section className="rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={title}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows ? <DetailRows rows={rows} /> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function DetailRows({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-3 grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div className="grid grid-cols-[minmax(6rem,8rem)_minmax(0,1fr)] gap-2 rounded-sm bg-surface px-3 py-2" key={label}>
          <dt className="text-content-muted">{label}</dt>
          <dd className="break-words font-medium text-content-strong">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
