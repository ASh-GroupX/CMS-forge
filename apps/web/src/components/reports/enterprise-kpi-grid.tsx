import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Inbox,
  PauseCircle,
  ShieldCheck,
  Timer,
  UserX,
} from 'lucide-react';
import { Card } from '../ui/card';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface EnterpriseKpiData {
  totalCreated: number;
  openWorkload: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  overdue: number;
  unassigned: number;
  onTimeRate: number;
  avgTatDays: number;
  totalCreatedDelta: number;
  resolvedDelta: number;
}

interface EnterpriseKpiGridProps {
  locale: Locale;
  kpis: EnterpriseKpiData;
  activeFilterKey?: string | null;
  onFilterClick?: (key: string) => void;
}

export function EnterpriseKpiGrid({
  locale,
  kpis,
  activeFilterKey,
  onFilterClick,
}: EnterpriseKpiGridProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  const cards = [
    {
      key: 'all',
      title: t.kpis.totalCreated,
      value: kpis.totalCreated,
      delta: kpis.totalCreatedDelta,
      icon: Inbox,
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      borderColor: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500 bg-blue-500/5',
    },
    {
      key: 'open',
      title: t.kpis.openWorkload,
      value: kpis.openWorkload,
      icon: Clock,
      iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      borderColor: 'hover:border-indigo-500/50',
      activeBorder: 'border-indigo-500 bg-indigo-500/5',
    },
    {
      key: 'in_progress',
      title: t.kpis.inProgress,
      value: kpis.inProgress,
      icon: Activity,
      iconColor: 'text-primary bg-primary/10',
      borderColor: 'hover:border-primary/50',
      activeBorder: 'border-primary bg-primary/5',
    },
    {
      key: 'waiting',
      title: t.kpis.waiting,
      value: kpis.waiting,
      icon: PauseCircle,
      iconColor: 'text-muted-foreground bg-muted',
      borderColor: 'hover:border-border',
      activeBorder: 'border-border bg-muted/40',
    },
    {
      key: 'unassigned',
      title: t.kpis.unassigned,
      value: kpis.unassigned,
      icon: UserX,
      iconColor: 'text-muted-foreground bg-muted',
      borderColor: 'hover:border-border',
      activeBorder: 'border-border bg-muted/40',
    },
    {
      key: 'resolved',
      title: t.kpis.resolved,
      value: kpis.resolved,
      delta: kpis.resolvedDelta,
      icon: CheckCircle2,
      iconColor: 'text-primary bg-primary/10',
      borderColor: 'hover:border-primary/50',
      activeBorder: 'border-primary bg-primary/5',
    },
    {
      key: 'overdue',
      title: t.kpis.overdue,
      value: kpis.overdue,
      icon: AlertTriangle,
      iconColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
      borderColor: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-500 bg-rose-500/5',
      alert: kpis.overdue > 0,
    },
    {
      key: 'sla',
      title: t.kpis.onTimeRate,
      value: `${kpis.onTimeRate}%`,
      icon: ShieldCheck,
      iconColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
      borderColor: 'hover:border-teal-500/50',
      activeBorder: 'border-teal-500 bg-teal-500/5',
      isText: true,
    },
    {
      key: 'tat',
      title: t.kpis.avgResolutionDays,
      value: `${kpis.avgTatDays}d`,
      icon: Timer,
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
      borderColor: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-500 bg-purple-500/5',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilterKey === c.key;
        return (
          <Card
            key={c.key}
            onClick={() => onFilterClick && onFilterClick(c.key)}
            className={`p-3.5 flex flex-col justify-between transition-all cursor-pointer select-none rounded-xl border bg-card shadow-2xs hover:shadow-xs min-h-[96px] ${
              isActive ? c.activeBorder : c.borderColor
            } ${c.alert ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="text-xs font-semibold text-muted-foreground leading-snug line-clamp-2"
                title={c.title}
              >
                {c.title}
              </span>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-extrabold tracking-tight tabular-nums ${
                  c.alert ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                }`}>
                  {c.value}
                </span>
                {c.delta !== undefined && c.delta !== 0 && (
                  <span
                    className={`inline-flex items-center text-3xs font-bold ${
                      c.delta > 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {c.delta > 0 ? (
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5" />
                    )}
                    {Math.abs(c.delta)}%
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
