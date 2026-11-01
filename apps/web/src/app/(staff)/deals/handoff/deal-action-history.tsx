import React from 'react';
import { auditActionLabel } from '../../../../i18n/domain-labels';
import type { Locale } from '../../../../i18n/staff-shell';
import { formatDisplayDate } from '../../../../lib/locale-format';
import type { DealActionHistory } from '../../../../lib/staff-deals-api';

type DealActionCopy = {
  dealActions: Record<string, string>;
  fields: { history: string; lastAction: string; updateNote: string };
  states: { noHistory: string };
};

export function DealActionSummary({ action, locale, t }: { action: DealActionHistory | null; locale: Locale; t: DealActionCopy }) {
  if (!action) return null;
  return (
    <p className="mt-3 rounded-sm border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-muted">
      {t.fields.lastAction}: {actionLabel(action, t, locale)} - {formatDate(action.createdAt, locale)}
      {action.updateNote ? ` · ${action.updateNote}` : ''}
    </p>
  );
}

export function DealActionHistoryList({ history, locale, t }: { history: DealActionHistory[]; locale: Locale; t: DealActionCopy }) {
  return (
    <section className="mt-3 border-t border-line-subtle pt-3">
      <h4 className="text-sm font-semibold text-content-strong">{t.fields.history}</h4>
      {history.length ? (
        <ol className="mt-2 grid gap-2 text-sm">
          {history.map((item) => (
            <li className="rounded-sm bg-surface px-3 py-2" key={item.id}>
              {actionLabel(item, t, locale)} - {formatDate(item.createdAt, locale)}
              {item.updateNote ? <p className="mt-1 text-content-muted">{t.fields.updateNote}: {item.updateNote}</p> : null}
            </li>
          ))}
        </ol>
      ) : <p className="mt-2 text-sm text-content-muted">{t.states.noHistory}</p>}
    </section>
  );
}

function actionLabel(action: DealActionHistory, t: DealActionCopy, locale: Locale): string {
  return t.dealActions[action.action] ?? auditActionLabel(locale, action.action);
}

function formatDate(value: string, locale: Locale): string {
  return formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}
