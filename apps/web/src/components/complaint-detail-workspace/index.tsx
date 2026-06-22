import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { ComplaintAttachmentControls, type ComplaintAttachmentPreviewState } from '../complaint-attachment-controls';
import { ComplaintCommentsPanel, type ComplaintCommentsPreviewState } from '../complaint-comments-panel';
import { ComplaintWorkflowModal, type ComplaintWorkflowPreviewState } from '../complaint-workflow-modal';
import { CaseCapaPanel } from './case-capa-panel';

export type ComplaintDetailPreviewState = 'loading' | 'empty' | 'error';
export type { ComplaintAttachmentPreviewState };
export type { ComplaintCommentsPreviewState };
export type { ComplaintWorkflowPreviewState };

export function ComplaintDetailWorkspace({
  attachmentState,
  commentsState,
  detail,
  locale,
  staff,
  state,
  workflowState,
}: {
  attachmentState?: ComplaintAttachmentPreviewState | undefined;
  commentsState?: ComplaintCommentsPreviewState | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  staff?: AssignableStaff[] | null | undefined;
  state?: ComplaintDetailPreviewState | undefined;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = complaintDetailText[locale];
  const values = detail ? detailValues(detail, t.values) : t.values;
  const timeline = detail ? detail.timeline : t.timeline;

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
              [t.labels.customer, t.values.customer],
              [t.labels.contact, t.values.contact],
            ]} />
            <DetailPanel title={t.sections.vehicle} rows={[
              [t.labels.vehicle, t.values.vehicle],
              [t.labels.vin, t.values.vin],
            ]} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.timeline}>
              <h3 className="text-sm font-semibold">{t.sections.timeline}</h3>
              <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                {timeline.map((item, index) => (
                  <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={`${item}-${index}`}>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.caseTimeline}>
              <h3 className="text-sm font-semibold">{t.sections.caseTimeline}</h3>
              <DetailRows rows={detail?.case ? [
                [t.labels.caseId, detail.case.id],
                [t.labels.caseType, detail.case.type],
                [t.labels.status, detail.case.status],
                [t.labels.caseLifecycle, detail.case.lifecycleStatus],
                [t.labels.caseBranch, detail.case.branchName],
                [t.labels.caseOwner, detail.case.ownerName ?? t.values.owner],
              ] : [[t.labels.caseId, t.states.empty]]} />
              {detail?.caseTimeline.length ? (
                <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                  {detail.caseTimeline.map((item, index) => (
                    <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={`${item}-${index}`}>
                      {item}
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
            <ComplaintAttachmentControls attachmentState={attachmentState} locale={locale} />
          </div>
          <ComplaintWorkflowModal locale={locale} workflowState={workflowState} />
          <ComplaintCommentsPanel commentsState={commentsState} locale={locale} />
        </CardContent>
      )}
    </Card>
  );
}

function detailValues(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values): typeof complaintDetailText.en.values {
  return {
    ...fallback,
    reference: detail.reference,
    status: detail.status,
    severity: detail.severity,
    category: detail.subject,
    owner: detail.assignee ?? fallback.owner,
    sla: detail.branch,
  };
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
        <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
