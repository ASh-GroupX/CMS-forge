'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { complaintStatusLabel, severityLabel } from '../../i18n/domain-labels';
import type { Locale } from '../../i18n/staff-shell';
import { formatDisplayDate, formatDisplayNumber, missingDisplay } from '../../lib/locale-format';
import { linkStaffComplaintRelation, unlinkStaffComplaintRelation, type ComplaintRelationState, type SafeComplaintRelationItem, type StaffComplaintRelationsView } from '../../lib/staff-complaint-relations-api';

type FeedbackState = Exclude<ComplaintRelationState, 'ready'>;

export type ComplaintRelationsText = {
  title: string;
  candidates: string;
  related: string;
  window: string;
  link: string;
  unlink: string;
  unlinkConfirm: string;
  fields: { branch: string; created: string; customer: string; updated: string };
  states: Record<FeedbackState, string>;
};

export function ComplaintRelationsPanel({ complaintId, locale, relations, text }: { complaintId?: string | undefined; locale: Locale; relations?: StaffComplaintRelationsView | undefined; text: ComplaintRelationsText }) {
  const [view, setView] = useState<StaffComplaintRelationsView>(relations ?? { candidates: [], related: [], state: 'empty', windowDays: 30 });
  const [busyId, setBusyId] = useState<string | null>(null);

  async function link(candidate: SafeComplaintRelationItem) {
    if (!complaintId) return;
    setBusyId(candidate.id);
    const result = await linkStaffComplaintRelation(complaintId, candidate.id);
    setBusyId(null);
    if (!result.ok) {
      setView((current) => ({ ...current, state: result.error.status === 401 || result.error.status === 403 ? 'denied' : 'error' }));
      return;
    }
    setView((current) => ({
      ...current,
      candidates: current.candidates.filter((item) => item.id !== candidate.id),
      related: current.related.some((item) => item.id === candidate.id) ? current.related : [...current.related, candidate],
      state: 'success',
    }));
  }

  async function unlink(item: SafeComplaintRelationItem) {
    if (!complaintId || !globalThis.confirm(text.unlinkConfirm.replace('{reference}', item.referenceNumber))) return;
    setBusyId(item.id);
    const result = await unlinkStaffComplaintRelation(complaintId, item.id);
    setBusyId(null);
    if (!result.ok) {
      setView((current) => ({ ...current, state: result.error.status === 401 || result.error.status === 403 ? 'denied' : 'error' }));
      return;
    }
    setView((current) => ({
      ...current,
      candidates: current.candidates.some((candidate) => candidate.id === item.id) ? current.candidates : [...current.candidates, item],
      related: current.related.filter((related) => related.id !== item.id),
      state: 'success',
    }));
  }

  const feedback = view.state === 'ready' ? null : text.states[view.state];
  return (
    <section className="rounded-md border border-line-subtle bg-surface p-3" aria-label={text.title}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-content-strong">{text.title}</h3>
          <p className="mt-1 text-xs text-content-muted">{text.window.replace('{days}', formatDisplayNumber(view.windowDays, locale))}</p>
        </div>
        {view.candidates.length ? <StatusBadge tone="warning">{view.candidates.length}</StatusBadge> : null}
      </div>
      {feedback ? <StateBlock className="mt-3" message={feedback} tone={view.state === 'error' || view.state === 'denied' ? 'error' : view.state === 'success' ? 'success' : 'neutral'} /> : null}
      <RelationList action={link} actionLabel={text.link} busyId={busyId} complaintId={complaintId} items={view.candidates} locale={locale} title={text.candidates} text={text} />
      <RelationList action={unlink} actionLabel={text.unlink} busyId={busyId} complaintId={complaintId} items={view.related} locale={locale} title={text.related} text={text} />
    </section>
  );
}

function RelationList({ action, actionLabel, busyId, complaintId, items, locale, text, title }: { action?: ((item: SafeComplaintRelationItem) => void) | undefined; actionLabel?: string | undefined; busyId?: string | null | undefined; complaintId?: string | undefined; items: SafeComplaintRelationItem[]; locale: Locale; text: ComplaintRelationsText; title: string }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-content-muted">{title}</h4>
      {!items.length ? null : (
      <ol className="mt-2 grid gap-2">
        {items.map((item) => (
          <li className="rounded-sm border border-line-subtle bg-surface-raised p-3 text-sm" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-content-strong">{item.referenceNumber}</div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge tone="brand">{complaintStatusLabel(locale, item.status)}</StatusBadge>
                <StatusBadge tone={item.severity === 'CRITICAL' ? 'danger' : 'warning'}>{severityLabel(locale, item.severity)}</StatusBadge>
              </div>
            </div>
            <p className="mt-1 text-content-muted">{item.subject}</p>
            <dl className="mt-2 grid gap-1 text-xs text-content-muted sm:grid-cols-4">
              <Meta label={text.fields.customer} value={item.customerName ?? missingDisplay(locale)} />
              <Meta label={text.fields.branch} value={item.branchName} />
              <Meta label={text.fields.created} value={formatDisplayDate(item.createdAt, locale)} />
              <Meta label={text.fields.updated} value={formatDisplayDate(item.updatedAt, locale)} />
            </dl>
            {action ? <Button className="mt-3" disabled={!complaintId || busyId === item.id} onClick={() => action(item)} size="sm" type="button">{actionLabel ?? ''}</Button> : null}
          </li>
        ))}
      </ol>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-content-muted">{label}</dt><dd className="break-words font-medium text-content-strong">{value}</dd></div>;
}
