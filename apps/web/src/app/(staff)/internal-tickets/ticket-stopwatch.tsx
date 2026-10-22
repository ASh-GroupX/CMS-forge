'use client';

import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle2, PauseCircle, Clock } from 'lucide-react';
import type { Locale } from '../../../i18n/staff-shell';

interface TicketStopwatchProps {
  ticket: any;
  locale: Locale;
  variant?: 'badge' | 'card' | 'compact';
}

function calculateInProgressMs(ticket: any): number {
  if (!ticket) return 0;

  const activities: any[] = Array.isArray(ticket.activities) ? ticket.activities : [];
  
  if (activities.length > 0) {
    const sorted = [...activities].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let totalMs = 0;
    let intervalStart: number | null = null;

    for (const act of sorted) {
      const isStart = act.action === 'ACCEPTED' || act.action === 'STATUS_CHANGED_IN_PROGRESS';
      const isPauseOrEnd = [
        'WAITING_FOR_RESPONSE',
        'STATUS_CHANGED_WAITING',
        'RESOLVED',
        'STATUS_CHANGED_RESOLVED',
        'CLOSED',
        'STATUS_CHANGED_CLOSED',
        'REJECTED',
        'STATUS_CHANGED_REJECTED',
      ].includes(act.action);

      if (isStart) {
        if (intervalStart === null) {
          intervalStart = new Date(act.createdAt).getTime();
        }
      } else if (isPauseOrEnd && intervalStart !== null) {
        totalMs += Math.max(0, new Date(act.createdAt).getTime() - intervalStart);
        intervalStart = null;
      }
    }

    if (intervalStart !== null) {
      if (ticket.status === 'IN_PROGRESS') {
        totalMs += Math.max(0, Date.now() - intervalStart);
      } else if (ticket.resolvedAt || ticket.closedAt) {
        const end = new Date(ticket.resolvedAt || ticket.closedAt).getTime();
        totalMs += Math.max(0, end - intervalStart);
      }
    }

    if (totalMs > 0) return totalMs;
  }

  // Fallback if no activity intervals found
  if (ticket.status === 'IN_PROGRESS') {
    const start = new Date(ticket.inProgressAt || ticket.updatedAt || ticket.createdAt).getTime();
    return Math.max(0, Date.now() - start);
  }

  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    const end = new Date(ticket.resolvedAt || ticket.closedAt || ticket.updatedAt).getTime();
    const start = new Date(ticket.inProgressAt || ticket.createdAt).getTime();
    return Math.max(0, end - start);
  }

  return 0;
}

function formatDuration(ms: number, isAr: boolean): string {
  if (ms <= 0) return isAr ? '0د' : '0m';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (isAr) {
    if (days > 0) return `${days}ي ${hours}س ${minutes}د`;
    if (hours > 0) return `${hours}س ${minutes}د`;
    return `${minutes}د`;
  } else {
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

export function TicketStopwatch({ ticket, locale, variant = 'card' }: TicketStopwatchProps) {
  const isAr = locale === 'ar';
  const isInProgress = ticket?.status === 'IN_PROGRESS';
  const isWaiting = ticket?.status === 'WAITING';
  const isResolvedOrClosed = ticket?.status === 'RESOLVED' || ticket?.status === 'CLOSED';
  const isNotStarted = !isInProgress && !isWaiting && !isResolvedOrClosed;

  const [elapsedMs, setElapsedMs] = useState<number>(() => calculateInProgressMs(ticket));

  useEffect(() => {
    setElapsedMs(calculateInProgressMs(ticket));

    if (!isInProgress) return;

    // Tick every 30 seconds to update minutes smoothly without seconds flickering
    const interval = setInterval(() => {
      setElapsedMs(calculateInProgressMs(ticket));
    }, 30000);

    return () => clearInterval(interval);
  }, [ticket, isInProgress]);

  const displayTime = isNotStarted ? (isAr ? 'لم يبدأ بعد' : 'Not started') : formatDuration(elapsedMs, isAr);

  if (variant === 'badge') {
    if (isInProgress) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
          </span>
          <Timer className="size-3.5 text-amber-600 dark:text-amber-400" />
          <span className="font-mono">{displayTime}</span>
        </div>
      );
    }

    if (isResolvedOrClosed) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono">{displayTime}</span>
        </div>
      );
    }

    if (isWaiting) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-500/10 border border-slate-500/25 px-2.5 py-1 text-xs font-medium text-content-muted">
          <PauseCircle className="size-3.5 text-slate-500" />
          <span className="font-mono">{displayTime}</span>
        </div>
      );
    }

    return null;
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
          isInProgress ? 'text-amber-600 dark:text-amber-400' : 'text-content-muted'
        }`}
        title={isAr ? 'مدة قيد التنفيذ' : 'Time in progress'}
      >
        <Timer className="size-3 shrink-0" />
        <span className="font-mono">{displayTime}</span>
      </div>
    );
  }

  // variant === 'card'
  let statusSubtitle = isAr ? 'لم يبدأ بعد' : 'Not started yet';
  if (isInProgress) {
    statusSubtitle = isAr ? 'قيد العمل حالياً' : 'Active in progress';
  } else if (isWaiting) {
    statusSubtitle = isAr ? 'متوقف مؤقتاً' : 'Work paused';
  } else if (isResolvedOrClosed) {
    statusSubtitle = isAr ? 'إجمالي وقت العمل' : 'Total time worked';
  }

  return (
    <div>
      <span className="text-[10px] text-content-muted font-bold uppercase tracking-wider block mb-1">
        {isAr ? 'مدة قيد التنفيذ' : 'Time in Progress'}
      </span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <Timer
            className={`size-4 ${
              isInProgress ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-content-muted'
            }`}
          />
          <span className="text-sm font-semibold text-content-strong font-mono">
            {displayTime}
          </span>
          {isInProgress && (
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
            </span>
          )}
        </div>
        <span className="text-xs text-content-muted">{statusSubtitle}</span>
      </div>
    </div>
  );
}
