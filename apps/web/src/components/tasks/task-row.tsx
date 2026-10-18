'use client';

import React from 'react';
import { Inbox, Loader2, Star, Trash2 } from 'lucide-react';
import type { Locale } from '../../i18n/staff-shell';
import type { MyWorkCopy } from '../../i18n/staff-my-work';
import type { StaffTask } from '../../lib/staff-tasks-api';
import { getTaskItemType } from '../../lib/staff-tasks-aggregate';

export type Urgency = 'overdue' | 'today' | 'normal' | 'done';

export function TaskRow({
  locale,
  t,
  task,
  urgency,
  isAdmin = false,
  onDelete,
}: {
  locale: Locale;
  t: MyWorkCopy;
  task: StaffTask;
  urgency: Urgency;
  isAdmin?: boolean | undefined;
  onDelete?: ((taskId: string) => void) | undefined;
}) {
  const [deleting, setDeleting] = React.useState(false);
  const isRealTask = getTaskItemType(task) === 'task';

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmMsg =
      locale === 'ar'
        ? 'هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this task? This action cannot be undone.';
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const csrf =
        typeof document !== 'undefined'
          ? document.cookie
              .split(';')
              .map((s) => s.trim())
              .find((s) => s.startsWith('cms_csrf_token='))
              ?.slice('cms_csrf_token='.length)
          : null;
      const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: 'DELETE',
        headers: csrf ? { 'x-csrf-token': csrf } : {},
      });
      if (res.ok) {
        onDelete?.(task.id);
      } else {
        alert(locale === 'ar' ? 'فشل حذف المهمة.' : 'Failed to delete task.');
      }
    } catch {
      alert(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Network error.');
    } finally {
      setDeleting(false);
    }
  };

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
      className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-line-subtle/70 border-s-4 ${urgencyBorder} bg-surface/90 px-4 py-3 transition-all hover:border-line-strong hover:bg-surface-raised hover:shadow-xs`}
      href={href}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-content-strong group-hover:text-brand">
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-content-muted">
          {task.isCustomerPromise && (
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-700 dark:text-amber-300 font-semibold">
              <Star className="me-0.5 inline size-3" />{locale === 'ar' ? 'شكوى' : 'Complaint'}
            </span>
          )}
          {ticketLink && (
            <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-blue-700 dark:text-blue-300 font-semibold">
              <Inbox className="me-0.5 inline size-3" />{locale === 'ar' ? 'تذكرة داخلية' : 'Internal Ticket'}
            </span>
          )}
          <span className="font-medium text-content-strong">{task.ownerName ?? task.ownerId}</span>
          {task.assigneeName && <span>→ {task.assigneeName}</span>}
          {task.assignedDepartmentName && (
            <span className="rounded bg-surface-sunken border border-line-subtle px-1.5 py-0.5 font-medium text-content-strong">
              {locale === 'ar' ? task.assignedDepartmentNameAr ?? task.assignedDepartmentName : task.assignedDepartmentName}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold tabular-nums ${isOverdue ? 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300' : 'bg-surface border border-line-subtle text-content-muted'}`}>
          {dueText}
        </span>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadge(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        {isAdmin && isRealTask && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title={locale === 'ar' ? 'حذف المهمة' : 'Delete Task'}
            className="flex size-7 items-center justify-center rounded-md border border-transparent text-content-muted transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        )}
      </div>
    </a>
  );
}

function statusBadge(status: string): string {
  switch (status) {
    case 'OPEN': return 'bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300';
    case 'IN_PROGRESS': return 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300';
    case 'WAITING': return 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300';
    case 'DONE': return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
    default: return 'bg-surface border border-line-subtle text-content-muted';
  }
}
