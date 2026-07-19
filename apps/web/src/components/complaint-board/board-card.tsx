'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, TriangleAlert, User } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatBoardText } from '../../i18n/staff-task-board';
import type { ComplaintBoardText } from '../../i18n/staff-complaint-board';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';

const SEVERITY_CLASS: Record<ComplaintBoardCard['severity'], string> = {
  CRITICAL: 'border-status-error-border bg-status-error-bg text-status-error',
  HIGH: 'border-status-warning-border bg-status-warning-bg text-content-strong',
  MEDIUM: 'border-line-subtle bg-surface-raised text-content-muted',
  LOW: 'border-line-subtle bg-surface-raised text-content-subtle',
};

const SLA_CLASS: Record<ComplaintBoardCard['slaState'], string> = {
  BREACHED: 'border-status-error-border bg-status-error-bg text-status-error',
  WARNING: 'border-status-warning-border bg-status-warning-bg text-content-strong',
  ON_TRACK: 'border-line-subtle bg-surface-raised text-content-muted',
  CLOSED: 'border-line-subtle bg-surface-raised text-content-subtle',
};

export function ownerLabel(card: ComplaintBoardCard, fallback: string): string {
  return card.ownerName?.trim() || fallback;
}

export function ComplaintCardView({ card, dragHandle, dragging, onOpen, t }: { card: ComplaintBoardCard; dragHandle?: ReactNode; dragging?: boolean; onOpen?: () => void; t: ComplaintBoardText }) {
  // The reference/subject is the quick-look trigger (keyboard-accessible, distinct
  // from the drag surface). A pointer drag starts only past the sensor's distance
  // threshold, so a click here opens the drawer without moving the card (B6).
  const heading = (
    <>
      <p className="font-mono text-xs font-bold text-content-muted">{card.referenceNumber}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug text-content-strong">{card.subject}</p>
    </>
  );
  return (
    <article
      aria-label={card.referenceNumber}
      className={`grid gap-2 rounded-lg border border-line-subtle bg-board-card p-3 text-start transition-shadow ${dragging ? 'rotate-3 shadow-drag' : 'shadow-sm hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2">
        {onOpen ? (
          <button aria-label={formatBoardText(t.detail.trigger, { reference: card.referenceNumber })} className="min-w-0 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={onOpen} type="button">
            {heading}
          </button>
        ) : (
          <div className="min-w-0">{heading}</div>
        )}
        {dragHandle}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={`gap-1 border px-1.5 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[card.severity]}`} variant="outline">
          {card.severity === 'CRITICAL' ? <TriangleAlert aria-hidden="true" className="size-3" /> : null}
          {t.card.severity[card.severity]}
        </Badge>
        <Badge className={`border px-1.5 py-0.5 text-[11px] font-semibold ${SLA_CLASS[card.slaState]}`} variant="outline">
          {t.card.sla[card.slaState]}
        </Badge>
      </div>
      <div className="grid gap-1 text-xs text-content-subtle">
        <span className="flex min-w-0 items-center gap-1">
          <User aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{formatBoardText(t.card.owner, { name: ownerLabel(card, t.card.ownerFallback) })}</span>
        </span>
        {card.nextAction ? <span className="truncate">{formatBoardText(t.card.nextAction, { action: card.nextAction })}</span> : null}
      </div>
    </article>
  );
}

export function DraggableComplaintCard({ card, onOpen, t }: { card: ComplaintBoardCard; onOpen: (card: ComplaintBoardCard) => void; t: ComplaintBoardText }) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({ id: card.id });
  // Pointer/touch drags start anywhere on the card; the keyboard + screen-reader
  // drag semantics live on a dedicated handle button so interactive controls are
  // never nested inside role="button" (mirrors the task board's axe fix).
  const dragHandle = (
    <button
      aria-label={formatBoardText(t.card.dragHandle, { reference: card.referenceNumber })}
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
      <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...listeners}>
        <ComplaintCardView card={card} dragHandle={dragHandle} onOpen={() => onOpen(card)} t={t} />
      </div>
    </li>
  );
}
