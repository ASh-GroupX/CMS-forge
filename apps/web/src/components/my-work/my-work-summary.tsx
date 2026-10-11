'use client';

import { AlertTriangle, CalendarClock, Handshake, Inbox, Send, UsersRound } from 'lucide-react';
import React from 'react';
import type { MyWorkCopy } from '../../i18n/staff-my-work';

// ── Summary Strip ──────────────────────────────────────────────────────────
// Shows high-level counts for the user's workload, organized by urgency.

type SummaryCounts = {
  dueToday: number;
  overdue: number;
  inProgress: number;
  sent: number;
  promises: number;
  waiting: number;
};

export function MyWorkSummary({ counts, t }: { counts: SummaryCounts; t: MyWorkCopy }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard
        count={counts.overdue}
        icon={<AlertTriangle className="size-5" />}
        label={t.tabs.overdue}
        tone="danger"
      />
      <SummaryCard
        count={counts.dueToday}
        icon={<CalendarClock className="size-5" />}
        label={t.tabs.dueToday}
        tone="warning"
      />
      <SummaryCard
        count={counts.inProgress}
        icon={<Inbox className="size-5" />}
        label={t.tabs.inProgress}
        tone="brand"
      />
      <SummaryCard
        count={counts.promises}
        icon={<Handshake className="size-5" />}
        label={t.tabs.promises}
        tone="neutral"
      />
      <SummaryCard
        count={counts.sent}
        icon={<Send className="size-5" />}
        label={t.tabs.sent}
        tone="neutral"
      />
      <SummaryCard
        count={counts.waiting}
        icon={<UsersRound className="size-5" />}
        label={t.tabs.waiting}
        tone="neutral"
      />
    </div>
  );
}

const TONE_CLASSES = {
  danger: 'bg-status-error/10 text-status-error',
  warning: 'bg-status-warning/10 text-status-warning',
  brand: 'bg-brand/10 text-brand',
  neutral: 'bg-surface-raised text-content-muted',
};

function SummaryCard({ count, icon, label, tone }: { count: number; icon: React.ReactNode; label: string; tone: keyof typeof TONE_CLASSES }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface p-4 shadow-sm">
      <div className={`grid size-10 place-items-center rounded-full ${TONE_CLASSES[tone]}`}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums leading-none tracking-tight">{count}</p>
        <p className="mt-1 text-xs font-medium text-content-muted">{label}</p>
      </div>
    </div>
  );
}
