'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { collaborationErrorMessage, collaborationText } from '../../i18n/staff-collaboration';
import { complaintCommentText, complaintDetailText } from '../../i18n/staff-complaint-detail';
import type { Locale } from '../../i18n/staff-shell';
import { formatDisplayDate, formatDisplayNumber, missingDisplay } from '../../lib/locale-format';
import { addStaffComplaintComment, getComplaintCommunicationTargets, removeComplaintWatcher, type CollaborationTarget, type CommunicationTargets, type StaffComplaintComment, type StaffComplaintCommentVisibility } from '../../lib/staff-complaint-comments-api';
import { ActionDialog } from '../shared/action-dialog';
import { AudiencePicker } from '../shared/audience-picker';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

export type ComplaintCommentsFixtureState = 'loading' | 'empty' | 'error';
type Status = 'idle' | 'loading' | 'success' | 'error' | 'validation';

export function ComplaintCommentsPanel({ comments, commentsState, complaintId, initialVisibility = 'INTERNAL', locale }: { comments?: StaffComplaintComment[] | null | undefined; commentsState?: ComplaintCommentsFixtureState | undefined; complaintId?: string | undefined; initialVisibility?: StaffComplaintCommentVisibility | undefined; locale: Locale }) {
  const detail = complaintDetailText[locale];
  const copy = complaintCommentText[locale];
  const collaboration = collaborationText[locale];
  const [items, setItems] = useState(() => comments ?? []);
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<StaffComplaintCommentVisibility>(initialVisibility);
  const [mentions, setMentions] = useState<CollaborationTarget[]>([]);
  const [cc, setCc] = useState<CollaborationTarget[]>([]);
  const [actionMode, setActionMode] = useState<'none' | 'task'>('none');
  const [actionTitle, setActionTitle] = useState('');
  const [assignee, setAssignee] = useState<CollaborationTarget | null>(null);
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [canComment, setCanComment] = useState(true);
  const [publicConfirm, setPublicConfirm] = useState(false);
  const [audienceConfirm, setAudienceConfirm] = useState<number | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const grouped = useMemo(() => ({ internal: items.filter((item) => item.visibility === 'INTERNAL'), public: items.filter((item) => item.visibility === 'PUBLIC') }), [items]);
  const loadTargets = useCallback((query: string) => complaintId ? getComplaintCommunicationTargets(complaintId, query) : Promise.resolve(null), [complaintId]);
  const loaded = useCallback((data: CommunicationTargets) => setCanComment(data.capabilities.canComment), []);
  const removeWatcher = useCallback(async (userId: string) => complaintId ? (await removeComplaintWatcher(complaintId, userId)).ok : false, [complaintId]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    if (visibility === 'PUBLIC') setPublicConfirm(true);
    else void send();
  }

  function validate(): boolean {
    if (!complaintId || !body.trim()) { setStatus('validation'); setMessage(copy.states.validation); return false; }
    if (visibility === 'INTERNAL' && actionMode === 'task' && (!actionTitle.trim() || !assignee || !dueAt)) { setStatus('validation'); setMessage(locale === 'ar' ? 'أكمل عنوان المهمة والمسؤول والموعد النهائي.' : 'Complete the task title, assignee, and deadline.'); return false; }
    return true;
  }

  async function send(confirmedRecipientCount?: number) {
    if (!complaintId || !validate()) return;
    setStatus('loading');
    setMessage(copy.states.loading);
    const result = await addStaffComplaintComment(complaintId, {
      body: body.trim(), visibility,
      ...(visibility === 'INTERNAL' ? {
        mentionTargets: mentions.map(({ id, type }) => ({ id, type })),
        ccUserIds: cc.map(({ id }) => id),
        ...(confirmedRecipientCount !== undefined ? { confirmedRecipientCount } : {}),
        ...(actionMode === 'task' && assignee ? { actionTask: { title: actionTitle.trim(), assigneeId: assignee.id, dueAt: new Date(dueAt).toISOString() } } : {}),
      } : {}),
    });
    if (!result.ok) {
      if (result.error.code === 'COLLABORATION_AUDIENCE_CONFIRMATION_REQUIRED' && result.error.actualRecipientCount !== undefined) {
        setAudienceConfirm(result.error.actualRecipientCount); setStatus('idle'); setMessage(''); return;
      }
      setStatus('error'); setMessage(collaborationErrorMessage(locale, result.error.code)); return;
    }
    setItems((current) => [...current, result.data.comment]);
    setBody(''); setMentions([]); setCc([]); setActionMode('none'); setActionTitle(''); setAssignee(null); setDueAt('');
    setStatus('success'); setMessage(copy.states.success); setPickerVersion((value) => value + 1);
  }

  function changeVisibility(value: string) {
    setVisibility(value as StaffComplaintCommentVisibility);
    setStatus('idle'); setMessage('');
    if (value === 'PUBLIC') { setMentions([]); setCc([]); setActionMode('none'); setAssignee(null); }
  }

  return (
    <section className="grid gap-4" aria-label={`${detail.sections.internalComments} / ${detail.sections.publicUpdates}`}>
      {commentsState ? <StateBlock message={detail.commentStates[commentsState]} tone={commentsState === 'error' ? 'error' : 'neutral'} /> : <>
        <CommentGroup badge={detail.badges.internal} comments={grouped.internal} locale={locale} title={detail.sections.internalComments} />
        <CommentGroup badge={detail.badges.public} comments={grouped.public} locale={locale} title={detail.sections.publicUpdates} />
        <form aria-label={copy.form} className="grid gap-4 rounded-md border border-line-subtle bg-surface-raised p-4" onSubmit={submit}>
          <Label className="grid gap-1 text-sm font-medium">{detail.labels.visibility}<Select onValueChange={changeVisibility} value={visibility}><SelectTrigger aria-label={detail.labels.visibility}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INTERNAL">{detail.badges.internal}</SelectItem><SelectItem value="PUBLIC">{detail.badges.public}</SelectItem></SelectContent></Select></Label>
          {visibility === 'PUBLIC' ? <StateBlock message={collaboration.publicWarning} tone="warning" /> : null}
          <Label className="grid gap-1 text-sm font-medium">{copy.body}<Textarea className="min-h-28" onChange={(event) => setBody(event.target.value)} value={body} /></Label>
          {visibility === 'INTERNAL' ? <>
            <AudiencePicker assignee={actionMode === 'task' ? { selected: assignee, onSelect: setAssignee } : undefined} cc={cc} disabled={!canComment || status === 'loading'} key={pickerVersion} loadTargets={loadTargets} locale={locale} mentions={mentions} onLoaded={loaded} onRemoveWatcher={removeWatcher} setCc={setCc} setMentions={setMentions} />
            <Label className="grid gap-1 text-sm font-medium">{copy.action}<Select onValueChange={(value) => { setActionMode(value as 'none' | 'task'); if (value === 'none') setAssignee(null); }} value={actionMode}><SelectTrigger aria-label={copy.action}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{copy.noAction}</SelectItem><SelectItem value="task">{copy.action}</SelectItem></SelectContent></Select></Label>
            {actionMode === 'task' ? <ActionTaskFields assignee={assignee} dueAt={dueAt} locale={locale} onDueAtChange={setDueAt} onTitleChange={setActionTitle} title={actionTitle} /> : null}
          </> : null}
          <Button disabled={status === 'loading' || !complaintId || !canComment} type="submit">{visibility === 'PUBLIC' ? collaboration.publicCta : copy.submit}</Button>
          {status !== 'idle' ? <StateBlock message={message} tone={status === 'error' || status === 'validation' ? 'error' : status === 'success' ? 'success' : 'neutral'} /> : null}
        </form>
      </>}
      <ActionDialog description={collaboration.publicConfirmDescription} footer={<><Button onClick={() => setPublicConfirm(false)} type="button" variant="outline">{collaboration.cancel}</Button><Button onClick={() => { setPublicConfirm(false); void send(); }} type="button">{collaboration.publicConfirmAction}</Button></>} onOpenChange={setPublicConfirm} open={publicConfirm} title={collaboration.publicConfirmTitle}><p className="whitespace-pre-wrap break-words text-sm">{body}</p></ActionDialog>
      <ActionDialog description={collaboration.audienceConfirmDescription} footer={<><Button onClick={() => setAudienceConfirm(null)} type="button" variant="outline">{collaboration.cancel}</Button><Button onClick={() => { const count = audienceConfirm; setAudienceConfirm(null); if (count !== null) void send(count); }} type="button">{collaboration.audienceConfirmAction}</Button></>} onOpenChange={(open) => { if (!open) setAudienceConfirm(null); }} open={audienceConfirm !== null} title={fill(collaboration.audienceConfirmTitle, formatDisplayNumber(audienceConfirm, locale))}><p className="text-sm font-semibold">{fill(collaboration.audienceConfirmTitle, formatDisplayNumber(audienceConfirm, locale))}</p></ActionDialog>
    </section>
  );
}

