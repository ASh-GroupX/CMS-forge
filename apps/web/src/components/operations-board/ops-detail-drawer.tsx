'use client';

import { ArrowRight, Building2, Calendar, Clock3, ExternalLink, MessageSquare, Shield, User2 } from 'lucide-react';
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { ComplaintBoardCard } from '../../lib/staff-complaint-board-api';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';
import type { Locale } from '../../i18n/staff-shell';

// ── Detail drawer ──────────────────────────────────────────────────────────
// Side panel that opens when clicking a card. Shows complaint summary and
// quick actions. Links to the full complaint workspace.

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-status-error/15 text-status-error border-status-error/30',
  HIGH: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  MEDIUM: 'bg-brand/10 text-brand border-brand/20',
  LOW: 'bg-surface-raised text-content-muted border-line-subtle',
};

const SLA_COLOR: Record<string, string> = {
  ON_TRACK: 'text-status-success',
  WARNING: 'text-status-warning',
  BREACHED: 'text-status-error',
  CLOSED: 'text-content-subtle',
};

export function OpsDetailDrawer({ card, locale, onClose, t }: {
  card: ComplaintBoardCard | null;
  locale: Locale;
  onClose: () => void;
  t: OperationsBoardCopy;
}) {
  const open = card !== null;
  const slaLabel = card ? (t.cardSla[card.slaState] ?? card.slaState) : '';
  const severityLabel = card ? (t.cardSeverity[card.severity] ?? card.severity) : '';
  const complaintHref = card ? `/complaints/${card.id}?locale=${locale}` : '#';

  return (
    <Sheet onOpenChange={(v) => { if (!v) onClose(); }} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" side={locale === 'ar' ? 'left' : 'right'}>
        {card && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2 text-base">
                <span className="font-bold">{card.referenceNumber}</span>
                <Badge className={`text-[0.625rem] ${SEVERITY_BADGE[card.severity] ?? ''}`} variant="outline">
                  {severityLabel}
                </Badge>
              </SheetTitle>
              <p className="text-sm text-content-muted">{card.subject}</p>
            </SheetHeader>

            {/* Summary grid */}
            <div className="grid gap-3 border-t border-line-subtle pt-4">
              <DetailRow icon={<Shield className="size-4" />} label={t.drawerStatus} value={card.status.replace(/_/g, ' ')} />
              <DetailRow icon={<Clock3 className="size-4" />} label={t.drawerSla}>
                <span className={`font-semibold ${SLA_COLOR[card.slaState] ?? ''}`}>
                  {slaLabel}
                  {card.slaDueAt && <span className="ms-1 text-xs font-normal">({formatDrawerDate(card.slaDueAt, locale)})</span>}
                </span>
              </DetailRow>
              <DetailRow icon={<User2 className="size-4" />} label={t.drawerOwner} value={card.ownerName ?? t.cardNoOwner} />
              <DetailRow icon={<Building2 className="size-4" />} label={t.drawerBranch} value={card.branchName} />
              <DetailRow icon={<Calendar className="size-4" />} label={t.drawerCreated} value={formatDrawerDate(card.createdAt, locale)} />
            </div>

            {/* Actions */}
            <div className="mt-6 grid gap-2">
              <Button asChild className="justify-between" size="lg">
                <a href={complaintHref}>
                  {t.drawerOpenFull}
                  <ExternalLink aria-hidden="true" className="ms-2 size-4" />
                </a>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={complaintHref}>
                    <ArrowRight aria-hidden="true" className="me-1.5 size-3.5" />
                    {t.drawerTransition}
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={complaintHref}>
                    <MessageSquare aria-hidden="true" className="me-1.5 size-3.5" />
                    {t.drawerAddNote}
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ children, icon, label, value }: {
  children?: React.ReactNode;
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-content-subtle" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-content-subtle">{label}</p>
        {children ?? <p className="text-sm font-semibold text-content-strong">{value}</p>}
      </div>
    </div>
  );
}

function formatDrawerDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
