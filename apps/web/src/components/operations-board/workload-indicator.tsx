'use client';

import React from 'react';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';

// ── Workload indicator ─────────────────────────────────────────────────────
// Thin stacked bar showing the ratio of on-track / warning / breached items
// in a column. Color segments use existing status tokens.

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export type WorkloadCounts = { doneOnTime: number; inProgress: number; doneLate: number; notDoneLate: number };

export function workloadFromCards(cards: ComplaintBoardCard[]): WorkloadCounts {
  let doneOnTime = 0;
  let inProgress = 0;
  let doneLate = 0;
  let notDoneLate = 0;
  for (const card of cards) {
    const isDone = card.status === 'RESOLVED' || card.status === 'CLOSED' || card.status === 'COMPLETED';
    let isBreached = card.slaState === 'BREACHED';
    if (isDone && card.slaDueAt) {
      const completedTime = new Date(card.updatedAt).getTime();
      const dueTime = new Date(card.slaDueAt).getTime();
      isBreached = completedTime > dueTime;
    }

    if (isDone) {
      if (isBreached) doneLate++;
      else doneOnTime++;
    } else {
      if (isBreached) notDoneLate++;
      else inProgress++;
    }
  }
  return { doneOnTime, inProgress, doneLate, notDoneLate };
}

export function WorkloadIndicator({ counts, t }: { counts: WorkloadCounts; t: OperationsBoardCopy }) {
  const total = counts.doneOnTime + counts.inProgress + counts.doneLate + counts.notDoneLate;
  if (total === 0) return <div className="h-full w-full rounded-full bg-surface-raised" />;

  const pctDoneOnTime = Math.round((counts.doneOnTime / total) * 100);
  const pctInProgress = Math.round((counts.inProgress / total) * 100);
  const pctDoneLate = Math.round((counts.doneLate / total) * 100);
  const pctNotDoneLate = 100 - pctDoneOnTime - pctInProgress - pctDoneLate;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        aria-label={`Done on time: ${counts.doneOnTime}, In progress: ${counts.inProgress}, Done late: ${counts.doneLate}, Not done and late: ${counts.notDoneLate}`}
        className="flex h-full w-full overflow-hidden rounded-full"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={counts.doneOnTime + counts.doneLate}
      >
        {pctDoneOnTime > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="bg-status-success transition-[width] duration-300 hover:opacity-80 cursor-default"
                style={{ width: `${pctDoneOnTime}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Done on time: {counts.doneOnTime}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {pctInProgress > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="bg-status-warning transition-[width] duration-300 hover:opacity-80 cursor-default"
                style={{ width: `${pctInProgress}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>In progress: {counts.inProgress}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {pctDoneLate > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="bg-purple-500 transition-[width] duration-300 hover:opacity-80 cursor-default"
                style={{ width: `${pctDoneLate}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Done but after the due date: {counts.doneLate}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {pctNotDoneLate > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="bg-status-error transition-[width] duration-300 hover:opacity-80 cursor-default"
                style={{ width: `${pctNotDoneLate}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Not done and after the due date: {counts.notDoneLate}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
