'use client';

import { AlertTriangle, CheckCircle2, CheckSquare, Clock, HandMetal, Inbox, Layers, Star } from 'lucide-react';
import React from 'react';
import type { MyWorkCopy } from '../../i18n/staff-my-work';
import type { EmployeeTodayTasks, StaffTask } from '../../lib/staff-tasks-api';
import type { Locale } from '../../i18n/staff-shell';
import { getTaskItemType, type WorkItemFilter } from '../../lib/staff-tasks-aggregate';
import { TaskRow, type Urgency } from './task-row';

// ── My Work Dashboard ───────────────────────────────────────────────────────
// Premium layout: urgent items float to top, clean sections, quick-action cards.

type MyWorkDashboardProps = {
  data: EmployeeTodayTasks;
  locale: Locale;
  t: MyWorkCopy;
  isAdmin?: boolean | undefined;
};

export function MyWorkDashboard({ data, locale, t, isAdmin = false }: MyWorkDashboardProps) {
  const [filter, setFilter] = React.useState<WorkItemFilter>('all');
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  const handleDeleteTask = React.useCallback((taskId: string) => {
    setDeletedIds((prev) => new Set([...prev, taskId]));
  }, []);

  const counts = React.useMemo(() => {
    const seen = new Set<string>();
    let ticket = 0;
    let complaint = 0;
    let task = 0;
    for (const bucket of [data.overdue, data.dueToday, data.assignedToMe, data.waitingOnMe, data.completed]) {
      for (const item of bucket) {
        if (!deletedIds.has(item.id) && !seen.has(item.id)) {
          seen.add(item.id);
          const type = getTaskItemType(item);
          if (type === 'ticket') ticket++;
          else if (type === 'complaint') complaint++;
          else task++;
        }
      }
    }
    return { all: seen.size, ticket, complaint, task };
  }, [data, deletedIds]);

  const activeData = React.useMemo(() => {
    const notDeleted = (item: StaffTask) => !deletedIds.has(item.id);
    const match = (item: StaffTask) => notDeleted(item) && (filter === 'all' || getTaskItemType(item) === filter);
    return {
      overdue: data.overdue.filter(match),
      overduePromises: data.overduePromises.filter(match),
      dueToday: data.dueToday.filter(match),
      assignedToMe: data.assignedToMe.filter(match),
      waitingOnMe: data.waitingOnMe.filter(match),
      completed: data.completed.filter(match),
    };
  }, [data, filter, deletedIds]);

  const overdueCount = activeData.overdue.length;
  const dueTodayCount = activeData.dueToday.length;
  const assignedCount = activeData.assignedToMe.length;
  const waitingCount = activeData.waitingOnMe.length;

  return (
    <div className="grid gap-6">
      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle pb-3">
        <FilterButton active={filter === 'all'} count={counts.all} icon={<Layers className="size-3.5" />} label={locale === 'ar' ? 'الكل' : 'All'} onClick={() => setFilter('all')} />
        <FilterButton active={filter === 'ticket'} count={counts.ticket} icon={<Inbox className="size-3.5" />} label={locale === 'ar' ? 'التذاكر الداخلية' : 'Internal Tickets'} onClick={() => setFilter('ticket')} variant="ticket" />
        <FilterButton active={filter === 'complaint'} count={counts.complaint} icon={<Star className="size-3.5" />} label={locale === 'ar' ? 'الشكاوى' : 'Complaints'} onClick={() => setFilter('complaint')} variant="complaint" />
        {counts.task > 0 && (
          <FilterButton active={filter === 'task'} count={counts.task} icon={<CheckSquare className="size-3.5" />} label={locale === 'ar' ? 'المهام العامة' : 'Tasks'} onClick={() => setFilter('task')} variant="task" />
        )}
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard color="text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30" count={overdueCount} icon={<AlertTriangle className="size-4" />} label={t.tabs.overdue} />
        <StatCard color="text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" count={dueTodayCount} icon={<Clock className="size-4" />} label={t.tabs.dueToday} />
        <StatCard color="text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" count={assignedCount} icon={<Inbox className="size-4" />} label={t.tabs.inProgress} />
        <StatCard color="text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" count={waitingCount} icon={<HandMetal className="size-4" />} label={t.tabs.waiting} />
      </div>

      {/* ── Overdue (red, highest priority) ── */}
      {overdueCount > 0 && (
        <TaskSection borderColor="border-red-500/40" emptyText={t.empty.overdue} headerColor="text-red-600 dark:text-red-400" icon={<AlertTriangle className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.overdue} title={t.tabs.overdue} urgency="overdue" />
      )}

      {/* ── Overdue Promises ── */}
      {activeData.overduePromises.length > 0 && (
        <TaskSection borderColor="border-orange-500/40" emptyText={t.empty.promises} headerColor="text-orange-600 dark:text-orange-400" icon={<Star className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.overduePromises} title={t.tabs.promises} urgency="overdue" />
      )}

      {/* ── Due Today (amber) ── */}
      <TaskSection borderColor="border-amber-500/40" emptyText={t.empty.dueToday} headerColor="text-amber-700 dark:text-amber-400" icon={<Clock className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.dueToday} title={t.tabs.dueToday} urgency="today" />

      {/* ── Assigned to Me (blue) ── */}
      <TaskSection borderColor="border-blue-500/40" emptyText={t.empty.inProgress} headerColor="text-blue-600 dark:text-blue-400" icon={<Inbox className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.assignedToMe} title={t.tabs.inProgress} urgency="normal" />

      {/* ── Waiting on Me (purple) ── */}
      <TaskSection borderColor="border-purple-500/40" emptyText={t.empty.waiting} headerColor="text-purple-700 dark:text-purple-400" icon={<HandMetal className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.waitingOnMe} title={t.tabs.waiting} urgency="normal" />

      {/* ── Completed (green, collapsed) ── */}
      {activeData.completed.length > 0 && (
        <TaskSection borderColor="border-emerald-500/40" collapsed emptyText={t.empty.overdue} headerColor="text-emerald-700 dark:text-emerald-400" icon={<CheckCircle2 className="size-4" />} isAdmin={isAdmin} locale={locale} onDelete={handleDeleteTask} t={t} tasks={activeData.completed} title={`${t.tabs.sent} (${activeData.completed.length})`} urgency="done" />
      )}
    </div>
  );
}

