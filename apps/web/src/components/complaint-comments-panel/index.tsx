import React from 'react';
import { Badge } from '../ui/badge';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import type { Locale } from '../../i18n/staff-shell';

export type ComplaintCommentsPreviewState = 'loading' | 'empty' | 'error';

export function ComplaintCommentsPanel({
  commentsState,
  locale,
}: {
  commentsState?: ComplaintCommentsPreviewState | undefined;
  locale: Locale;
}) {
  const t = complaintDetailText[locale];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:col-span-2" aria-label={`${t.sections.internalComments} / ${t.sections.publicUpdates}`}>
      {commentsState ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:col-span-2" role={commentsState === 'error' ? 'alert' : 'status'}>
          {t.commentStates[commentsState]}
        </p>
      ) : (
        <>
          <CommentPanel badge={t.badges.internal} body={t.values.internalBody} locale={locale} title={t.sections.internalComments} />
          <CommentPanel badge={t.badges.public} body={t.values.publicBody} locale={locale} title={t.sections.publicUpdates} />
        </>
      )}
    </section>
  );
}

function CommentPanel({ badge, body, locale, title }: { badge: string; body: string; locale: Locale; title: string }) {
  const t = complaintDetailText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">{badge}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        {[
          [t.labels.author, t.values.author],
          [t.labels.time, t.values.time],
          [t.labels.visibility, badge],
        ].map(([label, value]) => (
          <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-sm bg-white px-3 py-2 text-sm text-slate-700">{body}</p>
    </section>
  );
}
