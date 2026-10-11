'use client';

import React, { useState } from 'react';
import type { EmployeeTodayTasks, StaffTask } from '../../lib/staff-tasks-api';
import type { ComplaintQueueItem } from '../../lib/staff-complaints-api';
import { myWorkText } from '../../i18n/staff-my-work';
import type { Locale } from '../../i18n/staff-shell';
import { MyWorkRow } from './my-work-row';
import { MyWorkSummary } from './my-work-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { StateBlock } from '../shared/ui-primitives';

// ── My Work Main Screen ────────────────────────────────────────────────────
// A consolidated workspace combining tasks and complaints assigned to the user.
// Grouped into tabs by urgency.

type WorkPayload = {
  tasks: EmployeeTodayTasks;
  complaints: ComplaintQueueItem[];
};

export function MyWorkScreen({ locale, payload, state }: {
  locale: Locale;
  payload: WorkPayload | null;
  state?: 'denied' | 'error';
}) {
  const t = myWorkText[locale];
  const [activeTab, setActiveTab] = useState('dueToday');

  if (state || !payload) {
    return (
      <section aria-label={t.title} className="grid content-start gap-4">
        <header>
          <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
        </header>
        <StateBlock message={state === 'denied' ? t.states.denied : t.states.error} tone="error" />
      </section>
    );
  }

  // Aggregate complaints and tasks into the right tabs.
  // In a real implementation, the backend `/my-work` endpoint would pre-sort these.
  // For Phase 1, we map existing data structures.
  const { tasks, complaints } = payload;
  
  // Categorize complaints (tasks are already categorized by EmployeeTodayTasks)
  const overdueComplaints = complaints.filter(c => c.slaState === 'BREACHED');
  const dueTodayComplaints = complaints.filter(c => c.slaState === 'WARNING');
  const inProgressComplaints = complaints.filter(c => c.slaState === 'ON_TRACK');

  const tabs = {
    overdue: {
      items: [...overdueComplaints.map(c => ({ item: c, type: 'complaint' as const })), ...tasks.overdue.map(t => ({ item: t, type: 'task' as const }))],
      count: overdueComplaints.length + tasks.overdue.length,
      label: t.tabs.overdue,
      emptyText: t.empty.overdue,
    },
    dueToday: {
      items: [...dueTodayComplaints.map(c => ({ item: c, type: 'complaint' as const })), ...tasks.dueToday.map(t => ({ item: t, type: 'task' as const }))],
      count: dueTodayComplaints.length + tasks.dueToday.length,
      label: t.tabs.dueToday,
      emptyText: t.empty.dueToday,
    },
    inProgress: {
      items: [...inProgressComplaints.map(c => ({ item: c, type: 'complaint' as const })), ...tasks.assignedToMe.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN').map(t => ({ item: t, type: 'task' as const }))],
      count: inProgressComplaints.length + tasks.assignedToMe.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN').length,
      label: t.tabs.inProgress,
      emptyText: t.empty.inProgress,
    },
    promises: {
      items: tasks.overduePromises.map(t => ({ item: t, type: 'task' as const })),
      count: tasks.overduePromises.length,
      label: t.tabs.promises,
      emptyText: t.empty.promises,
    },
    sent: {
      // Sent tasks aren't in the base EmployeeTodayTasks so we approximate if empty
      items: [],
      count: 0,
      label: t.tabs.sent,
      emptyText: t.empty.sent,
    },
    waiting: {
      items: tasks.waitingOnMe.map(t => ({ item: t, type: 'task' as const })),
      count: tasks.waitingOnMe.length,
      label: t.tabs.waiting,
      emptyText: t.empty.waiting,
    },
  };

  const counts = {
    overdue: tabs.overdue.count,
    dueToday: tabs.dueToday.count,
    inProgress: tabs.inProgress.count,
    promises: tabs.promises.count,
    sent: tabs.sent.count,
    waiting: tabs.waiting.count,
  };

  // Sort items in each tab by due date
  Object.values(tabs).forEach(tab => {
    tab.items.sort((a, b) => {
      const aDate = a.type === 'task' ? (a.item as StaffTask).dueAt : (a.item as ComplaintQueueItem).slaDueAt;
      const bDate = b.type === 'task' ? (b.item as StaffTask).dueAt : (b.item as ComplaintQueueItem).slaDueAt;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  });

  return (
    <section aria-label={t.title} className="grid content-start gap-5">
      <header>
        <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
      </header>

      <MyWorkSummary counts={counts} t={t} />

      <Tabs className="w-full" defaultValue={activeTab} dir={locale === 'ar' ? 'rtl' : 'ltr'} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex min-w-full justify-start rounded-none border-b border-line-subtle bg-transparent p-0">
            {Object.entries(tabs).map(([key, tab]) => (
              <TabsTrigger
                className="relative h-11 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 text-sm font-semibold text-content-muted hover:text-content-strong data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none"
                key={key}
                value={key}
              >
                {tab.label}
                <span className="ms-2 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium tabular-nums text-content-strong">
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {Object.entries(tabs).map(([key, tab]) => (
          <TabsContent className="mt-4 outline-none" key={key} value={key}>
            {tab.items.length === 0 ? (
              <div className="rounded-xl border border-line-subtle border-dashed p-8 text-center">
                <p className="text-sm text-content-muted">{tab.emptyText}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line-subtle shadow-sm">
                {tab.items.map(({ item, type }, idx) => (
                  <MyWorkRow
                    item={item}
                    key={(item as any).id || idx}
                    locale={locale}
                    t={t}
                    type={type}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