function ActionTaskFields({ assignee, dueAt, locale, onDueAtChange, onTitleChange, title }: { assignee: CollaborationTarget | null; dueAt: string; locale: Locale; onDueAtChange: (value: string) => void; onTitleChange: (value: string) => void; title: string }) {
  const t = complaintCommentText[locale];
  return <div className="grid gap-3 border-s-2 border-brand/30 ps-3"><p className="text-sm text-content-muted">{locale === 'ar' ? 'اختر المسؤول من نتائج البحث أعلاه. هو وحده المسؤول عن تنفيذ المهمة.' : 'Choose the assignee from the search results above. They alone are responsible for the task.'}</p><Label className="grid gap-1 text-sm font-medium">{t.actionTitle}<Input onChange={(event) => onTitleChange(event.target.value)} value={title} /></Label><div className="grid gap-1 text-sm"><span className="font-medium">{t.assignee}</span><span>{assignee ? displayTarget(assignee, locale) : missingDisplay(locale)}</span></div><Label className="grid gap-1 text-sm font-medium">{t.dueAt}<Input lang={locale === 'ar' ? 'ar' : 'en'} onChange={(event) => onDueAtChange(event.target.value)} type="datetime-local" value={dueAt} /></Label></div>;
}

function CommentGroup({ badge, comments, locale, title }: { badge: string; comments: StaffComplaintComment[]; locale: Locale; title: string }) {
  const t = complaintDetailText[locale];
  return <section className="rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={title}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title}</h3><StatusBadge>{badge}</StatusBadge></div>{comments.length ? <ol className="mt-3 grid gap-2">{comments.map((comment) => <li className="rounded-sm border border-line-subtle bg-surface p-3 text-sm" key={comment.id}><div className="flex flex-wrap items-center justify-between gap-2"><strong>{locale === 'ar' ? comment.authorNameAr || comment.authorName || t.values.author : comment.authorName || comment.authorNameAr || t.values.author}</strong><time className="text-content-muted">{formatDisplayDate(comment.createdAt, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</time></div><p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>{comment.mentions?.length ? <p className="mt-2 text-content-muted">@ {comment.mentions.map((item) => locale === 'ar' ? item.nameAr || item.name : item.name || item.nameAr).join('، ')}</p> : null}{comment.createdTaskId ? <a className="mt-2 inline-block font-medium text-brand underline-offset-4 hover:underline" href={`/tasks/${comment.createdTaskId}`}>{locale === 'ar' ? 'فتح المهمة المرتبطة' : 'Open linked task'}</a> : null}</li>)}</ol> : <StateBlock className="mt-3" message={t.commentStates.empty} />}</section>;
}

function displayTarget(target: CollaborationTarget, locale: Locale): string { return locale === 'ar' ? target.labelAr || target.label : target.label || target.labelAr; }
function fill(value: string, count: string): string { return value.replace('{count}', count); }
