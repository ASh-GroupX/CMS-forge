'use client';

import React from 'react';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';
import { WorkloadIndicator, workloadFromCards } from './workload-indicator';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';

// ── Column header ──────────────────────────────────────────────────────────
// Shows column name, count badge, and a thin workload health indicator.

export function OpsColumnHeader({ cards, color, count, name, t }: {
  cards: ComplaintBoardCard[];
  color: string;
  count: number;
  name: string;
  t: OperationsBoardCopy;
}) {
  const counts = workloadFromCards(cards);
  const countLabel = count === 1 ? t.ticketCount.one : t.ticketCount.other.replace('{count}', String(count));

  return (
    <div className="grid gap-2 px-1 pb-4 pt-1">
      {/* Workload Indicator at the top */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-subtle/50 shadow-inner">
        <WorkloadIndicator counts={counts} t={t} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <h3 className="text-[0.95rem] font-bold tracking-tight bg-gradient-to-br from-content-strong to-content-muted bg-clip-text text-transparent">{name}</h3>
        <span
          className="flex items-center justify-center min-w-8 h-6 rounded-full bg-black/5 px-2 text-xs font-bold tabular-nums text-content-strong shadow-inner"
          aria-label={countLabel}
        >
          {count}
        </span>
      </div>
    </div>
  );
}
