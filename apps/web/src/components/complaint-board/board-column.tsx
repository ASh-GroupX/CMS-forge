'use client';

import { useDroppable } from '@dnd-kit/core';
import React, { type ReactNode } from 'react';
import type { ComplaintBoardStage } from '../../lib/staff-complaint-board-api';

const STAGE_DOT: Record<string, string> = {
  slate: 'bg-stage-slate',
  blue: 'bg-stage-blue',
  amber: 'bg-stage-amber',
  green: 'bg-stage-green',
  red: 'bg-stage-red',
  violet: 'bg-stage-violet',
};

const STAGE_HEADER_BG: Record<string, string> = {
  slate: 'bg-stage-slate-bg',
  blue: 'bg-stage-blue-bg',
  amber: 'bg-stage-amber-bg',
  green: 'bg-stage-green-bg',
  red: 'bg-stage-red-bg',
  violet: 'bg-stage-violet-bg',
};

// While a ticket is dragged, `disabled` stops a column accepting the drop and
// `dimmed` greys it. Illegal targets (no allowed transition into this column's
// status) are both disabled and dimmed, so the backend state machine is never
// asked for an illegal move; the ticket's own column is disabled (same-column is
// a no-op) but not dimmed, since the ticket still lives there.
export function ComplaintColumnShell({ children, count, dimmed = false, disabled = false, empty, emptyText, label, stage, title }: {
  children: ReactNode;
  count: string;
  dimmed?: boolean;
  disabled?: boolean;
  empty: boolean;
  emptyText: string;
  label: string;
  stage: ComplaintBoardStage;
  title: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id, disabled });
  return (
    <li aria-label={label} className="w-72 shrink-0 snap-start">
      <section
        aria-disabled={disabled || undefined}
        className={`grid max-h-full content-start gap-2 rounded-xl border p-2 transition-colors ${
          dimmed
            ? 'border-line-subtle bg-board-column opacity-45'
            : isOver
              ? 'border-board-drop-ring bg-board-drop ring-2 ring-board-drop-ring/40'
              : 'border-board-column-border bg-board-column'
        }`}
        ref={setNodeRef}
      >
        <header className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${STAGE_HEADER_BG[stage.color] ?? STAGE_HEADER_BG.slate}`}>
          <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-content-strong">
            <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${STAGE_DOT[stage.color] ?? STAGE_DOT.slate}`} />
            <span className="truncate">{title}</span>
          </h3>
          <span className="shrink-0 text-xs font-semibold text-content-muted">{count}</span>
        </header>
        <ol className="grid min-h-16 content-start gap-2">
          {children}
          {empty ? (
            <li aria-hidden="true" className="grid min-h-16 place-items-center rounded-lg border border-dashed border-line-strong/60 px-2 py-4 text-center text-xs text-content-muted">
              {emptyText}
            </li>
          ) : null}
        </ol>
      </section>
    </li>
  );
}
