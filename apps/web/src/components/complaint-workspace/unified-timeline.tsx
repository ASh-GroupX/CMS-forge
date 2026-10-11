import { CheckCircle2, MessageSquare, PlayCircle, ShieldAlert, UserPlus, Clock } from 'lucide-react';
import React from 'react';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintTimelineItem } from '../../lib/staff-complaint-timeline-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';

export function UnifiedTimeline({
  detail,
  locale,
  t,
  timeline,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
  t: any;
  timeline: ComplaintTimelineItem[];
}) {
  if (timeline.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-content-muted">
        <MessageSquare className="mb-2 size-8 opacity-20" />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* Vertical line connecting all items */}
      <div className="absolute bottom-0 left-[27px] top-4 w-px bg-line-subtle" />

      <ul className="flex flex-col gap-6">
        {timeline.map((item) => (
          <li key={item.id} className="relative flex items-start gap-4">
            <div className="relative z-10 flex size-14 shrink-0 items-center justify-center">
              <TimelineIcon type={item.type} />
            </div>
            <div className="flex-1 mt-3">
              <div className="rounded-xl border border-line-subtle bg-surface-raised p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-content-strong">
                      {item.actor?.name || 'System'}
                    </span>
                    {item.actor?.role && (
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand">
                        {item.actor.role}
                      </span>
                    )}
                  </div>
                  <time className="text-content-muted" dateTime={item.createdAt}>
                    {formatTime(item.createdAt, locale)}
                  </time>
                </div>
                
                <p className="text-sm font-medium text-content-strong">
                  {item.summary}
                </p>
                
                {item.body && (
                  <div className="mt-3 whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm text-content-muted border border-line-subtle/50">
                    {item.body}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineIcon({ type }: { type: string }) {
  const baseClasses = "flex size-8 items-center justify-center rounded-full ring-4 ring-surface shadow-sm";
  
  switch (type) {
    case 'COMMENT':
    case 'TASK_COMMENT':
      return <div className={`${baseClasses} bg-blue-100 text-blue-600`}><MessageSquare className="size-4" /></div>;
    case 'STATUS':
    case 'COMPLAINT_STATUS':
      return <div className={`${baseClasses} bg-purple-100 text-purple-600`}><PlayCircle className="size-4" /></div>;
    case 'ASSIGNMENT':
      return <div className={`${baseClasses} bg-amber-100 text-amber-600`}><UserPlus className="size-4" /></div>;
    case 'SLA':
      return <div className={`${baseClasses} bg-red-100 text-red-600`}><ShieldAlert className="size-4" /></div>;
    case 'TASK':
    case 'TASK_STATUS':
    case 'WORKFLOW':
    case 'CAPA':
      return <div className={`${baseClasses} bg-emerald-100 text-emerald-600`}><CheckCircle2 className="size-4" /></div>;
    default:
      return <div className={`${baseClasses} bg-gray-100 text-gray-600`}><Clock className="size-4" /></div>;
  }
}

function formatTime(dateString: string, locale: Locale) {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
