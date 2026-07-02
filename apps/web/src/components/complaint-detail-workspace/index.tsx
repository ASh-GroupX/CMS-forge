import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { complaintRelationsText } from '../../i18n/staff-complaint-relations';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { StaffComplaintRelationsView } from '../../lib/staff-complaint-relations-api';
import type { StaffComplaintComment } from '../../lib/staff-complaint-comments-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { ComplaintAttachmentControls, type ComplaintAttachmentPreviewState } from '../complaint-attachment-controls';
import { ComplaintCommentsPanel, type ComplaintCommentsPreviewState } from '../complaint-comments-panel';
import { ComplaintWorkflowModal, type ComplaintWorkflowPreviewState } from '../complaint-workflow-modal';
import type { LookupPreviewState } from '../customer-vehicle-lookup';
import { CaseCapaPanel } from './case-capa-panel';
import { ComplaintRelationsPanel } from './complaint-relations-panel';
import { ProvenanceCorrectionPanel } from './provenance-correction-panel';

export type ComplaintDetailPreviewState = 'loading' | 'empty' | 'error';
export type { ComplaintAttachmentPreviewState };
export type { ComplaintCommentsPreviewState };
export type { ComplaintWorkflowPreviewState };

export function ComplaintDetailWorkspace({
  attachmentState,
  comments,
  commentsState,
  detail,
  locale,
  lookupState,
  options,
  relations,
  staff,
  state,
  workflowState,
}: {
  attachmentState?: ComplaintAttachmentPreviewState | undefined;
  comments?: StaffComplaintComment[] | null | undefined;
  commentsState?: ComplaintCommentsPreviewState | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  lookupState?: LookupPreviewState | undefined;
  options?: ComplaintFormOptions | null | undefined;
  relations?: StaffComplaintRelationsView | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state?: ComplaintDetailPreviewState | undefined;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = complaintDetailText[locale];
  const values = detail ? detailValues(detail, t.values) : t.values;
  const timeline = detail ? detail.timeline : t.timeline.map((label) => ({ at: '', label }));
  const provenance = detail ? provenanceValues(detail, t) : null;

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      {state ? (
        <CardContent className="p-4">
          <p className="text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
            {t.states[state]}
          </p>
        </CardContent>
      ) : (
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[1.1fr_0.9fr]">
          {detail ? <DetailSummary detail={detail} locale={locale} text={t} values={values} /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <DetailPanel title={t.sections.facts} rows={[
              [t.labels.reference, values.reference],
              [t.labels.status, values.status],
              [t.labels.severity, values.severity],
              [t.labels.category, values.category],
            ]} />
            <DetailPanel title={t.sections.ownership} rows={[
              [t.labels.owner, values.owner],
              [t.labels.sla, values.sla],
            ]} />
            <DetailPanel title={t.sections.customer} rows={[
              [t.labels.customer, detail?.customer.name ?? t.values.customer],
              [t.labels.contact, detail?.customer.phone ?? t.values.contact],
              [t.labels.customerNumber, detail?.customer.identifier ?? t.values.none],
              [t.labels.customerSource, provenance?.customerSource ?? t.values.customerSource],
              [t.labels.manualCustomer, provenance?.manualCustomer ?? t.values.manualCustomer],
            ]} />
            <DetailPanel title={t.sections.vehicle} rows={vehicleRows(detail, t, provenance)} />
            {detail ? <ProvenanceCorrectionPanel detail={detail} locale={locale} lookupState={lookupState} text={t.correction} /> : null}
            <ComplaintRelationsPanel complaintId={detail?.id} relations={relations} text={complaintRelationsText[locale]} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.timeline}>
              <h3 className="text-sm font-semibold">{t.sections.timeline}</h3>
              <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                {timeline.map((item, index) => (
                  <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={`${item.label}-${index}`}>
                    {item.label} - {formatDate(item.at, locale)}
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.caseTimeline}>
              <h3 className="text-sm font-semibold">{t.sections.caseTimeline}</h3>
              <DetailRows rows={detail?.case ? [
                [t.labels.caseType, detail.case.type],
                [t.labels.status, detail.case.status],
                [t.labels.caseLifecycle, detail.case.lifecycleStatus],
                [t.labels.caseBranch, detail.case.branchName],
                [t.labels.caseOwner, detail.case.ownerName ?? t.values.owner],
              ] : [[t.labels.caseLifecycle, t.states.empty]]} />
              {detail?.caseTimeline.length ? (
                <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                  {detail.caseTimeline.map((item, index) => (
                    <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={`${item.label}-${index}`}>
                      {item.label} - {formatDate(item.at, locale)}
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
            <CaseCapaPanel caseId={detail?.case?.id} caseOwnerId={detail?.case?.ownerId ?? undefined} items={detail?.capaActions ?? []} locale={locale} staff={staff} text={t.capa} />
            <DetailPanel title={t.sections.survey} rows={[
              [t.labels.rating, t.values.rating],
              [t.labels.submitted, t.values.submitted],
            ]} />
            <ComplaintAttachmentControls attachmentState={attachmentState} complaintId={detail?.id} locale={locale} />
          </div>
          <ComplaintWorkflowModal
            allowedActions={detail?.allowedActions}
            complaintId={detail?.id}
            locale={locale}
            options={options}
            staff={staff}
            status={detail?.status}
            vehicleNeedsUnavailableReason={Boolean(detail?.vehicleRelated && !detail.vehicle && !detail.vehicleDataUnavailableReason)}
            workflowState={workflowState}
          />
          <ComplaintCommentsPanel comments={comments} commentsState={commentsState} complaintId={detail?.id} locale={locale} />
        </CardContent>
      )}
    </Card>
  );
}

function DetailSummary({
  detail,
  locale,
  text,
  values,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
  text: typeof complaintDetailText.en;
  values: typeof complaintDetailText.en.values;
}) {
  const nextAction = detail.allowedActions[0];
  return (
    <section className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-5 xl:col-span-2" aria-label={text.sections.facts}>
      <SummaryItem label={text.labels.status} value={<Badge className="border-transparent bg-brand text-brand-foreground">{values.status}</Badge>} />
      <SummaryItem label={text.labels.severity} value={<Badge className="border-transparent bg-status-error text-white">{values.severity}</Badge>} />
      <SummaryItem label={text.labels.owner} value={values.owner} />
      <SummaryItem label={text.labels.sla} value={values.sla} />
      <SummaryItem label={text.labels.nextAction} value={nextAction ? actionLabel(nextAction) : text.workflow.states.empty} />
      <SummaryItem label={text.labels.lastUpdated} value={formatDate(detail.updatedAt, locale)} />
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <dl className="rounded-sm bg-white px-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
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

function detailValues(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values): typeof complaintDetailText.en.values {
  return {
    ...fallback,
    reference: detail.reference,
    status: detail.status,
    severity: detail.severity,
    category: detail.subject,
    owner: detail.assignee ?? fallback.owner,
    sla: fallback.sla,
  };
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

function actionLabel(action: string): string {
  return action.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function DetailPanel({ rows, title }: { rows: readonly (readonly [string, string])[]; title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={title}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <DetailRows rows={rows} />
    </section>
  );
}

function DetailRows({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-3 grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div className="grid grid-cols-[minmax(6rem,8rem)_minmax(0,1fr)] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="break-words font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
