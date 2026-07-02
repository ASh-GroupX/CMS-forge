'use client';

import React, { useMemo, useState } from 'react';
import { addStaffComplaintComment, type StaffComplaintComment, type StaffComplaintCommentVisibility } from '../../lib/staff-complaint-comments-api';
import { complaintCommentText, complaintDetailText } from '../../i18n/staff-complaint-detail';
import type { Locale } from '../../i18n/staff-shell';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

export type ComplaintCommentsPreviewState = 'loading' | 'empty' | 'error';
type Status = 'idle' | 'loading' | 'success' | 'error' | 'validation';

export function ComplaintCommentsPanel({
  comments,
  commentsState,
  complaintId,
  locale,
}: {
  comments?: StaffComplaintComment[] | null | undefined;
  commentsState?: ComplaintCommentsPreviewState | undefined;
  complaintId?: string | undefined;
  locale: Locale;
}) {
  const t = complaintDetailText[locale];
  const ct = complaintCommentText[locale];
  const [items, setItems] = useState(() => comments ?? sampleComments());
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [visibility, setVisibility] = useState<StaffComplaintCommentVisibility>('INTERNAL');
  const grouped = useMemo(() => ({
    internal: items.filter((item) => item.visibility === 'INTERNAL'),
    public: items.filter((item) => item.visibility === 'PUBLIC'),
  }), [items]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!complaintId) return setStatus('error');
    if (!body.trim()) return setStatus('validation');
    setStatus('loading');
    const result = await addStaffComplaintComment(complaintId, { body, visibility });
    if (!result.ok) return setStatus('error');
    setItems((current) => [...current, result.data.comment]);
    setBody('');
    setStatus('success');
  }

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:col-span-2" aria-label={`${t.sections.internalComments} / ${t.sections.publicUpdates}`}>
      {commentsState ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:col-span-2" role={commentsState === 'error' ? 'alert' : 'status'}>
          {t.commentStates[commentsState]}
        </p>
      ) : (
        <>
          <CommentGroup badge={t.badges.internal} comments={grouped.internal} locale={locale} title={t.sections.internalComments} />
          <CommentGroup badge={t.badges.public} comments={grouped.public} locale={locale} title={t.sections.publicUpdates} />
          <form className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2" onSubmit={submit} aria-label={ct.form}>
            <div className="grid gap-3 md:grid-cols-[12rem_1fr_auto] md:items-end">
              <Label className="grid gap-1 text-sm font-medium">
                {t.labels.visibility}
                <Select value={visibility} onValueChange={(value) => setVisibility(value as StaffComplaintCommentVisibility)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL">{t.badges.internal}</SelectItem>
                    <SelectItem value="PUBLIC">{t.badges.public}</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
              <Label className="grid gap-1 text-sm font-medium">
                {ct.body}
                <Textarea className="min-h-20 bg-white" onChange={(event) => setBody(event.target.value)} value={body} />
              </Label>
              <Button className="focus:ring-2 focus:ring-ring" disabled={status === 'loading' || !complaintId} type="submit">
                {ct.submit}
              </Button>
            </div>
            {status !== 'idle' ? <p className="text-sm text-slate-600" role={status === 'error' || status === 'validation' ? 'alert' : 'status'}>{ct.states[status]}</p> : null}
          </form>
        </>
      )}
    </section>
  );
}

function CommentGroup({ badge, comments, locale, title }: { badge: string; comments: StaffComplaintComment[]; locale: Locale; title: string }) {
  const t = complaintDetailText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">{badge}</Badge>
      </div>
      {comments.length ? (
        <ol className="mt-3 grid gap-2 text-sm">
          {comments.map((comment) => (
            <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={comment.id}>
              <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                <span className="text-slate-500">{t.labels.author}</span>
                <span className="break-words font-medium text-slate-800">{comment.authorId ?? t.values.author}</span>
                <span className="text-slate-500">{t.labels.time}</span>
                <span className="break-words font-medium text-slate-800">{formatDate(comment.createdAt, locale)}</span>
                <span className="text-slate-500">{t.labels.visibility}</span>
                <span className="break-words font-medium text-slate-800">{badge}</span>
              </div>
              <p className="mt-2 break-words rounded-sm bg-slate-50 px-3 py-2 text-slate-700">{comment.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 rounded-sm bg-white px-3 py-2 text-sm text-slate-600">{t.commentStates.empty}</p>
      )}
    </section>
  );
}

function sampleComments(): StaffComplaintComment[] {
  return [
    { id: 'cmt_internal_preview', complaintId: 'cmp_preview', authorId: 'Authorized staff', body: 'Investigation note for the case team.', visibility: 'INTERNAL', createdAt: '2026-06-19T10:00:00.000Z' },
    { id: 'cmt_public_preview', complaintId: 'cmp_preview', authorId: 'Authorized staff', body: 'Your complaint is under review by the customer relations team.', visibility: 'PUBLIC', createdAt: '2026-06-19T10:15:00.000Z' },
  ];
}

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date);
}