// ── Filter Button ──

function FilterButton({ active, count, icon, label, onClick, variant = 'default' }: {
  active: boolean; count: number; icon: React.ReactNode; label: string; onClick: () => void;
  variant?: 'default' | 'ticket' | 'complaint' | 'task';
}) {
  const activeClass =
    variant === 'ticket' ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
    : variant === 'complaint' ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
    : variant === 'task' ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
    : 'bg-brand text-brand-foreground border-brand shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? activeClass
          : 'border-line-subtle bg-surface/90 text-content-strong hover:bg-surface-raised hover:border-line-strong hover:text-brand shadow-2xs'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${active ? 'bg-black/20 text-white' : 'bg-surface-raised border border-line-subtle text-content-strong'}`}>
        {count}
      </span>
    </button>
  );
}

// ── Stat Card ──

function StatCard({ color, count, icon, label }: { color: string; count: number; icon: React.ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 bg-surface shadow-2xs ${color}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/5 dark:bg-white/10">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-content-strong">{count}</p>
        <p className="text-xs font-semibold opacity-90">{label}</p>
      </div>
    </div>
  );
}

// ── Task Section ──

function TaskSection({ borderColor, collapsed = false, emptyText, headerColor, icon, isAdmin = false, locale, onDelete, t, tasks, title, urgency }: {
  borderColor: string; collapsed?: boolean; emptyText: string; headerColor: string; icon: React.ReactNode;
  isAdmin?: boolean | undefined; locale: Locale; onDelete?: ((taskId: string) => void) | undefined; t: MyWorkCopy; tasks: StaffTask[]; title: string; urgency: Urgency;
}) {
  const [open, setOpen] = React.useState(!collapsed);
  return (
    <section className={`rounded-xl border ${borderColor} bg-surface shadow-xs`}>
      <button className={`flex w-full items-center gap-2 px-4 py-3 text-start font-semibold ${headerColor}`} onClick={() => setOpen(!open)} type="button">
        {icon}
        <span>{title}</span>
        <span className="ms-auto rounded-full bg-surface-raised border border-line-subtle px-2.5 py-0.5 text-xs font-bold tabular-nums text-content-strong">{tasks.length}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="grid gap-1 border-t border-line-subtle/50 px-2 py-2">
          {tasks.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-content-muted">{emptyText}</p>
          ) : (
            tasks.map((task) => <TaskRow key={task.id} isAdmin={isAdmin} locale={locale} onDelete={onDelete} t={t} task={task} urgency={urgency} />)
          )}
        </div>
      )}
    </section>
  );
}
