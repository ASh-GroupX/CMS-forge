'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, GripVertical, Handshake, MessageSquare } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatBoardCount, formatBoardText, type TaskBoardText } from '../../i18n/staff-task-board';
import type { Locale } from '../../i18n/staff-shell';
import type { BoardCard, BoardDepartment } from '../../lib/staff-board-api';
import { CardDepartmentBadge, CardDepartmentControl, type AssignDepartmentHandler } from './board-card-department';

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

export function BoardCardView({ card, departmentSlot, dragging, dragHandle, locale, onOpen, t }: { card: BoardCard; departmentSlot?: ReactNode; dragging?: boolean; dragHandle?: ReactNode; locale: Locale; onOpen?: () => void; t: TaskBoardText }) {
  const assignee = assigneeLabel(card, locale, t.card.assigneeFallback);
  // The title is the quick-look trigger (keyboard-accessible, distinct from the
  // drag surface). A pointer drag starts only past the sensor's distance
  // threshold, so a click here opens the drawer without moving the card (B6).
  return (
    <article
      aria-label={card.title}
      className={`grid gap-2 rounded-lg border border-line-subtle bg-board-card p-3 text-start transition-shadow ${dragging ? 'rotate-3 shadow-drag' : 'shadow-sm hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2">
        {onOpen ? (
          <button aria-label={formatBoardText(t.detail.trigger, { title: card.title })} className="min-w-0 text-start text-sm font-semibold leading-snug text-content-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={onOpen} type="button">
            {card.title}
          </button>
        ) : (
          <p className="text-sm font-semibold leading-snug text-content-strong">{card.title}</p>
        )}
        {dragHandle}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {departmentSlot ?? <CardDepartmentBadge card={card} locale={locale} />}
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

export function SortableBoardCard({ card, departments, locale, onAssignDepartment, onOpen, t }: {
  card: BoardCard;
  departments?: BoardDepartment[] | undefined;
  locale: Locale;
  onAssignDepartment?: AssignDepartmentHandler | undefined;
  onOpen: (card: BoardCard) => void;
  t: TaskBoardText;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  const departmentSlot = departments && onAssignDepartment
    ? <CardDepartmentControl card={card} departments={departments} locale={locale} onAssign={onAssignDepartment} t={t} />
    : undefined;
  // Pointer/touch drags start anywhere on the card (listeners on the wrapper),
  // but the keyboard + screen-reader drag semantics live on a dedicated handle
  // button so interactive card controls are never nested inside role="button".
  const dragHandle = (
    <button
      aria-label={formatBoardText(t.card.dragHandle, { title: card.title })}
      className="-me-1 -mt-1 shrink-0 cursor-grab rounded-md p-1 text-content-subtle transition-colors hover:text-content-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      type="button"
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );
  return (
    <li className={isDragging ? 'opacity-40' : undefined}>
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...listeners}>
        <BoardCardView card={card} departmentSlot={departmentSlot} dragHandle={dragHandle} locale={locale} onOpen={() => onOpen(card)} t={t} />
      </div>
    </li>
  );
}
