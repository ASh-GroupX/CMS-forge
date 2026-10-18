'use client';

import React from 'react';
import { Inbox, Star } from 'lucide-react';
import type { Locale } from '../../i18n/staff-shell';
import type { MyWorkCopy } from '../../i18n/staff-my-work';
import type { StaffTask } from '../../lib/staff-tasks-api';

export type Urgency = 'overdue' | 'today' | 'normal' | 'done';

export function TaskRow({ locale, t, task, urgency }: { locale: Locale; t: MyWorkCopy; task: StaffTask; urgency: Urgency }) {
  const due = new Date(task.dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
  const timeLabel = absDiffHours < 24 ? `${absDiffHours}h` : `${Math.round(absDiffHours / 24)}d`;
  const dueText = isOverdue ? t.row.overdue.replace('{time}', timeLabel) : t.row.dueIn.replace('{time}', timeLabel);

  const urgencyBorder =
    urgency === 'overdue' ? 'border-s-red-500'
    : urgency === 'today' ? 'border-s-amber-500'
    : urgency === 'done' ? 'border-s-emerald-500'
    : 'border-s-blue-500';

  const complaintLink = task.links?.find((l) => l.entityType?.toLowerCase() === 'complaint');
  const ticketLink = task.links?.find((l) => l.entityType?.toLowerCase() === 'internal_ticket');
  const href = complaintLink 
    ? `/complaints/${complaintLink.entityId}?locale=${locale}`
    : ticketLink
    ? `/internal-tickets/${ticketLink.entityId}?locale=${locale}`
    : `/tasks/${task.id}?locale=${locale}`;

  return (
    <a
      className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-transparent border-s-2 ${urgencyBorder} bg-surface-raised/50 px-4 py-3 transition-all hover:border-line-subtle hover:bg-surface-raised hover:shadow-sm`}
      href={href}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-content-strong group-hover:text-brand">
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-content-muted">
          {task.isCustomerPromise && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-400 font-medium">
              <Star className="me-0.5 inline size-3" />{locale === 'ar' ? 'شكوى' : 'Complaint'}
            </span>
          )}
          {ticketLink && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-400 font-medium">
              <Inbox className="me-0.5 inline size-3" />{locale === 'ar' ? 'تذكرة داخلية' : 'Internal Ticket'}
            </span>
          )}
          <span>{task.ownerName ?? task.ownerId}</span>
          {task.assigneeName && <span>→ {task.assigneeName}</span>}
          {task.assignedDepartmentName && (
            <span className="rounded bg-white/5 px-1.5 py-0.5">
              {locale === 'ar' ? task.assignedDepartmentNameAr ?? task.assignedDepartmentName : task.assignedDepartmentName}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-1 font-medium tabular-nums ${isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-content-muted'}`}>
          {dueText}
        </span>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadge(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </a>
  );
}

function statusBadge(status: string): string {
  switch (status) {
    case 'OPEN': return 'bg-blue-500/15 text-blue-400';
    case 'IN_PROGRESS': return 'bg-cyan-500/15 text-cyan-400';
    case 'WAITING': return 'bg-amber-500/15 text-amber-400';
    case 'DONE': return 'bg-emerald-500/15 text-emerald-400';
    default: return 'bg-white/5 text-content-muted';
  }
}
