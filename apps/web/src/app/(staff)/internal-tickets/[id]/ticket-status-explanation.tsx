import React from 'react';
import { AlertCircle, CheckCircle2, Clock3, XCircle } from 'lucide-react';

type Reason = { reasonEn?: string | null; reasonAr?: string | null } | null | undefined;
type TicketStatusExplanationProps = {
  locale: 'en' | 'ar';
  ticket: {
    status?: string | null;
    waitingReason?: Reason;
    customWaitingReason?: string | null;
    resolutionReason?: Reason;
    resolutionDetails?: string | null;
    rejectReason?: Reason;
    rejectDetails?: string | null;
  };
};

function reasonText(reason: Reason, locale: 'en' | 'ar') {
  return locale === 'ar'
    ? reason?.reasonAr || reason?.reasonEn || null
    : reason?.reasonEn || reason?.reasonAr || null;
}

export function TicketStatusExplanation({ locale, ticket }: TicketStatusExplanationProps) {
  const isAr = locale === 'ar';
  const config = ticket.status === 'WAITING'
    ? {
        icon: Clock3,
        label: isAr ? 'سبب الانتظار' : 'Why this ticket is waiting',
        reason: ticket.customWaitingReason || reasonText(ticket.waitingReason, locale),
        details: null,
        className: 'border-amber-500/30 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100',
      }
    : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
      ? {
          icon: CheckCircle2,
          label: isAr ? 'تفاصيل الحل' : 'How this ticket was resolved',
          reason: reasonText(ticket.resolutionReason, locale),
          details: ticket.resolutionDetails,
          className: 'border-emerald-500/30 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100',
        }
      : ticket.status === 'REJECTED'
        ? {
            icon: XCircle,
            label: isAr ? 'سبب الرفض' : 'Why this ticket was rejected',
            reason: reasonText(ticket.rejectReason, locale),
            details: ticket.rejectDetails,
            className: 'border-rose-500/30 bg-rose-50/70 text-rose-950 dark:bg-rose-950/20 dark:text-rose-100',
          }
        : null;

  if (!config || (!config.reason && !config.details)) return null;
  const Icon = config.icon || AlertCircle;

  return (
    <section className={`mt-4 rounded-xl border p-4 ${config.className}`} aria-label={config.label}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-bold">{config.label}</h3>
          {config.reason ? <p className="text-sm font-semibold">{config.reason}</p> : null}
          {config.details ? <p className="whitespace-pre-wrap text-sm opacity-90">{config.details}</p> : null}
        </div>
      </div>
    </section>
  );
}
