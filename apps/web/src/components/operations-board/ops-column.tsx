'use client';

import { useDroppable } from '@dnd-kit/core';
import React, { type ReactNode } from 'react';
import type { ComplaintBoardCard, ComplaintBoardStage } from '../../lib/staff-complaint-board-api';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';
import { OpsColumnHeader } from './ops-column-header';

// ── Board column ───────────────────────────────────────────────────────────
// A single vertical column in the operations board. Contains the header
// (name + count + workload bar) and a scrollable list of compact work cards.
// Acts as a dnd-kit droppable zone keyed by the stage ID.

export function OpsColumn({ cards, children, dimmed, disabled, stage, t }: {
  cards: ComplaintBoardCard[];
  children: ReactNode;
  dimmed: boolean;
  disabled: boolean;
  stage: ComplaintBoardStage;
  t: OperationsBoardCopy;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id, disabled });

  return (
    <li
      ref={setNodeRef}
      aria-label={stage.nameEn}
      className={`flex w-[var(--ops-column-min)] shrink-0 snap-start flex-col rounded-[1.75rem] border p-3 transition-all duration-300
        ${isOver && !disabled ? 'border-amber-400/40 bg-amber-50/50 shadow-inner ring-1 ring-amber-400/30 dark:border-board-drop-ring dark:bg-board-drop dark:shadow-[0_0_24px_rgba(6,182,212,0.15)] dark:ring-board-drop-ring' : 'border-amber-100 bg-gradient-to-br from-yellow-50/60 to-pink-50/60 backdrop-blur-3xl shadow-sm dark:bg-none dark:border-board-column-border dark:bg-board-column dark:shadow-xl'}
        ${dimmed ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : ''}`}
      style={{ minWidth: 'var(--ops-column-min)', maxWidth: 'var(--ops-column-max)' }}
    >
      <OpsColumnHeader
        cards={cards}
        color={stage.color}
        count={cards.length}
        name={stage.nameEn}
        t={t}
      />

      {/* Card list — scrollable when content overflows */}
      <div className="mt-1 flex flex-1 flex-col gap-[var(--ops-card-gap)] overflow-y-auto pe-0.5">
        {cards.length === 0 ? (
          <p className="py-6 text-center text-xs text-content-subtle">{t.columnEmpty}</p>
        ) : (
          children
        )}
      </div>
    </li>
  );
}
