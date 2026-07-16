'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { complaintStatusLabel } from '../../i18n/domain-labels';
import { formatBoardText } from '../../i18n/staff-task-board';
import type { ComplaintBoardText } from '../../i18n/staff-complaint-board';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';
import type { ComplaintCardDetail, ComplaintTimelineItem } from '../../lib/staff-complaint-board-detail-api';
import { CardDetailSheet, type CardDetailMeta } from '../board-detail/card-detail-sheet';
import { ownerLabel } from './board-card';

export type ComplaintCardDetailAction = (complaintId: string) => Promise<ComplaintCardDetail>;

type LoadState = { status: 'loading' } | { status: 'ready'; timeline: ComplaintTimelineItem[] } | { status: 'error' };

// Quick-look drawer for a ticket. Read-only: the drop-driven workflow stays on the
// board and full actions live on the linked detail page (B6). Days-active is pure
// display arithmetic over the card's createdAt — no state decision is made here.
export function ComplaintDetailDrawer({ card, locale, t, detailAction, onClose }: {
  card: ComplaintBoardCard | null;
  locale: Locale;
  t: ComplaintBoardText;
  detailAction: ComplaintCardDetailAction;
  onClose: () => void;
}) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    setLoad({ status: 'loading' });
    detailAction(card.id)
      .then((result) => { if (!cancelled) setLoad(result.status === 'ready' ? { status: 'ready', timeline: result.timeline } : { status: 'error' }); })
      .catch(() => { if (!cancelled) setLoad({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [card, detailAction]);

  if (!card) return null;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: card.displayTimeZone });
  const days = Math.max(0, Math.floor((Date.now() - new Date(card.createdAt).getTime()) / 86_400_000));
  const meta: CardDetailMeta[] = [
    { label: t.detail.meta.status, value: complaintStatusLabel(locale, card.status) },
    { label: t.detail.meta.severity, value: t.card.severity[card.severity] },
    { label: t.detail.meta.sla, value: t.card.sla[card.slaState], tone: card.slaState === 'BREACHED' ? 'danger' : 'default' },
    { label: t.detail.meta.owner, value: ownerLabel(card, t.card.ownerFallback) },
    { label: t.detail.meta.branch, value: card.branchName },
    { label: t.detail.meta.daysActive, value: days === 1 ? t.detail.daysActive.one : formatBoardText(t.detail.daysActive.other, { count: days }) },
    { label: t.detail.meta.updated, value: dateFmt.format(new Date(card.updatedAt)) },
  ];

  return (
    <CardDetailSheet
      badges={<Badge className="border border-line-subtle bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-content-strong" variant="outline">{complaintStatusLabel(locale, card.status)}</Badge>}
      closeLabel={t.detail.close}
      description={t.detail.description}
      detailHref={`/complaints/${card.id}`}
      detailLabel={t.detail.openFull}
      dir={dir}
      meta={meta}
      onOpenChange={(open) => { if (!open) onClose(); }}
      open
      reference={card.referenceNumber}
      title={card.subject}
      updatesLabel={t.detail.updates}
    >
      {load.status === 'loading' ? <p className="text-sm text-content-muted" role="status">{t.detail.loading}</p> : null}
      {load.status === 'error' ? <p className="text-sm text-status-error" role="alert">{t.detail.error}</p> : null}
      {load.status === 'ready' && load.timeline.length === 0 ? <p className="text-sm text-content-muted" role="status">{t.detail.empty}</p> : null}
      {load.status === 'ready' && load.timeline.length > 0 ? (
        <ol className="space-y-3">
          {load.timeline.map((item) => (
            <li className="border-s-2 border-line-subtle ps-3" key={item.id}>
              <p className="text-sm font-medium text-content-strong">{item.summary}</p>
              {item.body ? <p className="mt-0.5 whitespace-pre-line text-sm text-content-muted">{item.body}</p> : null}
              <p className="mt-1 text-xs text-content-subtle">{[item.actor?.name, dateFmt.format(new Date(item.createdAt))].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </CardDetailSheet>
  );
}
