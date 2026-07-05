'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Field, StateBlock } from '../shared/ui-primitives';
import { StaffPicker } from '../shared/staff-picker';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { confirmationText } from '../../i18n/staff-confirmations';
import type { Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import {
  submitStaffComplaintWorkflowAction,
  type ComplaintStatus,
  type ComplaintTransitionAction,
  type StaffComplaintTransitionRequest,
} from '../../lib/staff-complaints-api';

export type ComplaintWorkflowPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'conflict' | 'validation';

type SubmitState = ComplaintWorkflowPreviewState | undefined;
type TransitionField = Exclude<keyof StaffComplaintTransitionRequest, 'status' | 'action'>;

const previewActions: ComplaintTransitionAction[] = ['ACCEPT_INTAKE', 'APPROVE_AND_ROUTE', 'SEND_BACK', 'ASSIGN_INVESTIGATION', 'ADD_INVESTIGATION_UPDATE', 'RESOLVE', 'CLOSE', 'REJECT_AS_INVALID', 'REOPEN'];
const transitionFields: TransitionField[] = ['reason', 'targetBranchId', 'targetDepartmentId', 'ownerId', 'resolutionType', 'resolutionSummary', 'customerCommunicationStatus', 'vehicleDataUnavailableReason'];
const reasonRequired = new Set<ComplaintTransitionAction>(['APPROVE_AND_ROUTE', 'SEND_BACK', 'ASSIGN_INVESTIGATION', 'CLOSE', 'REOPEN', 'ROUTE_AGAIN', 'REJECT_AS_INVALID', 'REJECT_AFTER_REVIEW', 'REJECT_AFTER_INVESTIGATION', 'REJECT_RESOLUTION']);
const ownerRequired = new Set<ComplaintTransitionAction>(['APPROVE_AND_ROUTE', 'ASSIGN_INVESTIGATION']);
const resolutionRequired = new Set<ComplaintTransitionAction>(['RESOLVE', 'RESOLVE_DIRECTLY']);

export function ComplaintWorkflowModal({
  allowedActions,
  complaintId,
  locale,
  options,
  staff,
  status,
  vehicleNeedsUnavailableReason = false,
  workflowState,
}: {
  allowedActions?: ComplaintTransitionAction[] | undefined;
  complaintId?: string | undefined;
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  staff?: AssignableStaff[] | null | undefined;
  status?: ComplaintStatus | string | undefined;
  vehicleNeedsUnavailableReason?: boolean | undefined;
  workflowState?: ComplaintWorkflowPreviewState | undefined;
}) {
  const t = complaintDetailText[locale];
  const confirm = confirmationText[locale].workflowCloseReject;
  const [selectedAction, setSelectedAction] = useState<ComplaintTransitionAction>();
  const [submitState, setSubmitState] = useState<SubmitState>();
  const visibleState = submitState ?? workflowState;
  const actions = allowedActions?.length ? allowedActions : workflowState ? previewActions : [];
  const action = selectedAction && actions.includes(selectedAction) ? selectedAction : actions[0];
  const message = visibleState && visibleState !== 'validation' ? t.workflow.states[visibleState] : visibleState === 'validation' ? t.workflow.validation : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    if (!complaintId || !status) {
      setSubmitState('error');
      return;
    }
    const form = new FormData(event.currentTarget);
    if (requiredFields(action, vehicleNeedsUnavailableReason).some((field) => !fieldText(form, field))) {
      setSubmitState('validation');
      return;
    }

    setSubmitState('loading');
    const result = await submitStaffComplaintWorkflowAction(complaintId, transitionRequest(action, status as ComplaintStatus, form));
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
    <section className="min-w-0 rounded-md border border-line-subtle bg-surface p-3" aria-label={t.sections.workflow}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{t.sections.workflow}</h3>
          <p className="mt-1 text-xs text-content-muted">{t.workflow.authority}</p>
        </div>
      </div>
      {message ? <StateBlock className="mt-3" message={message} tone={stateTone(visibleState)} /> : null}
      {visibleState === 'conflict' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline"><a href={complaintHref(complaintId, locale)}>{t.workflow.reload}</a></Button>
          <Button type="button" variant="outline" onClick={() => setSubmitState(undefined)}>{t.workflow.retry}</Button>
        </div>
      ) : null}
      {actions.length && action ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((item) => (
              <Button disabled={visibleState === 'loading'} key={item} type="button" variant={item === action ? 'default' : 'outline'} onClick={() => { setSelectedAction(item); setSubmitState(undefined); }}>
                {actionLabel(item, t.workflow.actionLabels)}
              </Button>
            ))}
          </div>
          <form className="mt-3 grid gap-3" onSubmit={(event) => { void submit(event); }}>
            <WorkflowFields action={action} locale={locale} options={options} staff={staff} text={t.workflow} vehicleNeedsUnavailableReason={vehicleNeedsUnavailableReason} />
            {visibleState === 'validation' ? <span className="text-xs font-semibold text-status-error">{t.workflow.validation}</span> : null}
            <Button disabled={visibleState === 'loading'} type="submit">{t.workflow.submit}</Button>
          </form>
          {visibleState === 'validation' ? (
            <section className="mt-3 break-words rounded-sm border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error" role="alert" aria-label={confirm.title}>
              <p className="font-semibold">{confirm.title}</p>
              <p className="mt-1">{confirm.body}</p>
            </section>
          ) : null}
        </>
      ) : (
        <StateBlock className="mt-3" message={t.workflow.states.empty} />
      )}
    </section>
  );
}

