'use client';

import { AlertTriangle, Clock3, User2 } from 'lucide-react';
import React from 'react';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';

// ── Compact work card ──────────────────────────────────────────────────────
// ~80-100px height, information-dense. Designed for scanning 10-20 items at a
// glance inside an operations board column.
//
// Layout:
//   [ref] ● Status            ⚠ Severity
//   Customer name
//   ⏱ SLA indicator           👤 Owner

const SEVERITY_CLASSES: Record<string, string> = {
  CRITICAL: 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-sm',
  HIGH: 'bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-sm',
  MEDIUM: 'bg-brand/10 text-brand border border-brand/20 shadow-sm',
  LOW: 'bg-surface-raised text-content-muted border border-line-subtle shadow-sm',
};

const SLA_CLASSES: Record<string, string> = {
  ON_TRACK: 'text-emerald-600',
  WARNING: 'text-orange-600',
  BREACHED: 'text-rose-600',
  CLOSED: 'text-content-subtle',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-content-subtle',
  SUBMITTED: 'bg-stage-blue',
  MANAGER_REVIEW: 'bg-stage-violet',
  BRANCH_REVIEW: 'bg-stage-violet',
  IN_PROGRESS: 'bg-stage-amber',
  RESOLVED: 'bg-stage-green',
  COMPLETED: 'bg-stage-green',
  CLOSED: 'bg-content-subtle',
  REOPENED: 'bg-stage-red',
  REJECTED: 'bg-stage-red',
};

