'use client';

import { AlertTriangle, ArrowRight, CalendarClock, CheckSquare2, Clock3, Inbox, Send, UsersRound } from 'lucide-react';
import React from 'react';
import type { StaffTask } from '../../lib/staff-tasks-api';
import type { ComplaintQueueItem } from '../../lib/staff-complaints-api';
import type { Locale } from '../../i18n/staff-shell';
import type { MyWorkCopy } from '../../i18n/staff-my-work';

// ── Compact work item row ──────────────────────────────────────────────────
// Used across all tabs in the My Work view to display either a Task or a Complaint.

export function MyWorkRow({ item, locale, t, type }: {
  item: StaffTask | ComplaintQueueItem;
  locale: Locale;
  t: MyWorkCopy;
  type: 'task' | 'complaint';
}) {
  const isTask = type === 'task';
  const task = isTask ? (item as StaffTask) : null;
  const complaint = !isTask ? (item as ComplaintQueueItem) : null;

  const id = isTask ? task!.id : complaint!.id;
  const reference = isTask ? (task!.id.split('-')[0]?.toUpperCase() ?? '') : complaint!.referenceNumber;
  const title = isTask ? task!.title : complaint!.subject;
  const dueAt = isTask ? task!.dueAt : complaint!.slaDueAt;
  const isOverdue = isTask
    ? (task!.status !== 'DONE' && new Date(task!.dueAt) < new Date())
    : complaint!.slaState === 'BREACHED';

  const href = isTask ? `/tasks/board?locale=${locale}&taskId=${id}` : `/complaints/${id}?locale=${locale}`;

  return (
    <a
      className="group flex min-h-12 w-full items-center justify-between gap-4 border-b border-line-subtle bg-surface px-4 py-2 transition-colors hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
      href={href}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Type Icon */}
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-raised text-content-subtle group-hover:bg-brand/10 group-hover:text-brand">
          {isTask ? <CheckSquare2 aria-hidden="true" className="size-4" /> : <Inbox aria-hidden="true" className="size-4" />}
        </span>

        {/* Reference & Title */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-content-strong">
            <span>{reference}</span>
            {isOverdue && (
              <span className="flex items-center gap-1 rounded bg-status-error/10 px-1.5 py-0.5 text-[0.625rem] text-status-error">
                <AlertTriangle aria-hidden="true" className="size-3" />
                {t.tabs.overdue}
              </span>
            )}
            {!isOverdue && dueAt && (
              <span className="flex items-center gap-1 rounded bg-status-warning/10 px-1.5 py-0.5 text-[0.625rem] text-status-warning">
                <Clock3 aria-hidden="true" className="size-3" />
                {formatTimeRemaining(dueAt)}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-content-muted">{title}</p>
        </div>
      </div>

      {/* Trailing Icon */}
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-content-subtle opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function formatTimeRemaining(dueAt: string): string {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const diffMs = due - now;
  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < 60_000) return '<1m';
  if (absDiffMs < 3_600_000) return `${Math.round(absDiffMs / 60_000)}m`;
  if (absDiffMs < 86_400_000) return `${Math.round(absDiffMs / 3_600_000)}h`;
  return `${Math.round(absDiffMs / 86_400_000)}d`;
}
