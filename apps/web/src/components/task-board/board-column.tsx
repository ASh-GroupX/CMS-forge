'use client';

import { useDroppable } from '@dnd-kit/core';
import React, { type ReactNode } from 'react';
import type { BoardCard, BoardStage } from '../../lib/staff-board-api';

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

export function BoardColumnShell({ cards, children, count, emptyText, label, layout = 'board', stage, title }: {
  cards: BoardCard[];
  children: ReactNode;
  count: string;
  emptyText: string;
  label: string;
  layout?: 'board' | 'list';
  stage: BoardStage;
  title: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });
  return (
    <li aria-label={label} className={layout === 'list' ? 'w-full lg:w-72 lg:shrink-0 lg:snap-start' : 'w-72 shrink-0 snap-start'}>
      <section
        className={`grid max-h-full content-start gap-2 rounded-xl border p-2 transition-colors ${
          isOver ? 'border-board-drop-ring bg-board-drop ring-2 ring-board-drop-ring/40' : 'border-board-column-border bg-board-column'
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
          {cards.length === 0 ? (
            <li aria-hidden="true" className="grid min-h-16 place-items-center rounded-lg border border-dashed border-line-strong/60 px-2 py-4 text-center text-xs text-content-muted">
              {emptyText}
            </li>
          ) : null}
        </ol>
      </section>
    </li>
  );
}
