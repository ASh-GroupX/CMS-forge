import React from 'react';
import { complaintDetailText } from '../i18n/staff-complaint-detail';
import { confirmationText } from '../i18n/staff-confirmations';
import type { Locale } from '../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../lib/staff-detail-api';

export type ComplaintDetailPreviewState = 'loading' | 'empty' | 'error';
export type ComplaintCommentsPreviewState = 'loading' | 'empty' | 'error';
export type ComplaintAttachmentPreviewState = 'loading' | 'empty' | 'error' | 'pending' | 'clean' | 'rejected';
export type ComplaintWorkflowPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'conflict' | 'validation';

export function ComplaintDetailWorkspace({
  attachmentState,
  commentsState,
  detail,
  locale,
  state,
  workflowState,
}: {
  attachmentState?: ComplaintAttachmentPreviewState | undefined;
  commentsState?: ComplaintCommentsPreviewState | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  state?: ComplaintDetailPreviewState | undefined;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const t = complaintDetailText[locale];
  const values = detail ? detailValues(detail, t.values) : t.values;
  const timeline = detail ? detail.timeline : t.timeline;

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      {state ? (
        <p className="p-4 text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
          {t.states[state]}
        </p>
      ) : (
        <div className="grid gap-3 p-4 xl:grid-cols-[1.1fr_0.9fr]">
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
                {timeline.map((item) => (
                  <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={item}>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
            <DetailPanel title={t.sections.survey} rows={[
              [t.labels.rating, t.values.rating],
              [t.labels.submitted, t.values.submitted],
            ]} />
            <AttachmentControls attachmentState={attachmentState} locale={locale} />
          </div>
          <WorkflowActionModal locale={locale} workflowState={workflowState} />
          <CommentsPanels commentsState={commentsState} locale={locale} />
        </div>
      )}
    </section>
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
      <dl className="mt-3 grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AttachmentControls({ attachmentState, locale }: { attachmentState?: ComplaintAttachmentPreviewState | undefined; locale: Locale }) {
  const t = complaintDetailText[locale];
  const scanState = attachmentState === 'clean' || attachmentState === 'rejected' ? attachmentState : 'pending';

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.attachments}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t.sections.attachments}</h3>
        <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{t.badges[scanState]}</span>
      </div>
      {attachmentState === 'loading' || attachmentState === 'empty' || attachmentState === 'error' ? (
        <p className="mt-3 text-sm text-slate-600" role={attachmentState === 'error' ? 'alert' : 'status'}>
          {t.attachmentStates[attachmentState]}
        </p>
      ) : (
        <dl className="mt-3 grid gap-2 text-sm">
          {[
            [t.labels.file, t.values.file],
            [t.labels.scan, t.badges[scanState]],
          ].map(([label, value]) => (
            <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">
          {t.attachmentActions.upload}
        </button>
        <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">
          {t.attachmentActions.download}
        </button>
      </div>
      <ul className="mt-3 grid gap-1 text-sm text-slate-600">
        {t.attachmentActions.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}

function WorkflowActionModal({ locale, workflowState }: { locale: Locale; workflowState?: ComplaintWorkflowPreviewState | undefined }) {
  const t = complaintDetailText[locale];
  const confirm = confirmationText[locale].workflowCloseReject;
  const message =
    workflowState && workflowState !== 'validation' ? t.workflow.states[workflowState] : workflowState === 'validation' ? t.workflow.validation : null;

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3 xl:col-span-2" role="dialog" aria-label={t.sections.workflow}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{t.sections.workflow}</h3>
          <p className="mt-1 text-xs text-slate-600">{t.workflow.authority}</p>
        </div>
      </div>
      {message ? (
        <p className="mt-3 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" role={workflowState === 'success' || workflowState === 'loading' ? 'status' : 'alert'}>
          {message}
        </p>
      ) : null}
      {workflowState === 'conflict' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">
            {t.workflow.reload}
          </button>
          <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">
            {t.workflow.retry}
          </button>
        </div>
      ) : null}
      {workflowState === 'empty' ? null : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {t.workflow.actions.map((action) => (
              <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" key={action} type="button">
                {action}
              </button>
            ))}
          </div>
          <label className="mt-3 grid gap-1 text-sm font-medium">
            {t.workflow.comment}
            <textarea className="min-h-20 rounded-sm border border-slate-300 px-2 py-2" />
            {workflowState === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.workflow.validation}</span> : null}
          </label>
          {workflowState === 'validation' ? (
            <section className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert" aria-label={confirm.title}>
              <p className="font-semibold">{confirm.title}</p>
              <p className="mt-1">{confirm.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-sm border border-red-300 bg-white px-3 py-2 text-sm font-semibold" type="button">{confirm.confirmClose}</button>
                <button className="rounded-sm border border-red-300 bg-white px-3 py-2 text-sm font-semibold" type="button">{confirm.confirmReject}</button>
                <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" type="button">{confirm.cancel}</button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function CommentsPanels({ commentsState, locale }: { commentsState?: ComplaintCommentsPreviewState | undefined; locale: Locale }) {
  const t = complaintDetailText[locale];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:col-span-2" aria-label={`${t.sections.internalComments} / ${t.sections.publicUpdates}`}>
      {commentsState ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:col-span-2" role={commentsState === 'error' ? 'alert' : 'status'}>
          {t.commentStates[commentsState]}
        </p>
      ) : (
        <>
          <CommentPanel badge={t.badges.internal} body={t.values.internalBody} locale={locale} title={t.sections.internalComments} />
          <CommentPanel badge={t.badges.public} body={t.values.publicBody} locale={locale} title={t.sections.publicUpdates} />
        </>
      )}
    </section>
  );
}

function CommentPanel({ badge, body, locale, title }: { badge: string; body: string; locale: Locale; title: string }) {
  const t = complaintDetailText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{badge}</span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        {[
          [t.labels.author, t.values.author],
          [t.labels.time, t.values.time],
          [t.labels.visibility, badge],
        ].map(([label, value]) => (
          <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-sm bg-white px-3 py-2 text-sm text-slate-700">{body}</p>
    </section>
  );
}
