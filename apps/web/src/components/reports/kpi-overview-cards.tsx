'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Flame,
  HelpCircle,
  Hourglass,
  Percent,
  Star,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Locale } from '../../i18n/staff-shell';

export interface ReportKpiCardItem {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  tooltip: string;
  delta?: number | null;
  deltaInverse?: boolean; // If true, negative delta is good (e.g. overdue decrease)
  icon: 'file' | 'clock' | 'warning' | 'check' | 'flame' | 'star' | 'percent' | 'user' | 'hourglass';
  accent?: 'default' | 'danger' | 'warning' | 'success' | 'primary';
}

interface KpiOverviewCardsProps {
  locale: Locale;
  cards: ReportKpiCardItem[];
  onCardClick?: (cardId: string) => void;
  activeCardId?: string | null;
}

export function KpiOverviewCards({
  locale,
  cards,
  onCardClick,
  activeCardId,
}: KpiOverviewCardsProps) {
  const isRtl = locale === 'ar';

  const renderIcon = (type: ReportKpiCardItem['icon'], accent?: ReportKpiCardItem['accent']) => {
    const iconClass = 'h-5 w-5';
    switch (type) {
      case 'file':
        return <FileText className={`${iconClass} text-primary`} />;
      case 'clock':
        return <Clock className={`${iconClass} text-muted-foreground`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-destructive`} />;
      case 'check':
        return <CheckCircle2 className={`${iconClass} text-foreground`} />;
      case 'flame':
        return <Flame className={`${iconClass} text-primary`} />;
      case 'star':
        return <Star className={`${iconClass} text-primary fill-primary`} />;
      case 'percent':
        return <Percent className={`${iconClass} text-primary`} />;
      case 'user':
        return <UserCheck className={`${iconClass} text-foreground`} />;
      case 'hourglass':
        return <Hourglass className={`${iconClass} text-muted-foreground`} />;
      default:
        return <FileCheck2 className={`${iconClass} text-primary`} />;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => {
        const isClickable = Boolean(onCardClick);
        const isSelected = activeCardId === card.id;

        // Delta calculation: if delta > 0, positive; delta < 0, negative
        let deltaColor = 'text-muted-foreground bg-muted';
        let DeltaIcon = null;
        if (card.delta !== undefined && card.delta !== null && card.delta !== 0) {
          const isGood = card.deltaInverse ? card.delta < 0 : card.delta > 0;
          deltaColor = isGood ? 'text-foreground bg-muted border-border' : 'text-destructive bg-destructive/10 border-destructive/20';
          DeltaIcon = card.delta > 0 ? TrendingUp : TrendingDown;
        }

        return (
          <Card
            key={card.id}
            onClick={() => isClickable && onCardClick?.(card.id)}
            className={`relative flex flex-col justify-between overflow-hidden p-4 transition-all ${
              isClickable ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''
            } ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
          >
            {/* Header: Title and Tooltip */}
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground line-clamp-1">
                <span>{card.title}</span>
                <span title={card.tooltip} className="cursor-help text-muted-foreground/60 hover:text-muted-foreground">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </div>
              <div className="rounded-lg bg-background p-1.5 shadow-2xs border">
                {renderIcon(card.icon, card.accent)}
              </div>
            </div>

            {/* Metric Value */}
            <div className="my-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">{card.value}</span>
              {card.unit && <span className="text-xs font-normal text-muted-foreground">{card.unit}</span>}
            </div>

            {/* Footer: Delta */}
            <div className="flex items-center justify-between text-2xs pt-1 border-t">
              {card.delta !== undefined && card.delta !== null && card.delta !== 0 ? (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium border ${deltaColor}`}>
                  {DeltaIcon && <DeltaIcon className="h-2.5 w-2.5" />}
                  <span>
                    {card.delta > 0 ? '+' : ''}
                    {card.delta}%
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground/70">—</span>
              )}
              <span className="text-muted-foreground/60 text-3xs">
                {isRtl ? 'مقارنة بالسابق' : 'vs prev'}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