function WorkflowFields({ action, locale, options, staff, text, vehicleNeedsUnavailableReason }: { action: ComplaintTransitionAction; locale: Locale; options?: ComplaintFormOptions | null | undefined; staff?: AssignableStaff[] | null | undefined; text: typeof complaintDetailText.en.workflow; vehicleNeedsUnavailableReason: boolean }) {
  const fields = requiredFields(action, vehicleNeedsUnavailableReason);
  if (fields.length === 0) return <StateBlock message={text.noExtraFields} />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => {
        if (field === 'targetBranchId') return <OptionField key={field} label={text.fields.targetBranchId} name={field} options={options?.branches ?? []} locale={locale} />;
        if (field === 'targetDepartmentId') return <OptionField key={field} label={text.fields.targetDepartmentId} name={field} options={options?.departments ?? []} locale={locale} />;
        if (field === 'ownerId') return <StaffPicker key={field} label={text.fields.ownerId} locale={locale} name={field} staff={staff} t={text.ownerPicker} />;
        if (field === 'reason' || field === 'resolutionSummary' || field === 'vehicleDataUnavailableReason') return <TextField area key={field} label={text.fields[field]} name={field} />;
        return <TextField key={field} label={text.fields[field]} name={field} />;
      })}
    </div>
  );
}

function requiredFields(action: ComplaintTransitionAction, vehicleNeedsUnavailableReason: boolean): TransitionField[] {
  return [
    ...(reasonRequired.has(action) ? ['reason' as const] : []),
    ...(action === 'APPROVE_AND_ROUTE' ? ['targetBranchId' as const, 'targetDepartmentId' as const] : []),
    ...(ownerRequired.has(action) ? ['ownerId' as const] : []),
    ...(resolutionRequired.has(action) ? ['resolutionType' as const, 'resolutionSummary' as const] : []),
    ...(action === 'CLOSE' ? ['customerCommunicationStatus' as const] : []),
    ...(action === 'CLOSE' && vehicleNeedsUnavailableReason ? ['vehicleDataUnavailableReason' as const] : []),
  ];
}

function transitionRequest(action: ComplaintTransitionAction, status: ComplaintStatus, form: FormData): StaffComplaintTransitionRequest {
  const fields: Partial<Record<TransitionField, string>> = {};
  for (const field of transitionFields) {
    const value = fieldText(form, field);
    if (value) fields[field] = value;
  }
  return { status, action, ...fields };
}

function TextField({ area = false, label, name }: { area?: boolean; label: string; name: TransitionField }) {
  const id = `workflow-${name}`;
  return (
    <Field id={id} label={label}>
      {area ? <Textarea className="min-h-20 min-w-0" id={id} name={name} required /> : <Input id={id} name={name} required />}
    </Field>
  );
}

function OptionField({ label, locale, name, options }: { label: string; locale: Locale; name: TransitionField; options: ComplaintFormOption[] }) {
  const id = `workflow-${name}`;
  return (
    <Label className="grid min-w-0 gap-1" htmlFor={id}>
      {label}
      <select className="flex h-9 min-w-0 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm" id={id} name={name} required>
        <option value="" />
        {options.map((option) => <option key={option.id} value={option.id}>{locale === 'ar' ? option.nameAr : option.nameEn}</option>)}
      </select>
    </Label>
  );
}

function fieldText(form: FormData, field: TransitionField): string {
  const value = form.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

function actionLabel(action: ComplaintTransitionAction, labels: Partial<Record<ComplaintTransitionAction, string>>): string {
  return labels[action] ?? action;
}

function complaintHref(complaintId: string | undefined, locale: Locale): string {
  return complaintId ? `/complaints/${encodeURIComponent(complaintId)}?locale=${locale}` : `?locale=${locale}`;
}

function stateTone(state: SubmitState): 'conflict' | 'error' | 'loading' | 'neutral' | 'success' {
  if (state === 'success') return 'success';
  if (state === 'conflict') return 'conflict';
  if (state === 'error' || state === 'validation') return 'error';
  if (state === 'loading') return 'loading';
  return 'neutral';
}
