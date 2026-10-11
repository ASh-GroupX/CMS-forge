'use client';

import { AlertTriangle, CheckCircle2, Clock, HandMetal, Inbox, Star } from 'lucide-react';
import React from 'react';
import type { MyWorkCopy } from '../../i18n/staff-my-work';
import type { EmployeeTodayTasks, StaffTask } from '../../lib/staff-tasks-api';
import type { Locale } from '../../i18n/staff-shell';

// ── My Work Dashboard ───────────────────────────────────────────────────────
// Premium layout: urgent items float to top, clean sections, quick-action cards.

type MyWorkDashboardProps = {
  data: EmployeeTodayTasks;
  locale: Locale;
  t: MyWorkCopy;
};

export function MyWorkDashboard({ data, locale, t }: MyWorkDashboardProps) {
  const overdueCount = data.overdue.length;
  const dueTodayCount = data.dueToday.length;
  const assignedCount = data.assignedToMe.length;
  const waitingCount = data.waitingOnMe.length;

  return (
    <div className="grid gap-6">
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          color="text-red-400 bg-red-500/10 border-red-500/20"
          count={overdueCount}
          icon={<AlertTriangle className="size-4" />}
          label={t.tabs.overdue}
        />
        <StatCard
          color="text-amber-400 bg-amber-500/10 border-amber-500/20"
          count={dueTodayCount}
          icon={<Clock className="size-4" />}
          label={t.tabs.dueToday}
        />
        <StatCard
          color="text-blue-400 bg-blue-500/10 border-blue-500/20"
          count={assignedCount}
          icon={<Inbox className="size-4" />}
          label={t.tabs.inProgress}
        />
        <StatCard
          color="text-purple-400 bg-purple-500/10 border-purple-500/20"
          count={waitingCount}
          icon={<HandMetal className="size-4" />}
          label={t.tabs.waiting}
        />
      </div>

      {/* ── Overdue (red, highest priority) ── */}
      {overdueCount > 0 && (
        <TaskSection
          borderColor="border-red-500/30"
          emptyText={t.empty.overdue}
          headerColor="text-red-400"
          icon={<AlertTriangle className="size-4" />}
          locale={locale}
          t={t}
          tasks={data.overdue}
          title={t.tabs.overdue}
          urgency="overdue"
        />
      )}

      {/* ── Overdue Promises ── */}
      {data.overduePromises.length > 0 && (
        <TaskSection
          borderColor="border-orange-500/30"
          emptyText={t.empty.promises}
          headerColor="text-orange-400"
          icon={<Star className="size-4" />}
          locale={locale}
          t={t}
          tasks={data.overduePromises}
          title={t.tabs.promises}
          urgency="overdue"
        />
      )}

      {/* ── Due Today (amber) ── */}
      <TaskSection
        borderColor="border-amber-500/30"
        emptyText={t.empty.dueToday}
        headerColor="text-amber-400"
        icon={<Clock className="size-4" />}
        locale={locale}
        t={t}
        tasks={data.dueToday}
        title={t.tabs.dueToday}
        urgency="today"
      />

      {/* ── Assigned to Me (blue) ── */}
      <TaskSection
        borderColor="border-blue-500/30"
        emptyText={t.empty.inProgress}
        headerColor="text-blue-400"
        icon={<Inbox className="size-4" />}
        locale={locale}
        t={t}
        tasks={data.assignedToMe}
        title={t.tabs.inProgress}
        urgency="normal"
      />

      {/* ── Waiting on Me (purple) ── */}
      <TaskSection
        borderColor="border-purple-500/30"
        emptyText={t.empty.waiting}
        headerColor="text-purple-400"
        icon={<HandMetal className="size-4" />}
        locale={locale}
        t={t}
        tasks={data.waitingOnMe}
        title={t.tabs.waiting}
        urgency="normal"
      />

      {/* ── Completed (green, collapsed) ── */}
      {data.completed.length > 0 && (
        <TaskSection
          borderColor="border-emerald-500/30"
          collapsed
          emptyText={t.empty.overdue}
          headerColor="text-emerald-400"
          icon={<CheckCircle2 className="size-4" />}
          locale={locale}
          t={t}
          tasks={data.completed}
          title={`${t.tabs.sent} (${data.completed.length})`}
          urgency="done"
        />
      )}
    </div>
  );
}

// ── Stat Card ──

function StatCard({ color, count, icon, label }: { color: string; count: number; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${color}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{count}</p>
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
    </div>
  );
}

// ── Task Section ──

type Urgency = 'overdue' | 'today' | 'normal' | 'done';

function TaskSection({ borderColor, collapsed = false, emptyText, headerColor, icon, locale, t, tasks, title, urgency }: {
  borderColor: string;
  collapsed?: boolean;
  emptyText: string;
  headerColor: string;
  icon: React.ReactNode;
  locale: Locale;
  t: MyWorkCopy;
  tasks: StaffTask[];
  title: string;
  urgency: Urgency;
}) {
  const [open, setOpen] = React.useState(!collapsed);

  return (
    <section className={`rounded-xl border ${borderColor} bg-surface/80 backdrop-blur`}>
      <button
        className={`flex w-full items-center gap-2 px-4 py-3 text-start font-semibold ${headerColor}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {icon}
        <span>{title}</span>
        <span className="ms-auto rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-bold tabular-nums">{tasks.length}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="grid gap-1 border-t border-white/5 px-2 py-2">
          {tasks.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-content-muted">{emptyText}</p>
          ) : (
            tasks.map((task) => (
              <TaskRow key={task.id} locale={locale} t={t} task={task} urgency={urgency} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

// ── Task Row ──

function TaskRow({ locale, t, task, urgency }: { locale: Locale; t: MyWorkCopy; task: StaffTask; urgency: Urgency }) {
  const due = new Date(task.dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
  const timeLabel = absDiffHours < 24
    ? `${absDiffHours}h`
    : `${Math.round(absDiffHours / 24)}d`;

  const dueText = isOverdue
    ? t.row.overdue.replace('{time}', timeLabel)
    : t.row.dueIn.replace('{time}', timeLabel);

  const urgencyBorder =
    urgency === 'overdue' ? 'border-s-red-500'
    : urgency === 'today' ? 'border-s-amber-500'
    : urgency === 'done' ? 'border-s-emerald-500'
    : 'border-s-blue-500';

  const complaintLink = task.links?.find((l) => l.entityType === 'complaint');
  const href = complaintLink 
    ? `/complaints/${complaintLink.entityId}?locale=${locale}`
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
              <Star className="me-0.5 inline size-3" />{t.row.complaint}
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
