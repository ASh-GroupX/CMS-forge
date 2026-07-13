import React from 'react';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { complaintStatusLabel, slaStateLabel, taskStatusLabel, timelineTypeLabel } from '../../i18n/domain-labels';
import type { Locale } from '../../i18n/staff-shell';
import { formatDisplayDate, formatDisplayNumber } from '../../lib/locale-format';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { StatusBadge } from '../shared/ui-primitives';

export function CommunicationTimelinePanel({
  detail,
  locale,
  text,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
  text: typeof complaintDetailText.en;
}) {
  const items = detail.communicationTimeline;
  const groups = [
    { key: 'all', label: text.timelineFilters.all, rows: items },
    { key: 'public', label: text.timelineFilters.public, rows: items.filter((item) => item.customerVisible) },
    { key: 'internal', label: text.timelineFilters.internal, rows: items.filter((item) => item.visibility === 'INTERNAL') },
    { key: 'files', label: text.sections.attachments, rows: items.filter((item) => item.type === 'ATTACHMENT') },
    { key: 'status', label: text.labels.status, rows: items.filter((item) => item.type === 'WORKFLOW' || item.type === 'STATUS' || item.type === 'COMPLAINT_STATUS' || item.type === 'SLA') },
    { key: 'capa', label: text.capa.title, rows: items.filter((item) => item.type === 'CAPA') },
  ];
  const latest = items.at(-1);
  const latestRows = items.slice(-5).reverse();
  return (
    <section className="grid gap-3 rounded-md border border-line-subtle bg-surface p-3 xl:col-span-2" aria-label={text.sections.communicationTimeline}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{text.sections.communicationTimeline}</h2>
          <p className="mt-1 text-xs text-content-muted">{latest ? `${latest.summary} - ${formatDate(latest.createdAt, locale)}` : text.commentStates.empty}</p>
        </div>
        <StatusBadge tone={latest?.customerVisible ? 'success' : 'neutral'}>{latest?.customerVisible ? text.badges.public : text.badges.internal}</StatusBadge>
      </div>
      <div className="grid gap-1 rounded-sm border border-line-subtle bg-surface-raised px-2 py-2 text-xs text-content-muted" aria-label={text.timelineLegend.latest}>
        <p><span className="font-semibold text-content-strong">{text.badges.public}:</span> {text.timelineLegend.public}</p>
        <p><span className="font-semibold text-content-strong">{text.badges.internal}:</span> {text.timelineLegend.internal}</p>
      </div>
      <h3 className="text-xs font-semibold text-content-strong">{text.timelineLegend.latest}</h3>
      <TimelineRows emptyText={text.commentStates.empty} groupKey="latest" locale={locale} rows={latestRows} text={text} />
      <div className="grid gap-2">
        {groups.slice(1).map((group) => (
          <details className="rounded-sm border border-line-subtle bg-surface-raised p-2" key={group.key}>
            <summary className="cursor-pointer text-xs font-semibold text-content-strong">
              {group.label} ({formatCount(group.rows.length, locale)})
            </summary>
            <TimelineRows emptyText={text.commentStates.empty} groupKey={group.key} locale={locale} rows={group.rows.slice(-8).reverse()} text={text} />
          </details>
        ))}
      </div>
    </section>
  );
}

function TimelineRows({ emptyText, groupKey, locale, rows, text }: { emptyText: string; groupKey: string; locale: Locale; rows: StaffComplaintDetailView['communicationTimeline']; text: typeof complaintDetailText.en }) {
  if (!rows.length) return <p className="mt-2 rounded-sm bg-surface px-2 py-2 text-xs text-content-muted" role="status">{emptyText}</p>;
  return (
    <ol className="mt-2 grid gap-2">
      {rows.map((item) => (
        <li className="rounded-sm bg-surface px-2 py-2 text-xs" key={`${groupKey}-${item.id}`}>
          <div className="flex flex-wrap gap-1">
            <StatusBadge tone={timelineTone(item)}>{timelineTypeLabel(locale, item.type)}</StatusBadge>
            <StatusBadge tone={item.customerVisible ? 'success' : item.visibility === 'SYSTEM' ? 'neutral' : 'warning'}>{visibilityLabel(item.visibility, text)}</StatusBadge>
          </div>
          <p className="mt-2 font-semibold text-content-strong">{summaryText(item, locale, text)}</p>
          {item.body ? <p className="mt-1 break-words text-content-muted">{item.body}</p> : null}
          <p className="mt-1 text-content-muted">{formatDate(item.createdAt, locale)} - {item.actor?.name ?? item.actor?.role ?? text.values.author}</p>
        </li>
      ))}
    </ol>
  );
}

function timelineTone(item: StaffComplaintDetailView['communicationTimeline'][number]): 'brand' | 'danger' | 'info' | 'neutral' | 'success' | 'warning' {
  if (item.type === 'SLA') return 'warning';
  if (item.type === 'ATTACHMENT') return 'info';
  if (item.type === 'CAPA') return 'warning';
  if (item.type === 'COMMENT') return item.customerVisible ? 'success' : 'warning';
  if (item.type === 'PUBLIC_UPDATE') return 'success';
  if (item.type.startsWith('TASK')) return 'info';
  if (item.type === 'WORKFLOW' || item.type === 'STATUS' || item.type === 'COMPLAINT_STATUS' || item.type === 'ASSIGNMENT') return 'brand';
  return 'neutral';
}

function visibilityLabel(visibility: StaffComplaintDetailView['communicationTimeline'][number]['visibility'], text: typeof complaintDetailText.en): string {
  if (visibility === 'PUBLIC') return text.badges.public;
  if (visibility === 'INTERNAL') return text.badges.internal;
  return text.timelineFilters.system;
}

function summaryText(item: StaffComplaintDetailView['communicationTimeline'][number], locale: Locale, text: typeof complaintDetailText.en): string {
  const toStatus = stringMeta(item.metadata?.toStatus);
  if ((item.type === 'WORKFLOW' || item.type === 'STATUS' || item.type === 'COMPLAINT_STATUS') && toStatus) {
    const action = stringMeta(item.metadata?.action);
    const actionLabel = action ? (text.workflow.actionLabels as Record<string, string>)[action] : null;
    return [actionLabel ?? timelineTypeLabel(locale, item.type), complaintStatusLabel(locale, toStatus)].filter(Boolean).join(': ');
  }
  if (item.type === 'TASK_STATUS' && toStatus) return `${timelineTypeLabel(locale, item.type)}: ${taskStatusLabel(locale, toStatus)}`;
  if (item.type === 'SLA') {
    const eventType = stringMeta(item.metadata?.type);
    const stage = stringMeta(item.metadata?.stage);
    return [timelineTypeLabel(locale, item.type), eventType ? slaStateLabel(locale, eventType) : null, stage ? complaintStatusLabel(locale, stage) : null].filter(Boolean).join(': ');
  }
  return item.summary;
}

function stringMeta(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function formatCount(value: number, locale: Locale): string {
  return formatDisplayNumber(value, locale);
}

function formatDate(value: string, locale: Locale): string {
  return formatDisplayDate(value, locale);
}
