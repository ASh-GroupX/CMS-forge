import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { confirmationText } from '../../i18n/staff-confirmations';
import type { Locale } from '../../i18n/staff-shell';

export type ComplaintWorkflowPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'conflict' | 'validation';

export function ComplaintWorkflowModal({
  locale,
  workflowState,
}: {
  locale: Locale;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
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
          <Button type="button" variant="outline">
            {t.workflow.reload}
          </Button>
          <Button type="button" variant="outline">
            {t.workflow.retry}
          </Button>
        </div>
      ) : null}
      {workflowState === 'empty' ? null : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {t.workflow.actions.map((action) => (
              <Button key={action} type="button" variant="outline">
                {action}
              </Button>
            ))}
          </div>
          <Label className="mt-3 grid gap-1">
            {t.workflow.comment}
            <Textarea className="min-h-20" />
            {workflowState === 'validation' ? <span className="text-xs font-semibold text-status-error">{t.workflow.validation}</span> : null}
          </Label>
          {workflowState === 'validation' ? (
            <section className="mt-3 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert" aria-label={confirm.title}>
              <p className="font-semibold">{confirm.title}</p>
              <p className="mt-1">{confirm.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline">{confirm.confirmClose}</Button>
                <Button type="button" variant="outline">{confirm.confirmReject}</Button>
                <Button type="button" variant="outline">{confirm.cancel}</Button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
