'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { linkStaffComplaintRelation, type ComplaintRelationState, type SafeComplaintRelationItem, type StaffComplaintRelationsView } from '../../lib/staff-complaint-relations-api';

type FeedbackState = Exclude<ComplaintRelationState, 'ready'>;

export type ComplaintRelationsText = {
  title: string;
  candidates: string;
  related: string;
  window: string;
  link: string;
  fields: { branch: string; created: string; updated: string };
  states: Record<FeedbackState, string>;
};

export function ComplaintRelationsPanel({ complaintId, relations, text }: { complaintId?: string | undefined; relations?: StaffComplaintRelationsView | undefined; text: ComplaintRelationsText }) {
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

  const feedback = view.state === 'ready' ? null : text.states[view.state];
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-3 md:col-span-2" aria-label={text.title}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{text.title}</h3>
          <p className="mt-1 text-xs text-slate-600">{text.window.replace('{days}', String(view.windowDays))}</p>
        </div>
        {view.candidates.length ? <Badge variant="secondary">{view.candidates.length}</Badge> : null}
      </div>
      {feedback ? <p className="mt-3 text-sm text-slate-700" role={view.state === 'error' || view.state === 'denied' ? 'alert' : 'status'}>{feedback}</p> : null}
      <RelationList action={link} busyId={busyId} complaintId={complaintId} items={view.candidates} title={text.candidates} text={text} />
      <RelationList items={view.related} title={text.related} text={text} />
    </section>
  );
}

function RelationList({ action, busyId, complaintId, items, text, title }: { action?: ((item: SafeComplaintRelationItem) => void) | undefined; busyId?: string | null | undefined; complaintId?: string | undefined; items: SafeComplaintRelationItem[]; text: ComplaintRelationsText; title: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-slate-600">{title}</h4>
      <ol className="mt-2 grid gap-2">
        {items.map((item) => (
          <li className="rounded-sm border border-slate-200 bg-white p-3 text-sm" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-slate-900">{item.referenceNumber}</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{item.status}</Badge>
                <Badge variant={item.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>{item.severity}</Badge>
              </div>
            </div>
            <p className="mt-1 text-slate-700">{item.subject}</p>
            <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
              <Meta label={text.fields.branch} value={item.branchId} />
              <Meta label={text.fields.created} value={item.createdAt.slice(0, 10)} />
              <Meta label={text.fields.updated} value={item.updatedAt.slice(0, 10)} />
            </dl>
            {action ? <Button className="mt-3" disabled={!complaintId || busyId === item.id} onClick={() => action(item)} size="sm" type="button">{text.link}</Button> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-800">{value}</dd></div>;
}
