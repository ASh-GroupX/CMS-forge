'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { confirmationText } from '../../i18n/staff-confirmations';
import type { Locale } from '../../i18n/staff-shell';
import {
  submitStaffComplaintWorkflowAction,
  type ComplaintStatus,
  type ComplaintTransitionAction,
} from '../../lib/staff-complaints-api';

export type ComplaintWorkflowPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'conflict' | 'validation';

type SubmitState = ComplaintWorkflowPreviewState | undefined;

const previewActions: ComplaintTransitionAction[] = [
  'ACCEPT_INTAKE',
  'SEND_BACK',
  'ASSIGN_INVESTIGATION',
  'ADD_INVESTIGATION_UPDATE',
  'RESOLVE',
  'CLOSE',
  'REJECT_AS_INVALID',
  'REOPEN',
];

export function ComplaintWorkflowModal({
  allowedActions,
  complaintId,
  locale,
  status,
  workflowState,
}: {
  allowedActions?: ComplaintTransitionAction[] | undefined;
  complaintId?: string | undefined;
  locale: Locale;
  status?: ComplaintStatus | string | undefined;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const t = complaintDetailText[locale];
  const confirm = confirmationText[locale].workflowCloseReject;
  const [comment, setComment] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>();
  const visibleState = submitState ?? workflowState;
  const actions = allowedActions?.length ? allowedActions : workflowState ? previewActions : [];
  const message =
    visibleState && visibleState !== 'validation' ? t.workflow.states[visibleState] : visibleState === 'validation' ? t.workflow.validation : null;

  async function submit(action: ComplaintTransitionAction) {
    if (!comment.trim()) {
      setSubmitState('validation');
      return;
    }
    if (!complaintId || !status) {
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    const result = await submitStaffComplaintWorkflowAction(complaintId, { action, reason: comment, status: status as ComplaintStatus });
    if (result.ok) {
      setSubmitState('success');
      return;
    }
    if (result.error.status === 409 || result.error.code === 'COMPLAINT_INVALID_TRANSITION') {
      setSubmitState('conflict');
      return;
    }
    setSubmitState(result.error.code === 'VALIDATION_FAILED' ? 'validation' : 'error');
  }

  return (
    <section className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 xl:col-span-2" role="dialog" aria-label={t.sections.workflow}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{t.sections.workflow}</h3>
          <p className="mt-1 text-xs text-slate-600">{t.workflow.authority}</p>
        </div>
      </div>
      {message ? (
        <p className="mt-3 break-words rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" role={visibleState === 'success' || visibleState === 'loading' ? 'status' : 'alert'}>
          {message}
        </p>
      ) : null}
      {visibleState === 'conflict' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <a href="">{t.workflow.reload}</a>
          </Button>
          <Button type="button" variant="outline" onClick={() => setSubmitState(undefined)}>
            {t.workflow.retry}
          </Button>
        </div>
      ) : null}
      {actions.length ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button disabled={visibleState === 'loading'} key={action} type="button" variant="outline" onClick={() => { void submit(action); }}>
                {actionLabel(action, t.workflow.actions)}
              </Button>
            ))}
          </div>
          <Label className="mt-3 grid min-w-0 gap-1">
            {t.workflow.comment}
            <Textarea className="min-h-20 min-w-0" value={comment} onChange={(event) => setComment(event.target.value)} />
            {visibleState === 'validation' ? <span className="text-xs font-semibold text-status-error">{t.workflow.validation}</span> : null}
          </Label>
          {visibleState === 'validation' ? (
            <section className="mt-3 break-words rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert" aria-label={confirm.title}>
              <p className="font-semibold">{confirm.title}</p>
              <p className="mt-1">{confirm.body}</p>
            </section>
          ) : null}
        </>
      ) : (
        <p className="mt-3 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" role="status">
          {t.workflow.states.empty}
        </p>
      )}
    </section>
  );
}

function actionLabel(action: ComplaintTransitionAction, labels: readonly string[]): string {
  const index = previewActions.indexOf(action);
  return index >= 0 ? labels[index] ?? action : action;
}
