'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, Handshake, MessageSquare } from 'lucide-react';
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatBoardCount, formatBoardText, type TaskBoardText } from '../../i18n/staff-task-board';
import type { Locale } from '../../i18n/staff-shell';
import type { BoardCard } from '../../lib/staff-board-api';

const DUE_BADGE_CLASS: Record<NonNullable<BoardCard['dueState']>, string> = {
  OVERDUE: 'border-status-error-border bg-status-error-bg text-status-error',
  DUE_TODAY: 'border-status-warning-border bg-status-warning-bg text-content-strong',
  UPCOMING: 'border-line-subtle bg-surface-raised text-content-muted',
};

export function assigneeLabel(card: BoardCard, locale: Locale, fallback: string): string {
  const name = locale === 'ar' ? card.assigneeNameAr ?? card.assigneeName : card.assigneeName ?? card.assigneeNameAr;
  return name?.trim() || fallback;
}

export function initialsOf(name: string, locale: Locale): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toLocaleUpperCase(locale);
}

export function BoardCardView({ card, dragging, locale, t }: { card: BoardCard; dragging?: boolean; locale: Locale; t: TaskBoardText }) {
  const assignee = assigneeLabel(card, locale, t.card.assigneeFallback);
  return (
    <article
      aria-label={card.title}
      className={`grid gap-2 rounded-lg border border-line-subtle bg-board-card p-3 text-start transition-shadow ${dragging ? 'rotate-3 shadow-drag' : 'shadow-sm hover:shadow-md'}`}
    >
      <p className="text-sm font-semibold leading-snug text-content-strong">{card.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {card.dueState ? (
          <Badge className={`gap-1 border px-1.5 py-0.5 text-[11px] font-semibold ${DUE_BADGE_CLASS[card.dueState]}`} variant="outline">
            <CalendarClock aria-hidden="true" className="size-3" />
            {t.card.dueStates[card.dueState]}
          </Badge>
        ) : null}
        {card.isCustomerPromise ? (
          <Badge className="gap-1 border-status-info-border bg-status-info-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-info" variant="outline">
            <Handshake aria-hidden="true" className="size-3" />
            {t.card.promise}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-content-subtle">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{formatBoardCount(card.daysActive, t.card.daysActive)}</span>
          {card.commentCount > 0 ? (
            <span aria-label={formatBoardCount(card.commentCount, t.card.comments)} className="flex shrink-0 items-center gap-1">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              {card.commentCount}
            </span>
          ) : null}
        </span>
        <Avatar aria-hidden="true" className="size-6 border border-line-subtle text-[10px]" title={assignee}>
          <AvatarFallback className="bg-brand font-bold text-brand-foreground">{initialsOf(assignee, locale)}</AvatarFallback>
        </Avatar>
      </div>
    </article>
  );
}

export function SortableBoardCard({ card, locale, t }: { card: BoardCard; locale: Locale; t: TaskBoardText }) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  return (
    <li className={isDragging ? 'opacity-40' : undefined}>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        {...listeners}
        aria-roledescription={formatBoardText(t.card.dragHandle, { title: card.title })}
      >
        <BoardCardView card={card} locale={locale} t={t} />
      </div>
    </li>
  );
}
