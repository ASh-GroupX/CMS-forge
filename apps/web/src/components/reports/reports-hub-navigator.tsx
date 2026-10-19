import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ClipboardCheck, Network, ShieldCheck, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface ReportsHubNavigatorProps {
  locale: Locale;
}

export function ReportsHubNavigator({ locale }: ReportsHubNavigatorProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="mb-6 space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-card to-muted/40 p-5 shadow-xs">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t.hub.title}</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{t.hub.subtitle}</p>
      </div>

      {/* Two Primary Analytical Workspace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: CRM Complaints Center */}
        <Card className="flex flex-col justify-between p-5 border-primary/20 hover:border-primary/50 transition-all hover:shadow-md bg-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-2xs font-semibold text-blue-600 border-blue-200 dark:border-blue-800">
                CRM Analytics
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t.hub.complaintsCardTitle}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t.hub.complaintsCardDesc}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 text-2xs text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5">SLA Compliance</span>
              <span className="rounded bg-muted px-2 py-0.5">Officer Caseloads</span>
              <span className="rounded bg-muted px-2 py-0.5">Turnaround TAT</span>
              <span className="rounded bg-muted px-2 py-0.5">Backlog Aging</span>
            </div>
          </div>
          <div className="pt-5 border-t mt-4">
            <Link href={`/reports/complaints?locale=${locale}`} className="w-full block">
              <Button type="button" className="w-full justify-between group">
                <span>{t.hub.complaintsCardAction}</span>
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: Internal Tickets Center */}
        <Card className="flex flex-col justify-between p-5 border-primary/20 hover:border-primary/50 transition-all hover:shadow-md bg-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Network className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-2xs font-semibold text-indigo-600 border-indigo-200 dark:border-indigo-800">
                Internal Operations
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t.hub.ticketsCardTitle}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t.hub.ticketsCardDesc}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 text-2xs text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5">Dept-to-Dept Flow</span>
              <span className="rounded bg-muted px-2 py-0.5">Waiting Reasons</span>
              <span className="rounded bg-muted px-2 py-0.5">On-Time Completion</span>
              <span className="rounded bg-muted px-2 py-0.5">Peer Ratings</span>
            </div>
          </div>
          <div className="pt-5 border-t mt-4">
            <Link href={`/reports/internal-tickets?locale=${locale}`} className="w-full block">
              <Button type="button" className="w-full justify-between group" variant="default">
                <span>{t.hub.ticketsCardAction}</span>
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
