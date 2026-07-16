'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowFields, destructiveActions, requiredFields, transitionRequest } from '../complaint-workflow-modal';
import { complaintBoardText } from '../../i18n/staff-complaint-board';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { confirmationText } from '../../i18n/staff-confirmations';
import { formatBoardText } from '../../i18n/staff-task-board';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { ComplaintBoardCard, ComplaintBoardTransition, ComplaintTransitionPayload, TransitionComplaintResult } from '../../lib/staff-complaint-board-api';
import type { ComplaintTransitionAction } from '../../lib/staff-complaints-api';

export type PendingDrop = { card: ComplaintBoardCard; stageName: string; transition: ComplaintBoardTransition };

type DialogState = 'idle' | 'validation' | 'conflict' | 'denied' | 'notFound' | 'error';

export function TransitionDialog({ locale, onClose, onSuccess, options, pending, staff, submit }: {
  locale: Locale;
  onClose: () => void;
  onSuccess: (stageName: string) => void;
  options?: ComplaintFormOptions | null | undefined;
  pending: PendingDrop | null;
  staff?: AssignableStaff[] | null | undefined;
  submit: (complaintId: string, payload: ComplaintTransitionPayload) => Promise<TransitionComplaintResult>;
}) {
  const t = complaintBoardText[locale];
  const wf = complaintDetailText[locale].workflow;
  const actionLabels = wf.actionLabels as Partial<Record<ComplaintTransitionAction, string>>;
  const confirm = confirmationText[locale].workflowCloseReject;
  const dir = staffShellText[locale].dir;
  const action = pending?.transition.action;
  const [state, setState] = useState<DialogState>('idle');
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setState('idle'); }, [pending]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || !action) return;
    const form = new FormData(event.currentTarget);
    if (requiredFields(action, false).some((field) => !fieldText(form, field)) || (destructiveActions.has(action) && form.get('confirmDestructive') !== 'on')) {
      setState('validation');
      return;
    }
    const { status, ...rest } = transitionRequest(action, pending.card.status, form);
    startTransition(async () => {
      const result = await submit(pending.card.id, { fromStatus: status, ...rest });
      if (result.status === 'success') { onSuccess(pending.stageName); return; }
      if (result.status === 'conflict') { setState('conflict'); return; }
      if (result.status === 'invalid') { setState('validation'); return; }
      setState(result.status === 'denied' ? 'denied' : result.status === 'not_found' ? 'notFound' : 'error');
    });
  }

  const message = state === 'validation' ? t.dialog.validation : state === 'denied' ? t.toasts.denied : state === 'notFound' ? t.toasts.notFound : state === 'error' ? t.toasts.failed : null;

  return (
    <Dialog onOpenChange={(open) => { if (!open) onClose(); }} open={pending !== null}>
      <DialogContent dir={dir}>
        <DialogHeader>
          <DialogTitle>{action ? actionLabels[action] ?? action : ''}</DialogTitle>
          <DialogDescription>
            {pending && state !== 'conflict' ? formatBoardText(t.dialog.help, { reference: pending.card.referenceNumber, stage: pending.stageName }) : null}
            {state === 'conflict' ? t.dialog.conflict : null}
          </DialogDescription>
        </DialogHeader>
        {state === 'conflict' ? (
          <DialogFooter>
            <Button onClick={onClose} type="button">{t.dialog.close}</Button>
          </DialogFooter>
        ) : (
          <form className="grid gap-3" onSubmit={onSubmit}>
            {action ? <WorkflowFields action={action} locale={locale} options={options} staff={staff} text={wf} vehicleNeedsUnavailableReason={false} /> : null}
            {action && destructiveActions.has(action) ? (
              <label className="grid gap-1 rounded-sm border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm text-content-strong">
                <span className="font-semibold">{confirm.title}</span>
                <span className="flex items-center gap-2">
                  <input className="size-4" name="confirmDestructive" type="checkbox" />
                  {action === 'CLOSE' ? confirm.confirmClose : confirm.confirmReject}
                </span>
              </label>
            ) : null}
            {message ? <p className="text-xs font-semibold text-status-error" role="alert">{message}</p> : null}
            <DialogFooter className="gap-2">
              <Button onClick={onClose} type="button" variant="outline">{t.dialog.cancel}</Button>
              <Button disabled={isPending} type="submit">{isPending ? t.dialog.submitting : t.dialog.confirm}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function fieldText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
