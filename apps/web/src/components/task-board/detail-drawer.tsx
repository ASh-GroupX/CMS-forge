'use client';

import React, { useEffect, useState } from 'react';
import { formatBoardText, type TaskBoardText } from '../../i18n/staff-task-board';
import type { Locale } from '../../i18n/staff-shell';
import type { BoardCard } from '../../lib/staff-board-api';
import type { StaffTaskComment, TaskCardDetail } from '../../lib/staff-task-board-detail-api';
import { CardDetailSheet, type CardDetailMeta } from '../board-detail/card-detail-sheet';
import { assigneeLabel } from './board-card';

export type TaskCardDetailAction = (taskId: string) => Promise<TaskCardDetail>;

type LoadState = { status: 'loading' } | { status: 'ready'; comments: StaffTaskComment[] } | { status: 'error' };

// Quick-look drawer for a task. Read-only: drag-to-move stays on the board, the
// B3 department control stays on the card, and full actions live on the linked
// detail page (B6). Days-active is server-computed on the card — no decision here.
export function TaskDetailDrawer({ card, locale, t, detailAction, onClose }: {
  card: BoardCard | null;
  locale: Locale;
  t: TaskBoardText;
  detailAction: TaskCardDetailAction;
  onClose: () => void;
}) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    setLoad({ status: 'loading' });
    detailAction(card.id)
      .then((result) => { if (!cancelled) setLoad(result.status === 'ready' ? { status: 'ready', comments: result.comments } : { status: 'error' }); })
      .catch(() => { if (!cancelled) setLoad({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [card, detailAction]);

  if (!card) return null;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' });
  const owner = (locale === 'ar' ? card.ownerNameAr ?? card.ownerName : card.ownerName ?? card.ownerNameAr)?.trim() || t.card.assigneeFallback;
  const department = (locale === 'ar' ? card.departmentNameAr ?? card.departmentName : card.departmentName ?? card.departmentNameAr)?.trim() || t.assign.none;
  const meta: CardDetailMeta[] = [
    { label: t.detail.meta.status, value: t.manage.statuses[card.status] },
    { label: t.detail.meta.assignee, value: assigneeLabel(card, locale, t.card.assigneeFallback) },
    { label: t.detail.meta.owner, value: owner },
    { label: t.detail.meta.department, value: department },
    { label: t.detail.meta.daysActive, value: card.daysActive === 1 ? t.detail.daysActive.one : formatBoardText(t.detail.daysActive.other, { count: card.daysActive }) },
    { label: t.detail.meta.due, value: dateFmt.format(new Date(card.dueAt)), tone: card.dueState === 'OVERDUE' ? 'danger' : 'default' },
  ];

  return (
    <CardDetailSheet
      closeLabel={t.detail.close}
      description={t.detail.description}
      detailHref={`/tasks/${card.id}`}
      detailLabel={t.detail.openFull}
      dir={dir}
      meta={meta}
      onOpenChange={(open) => { if (!open) onClose(); }}
      open
      reference={t.manage.statuses[card.status]}
      title={card.title}
      updatesLabel={t.detail.updates}
    >
      {load.status === 'loading' ? <p className="text-sm text-content-muted" role="status">{t.detail.loading}</p> : null}
      {load.status === 'error' ? <p className="text-sm text-status-error" role="alert">{t.detail.error}</p> : null}
      {load.status === 'ready' && load.comments.length === 0 ? <p className="text-sm text-content-muted" role="status">{t.detail.empty}</p> : null}
      {load.status === 'ready' && load.comments.length > 0 ? (
        <ol className="space-y-3">
          {load.comments.map((comment) => (
            <li className="border-s-2 border-line-subtle ps-3" key={comment.id}>
              <p className="whitespace-pre-line text-sm text-content-strong">{comment.body}</p>
              <p className="mt-1 text-xs text-content-subtle">{[locale === 'ar' ? comment.authorNameAr ?? comment.authorName : comment.authorName, dateFmt.format(new Date(comment.createdAt))].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </CardDetailSheet>
  );
}