export function OpsWorkCard({ card, onClick, t }: {
  card: ComplaintBoardCard;
  onClick?: (card: ComplaintBoardCard) => void;
  t: OperationsBoardCopy;
}) {
  const severityLabel = t.cardSeverity[card.severity] ?? card.severity;
  const slaLabel = t.cardSla[card.slaState] ?? card.slaState;
  const ownerDisplay = card.ownerName ?? t.cardNoOwner;
  const isDone = card.status === 'RESOLVED' || card.status === 'CLOSED' || card.status === 'COMPLETED';
  const slaTime = card.slaDueAt ? formatSlaTime(card.slaDueAt, isDone ? card.updatedAt : undefined) : null;

  let isBreached = card.slaState === 'BREACHED';
  if (isDone && card.slaDueAt) {
    const completedTime = new Date(card.updatedAt).getTime();
    const dueTime = new Date(card.slaDueAt).getTime();
    isBreached = completedTime > dueTime;
  }

  // SLA Color Logic
  let borderClass = 'border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-cyan-500/10 hover:bg-slate-800';
  let indicatorColor = '';
  let tooltipText = '';

  if (isDone) {
    if (isBreached) {
      borderClass = 'border-purple-200 bg-gradient-to-br from-pink-50 to-yellow-50 backdrop-blur-xl shadow-sm hover:shadow-md hover:from-pink-100 hover:to-yellow-100 text-purple-900 ' +
                    'dark:bg-none dark:border-border dark:bg-card dark:shadow-sm dark:hover:shadow-md dark:hover:bg-accent dark:text-foreground';
      indicatorColor = 'bg-gradient-to-r from-purple-400 via-purple-300 to-transparent opacity-80 dark:from-purple-600 dark:to-transparent';
      tooltipText = 'Done but after the due date';
    } else {
      borderClass = 'border-emerald-200 bg-gradient-to-br from-yellow-50 to-green-50 backdrop-blur-xl shadow-sm hover:shadow-md hover:from-yellow-100 hover:to-green-100 text-emerald-900 ' +
                    'dark:bg-none dark:border-border dark:bg-card dark:shadow-sm dark:hover:shadow-md dark:hover:bg-accent dark:text-foreground';
      indicatorColor = 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent opacity-80 dark:from-emerald-600 dark:to-transparent';
      tooltipText = 'Done on time';
    }
  } else {
    if (isBreached) {
      borderClass = 'border-rose-200 bg-gradient-to-br from-pink-50 to-rose-50 backdrop-blur-xl shadow-sm hover:shadow-md hover:from-pink-100 hover:to-rose-100 text-rose-900 ' +
                    'dark:bg-none dark:border-border dark:bg-card dark:shadow-sm dark:hover:shadow-md dark:hover:bg-accent dark:text-foreground';
      indicatorColor = 'bg-gradient-to-r from-rose-400 via-rose-300 to-transparent opacity-80 dark:from-rose-600 dark:to-transparent';
      tooltipText = 'Not done and after the due date';
    } else {
      borderClass = 'border-amber-200 bg-gradient-to-br from-yellow-50 to-pink-50 backdrop-blur-xl shadow-sm hover:shadow-md hover:from-yellow-100 hover:to-pink-100 text-amber-950 ' +
                    'dark:bg-none dark:border-border dark:bg-card dark:shadow-sm dark:hover:shadow-md dark:hover:bg-accent dark:text-foreground';
      indicatorColor = 'bg-gradient-to-r from-amber-400 via-pink-400 to-transparent opacity-80 dark:from-cyan-600 dark:to-transparent';
      tooltipText = 'In progress (due date not breached)';
    }
  }

  return (
    <button
      aria-label={`${card.referenceNumber} — ${card.subject}`}
      title={tooltipText}
      className={`group relative w-full cursor-pointer rounded-2xl border p-4 text-start transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 overflow-hidden ${borderClass}`}
      onClick={() => onClick?.(card)}
      type="button"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${indicatorColor}`} />

      {/* Row 1: Subject (truncated to 1 line) */}
      <p className="truncate text-sm font-semibold tracking-tight">
        {card.subject}
      </p>

      {/* Row 2: Status, Assignee, Priority, SLA */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <span
            aria-hidden="true"
            className={`inline-block size-2.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor] ${STATUS_DOT[card.status] ?? 'bg-content-subtle text-content-subtle'}`}
            title={card.status}
          />
          {/* Assignee Avatar Square */}
          <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-xs font-bold text-indigo-700 shadow-inner dark:text-indigo-400 border border-indigo-500/10">
            {ownerDisplay === t.cardNoOwner ? '?' : ownerDisplay.charAt(0).toUpperCase()}
          </div>
          {/* Priority Icon */}
          <span className={`shrink-0 rounded-lg px-2 py-1 text-[0.65rem] font-bold tracking-wider leading-none ${SEVERITY_CLASSES[card.severity] ?? SEVERITY_CLASSES.MEDIUM}`}>
            {severityLabel.charAt(0)}
          </span>
        </div>

        {/* SLA Time / Due Date */}
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${isDone ? (isBreached ? 'text-purple-600' : 'text-emerald-600') : (SLA_CLASSES[card.slaState] ?? '')}`}>
          {isBreached ? (
            <AlertTriangle aria-hidden="true" className="size-3" />
          ) : (
            <Clock3 aria-hidden="true" className="size-3" />
          )}
          {slaTime ? slaTime : slaLabel}
        </span>
      </div>
    </button>
  );
}

// Format a due-at ISO string into a compact human-readable duration
function formatSlaTime(dueAt: string, completedAt?: string): string {
  const referenceTime = completedAt ? new Date(completedAt).getTime() : Date.now();
  const due = new Date(dueAt).getTime();
  const diffMs = due - referenceTime;
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  let formatted = '';
  if (absDiffMs < 60_000) formatted = '<1m';
  else if (absDiffMs < 3_600_000) formatted = `${Math.round(absDiffMs / 60_000)}m`;
  else if (absDiffMs < 86_400_000) formatted = `${Math.round(absDiffMs / 3_600_000)}h`;
  else formatted = `${Math.round(absDiffMs / 86_400_000)}d`;

  return isOverdue ? `-${formatted}` : formatted;
}
