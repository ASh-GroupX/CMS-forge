'use client';

import React, { useCallback, useState } from 'react';
import { collaborationErrorMessage, collaborationText } from '../../i18n/staff-collaboration';
import type { Locale } from '../../i18n/staff-shell';
import { taskConversationText } from '../../i18n/staff-task-conversation';
import { taskStatusLabel } from '../../i18n/domain-labels';
import { formatDisplayDate, formatDisplayNumber, missingDisplay } from '../../lib/locale-format';
import type { CollaborationTarget, CommunicationTargets } from '../../lib/staff-complaint-comments-api';
import { addTaskComment, getTaskCommunicationTargets, removeTaskWatcher, type StaffTaskComment } from '../../lib/staff-task-detail-api';
import type { StaffTask } from '../../lib/staff-tasks-api';
import { ActionDialog } from '../shared/action-dialog';
import { AudiencePicker } from '../shared/audience-picker';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'validation';

export function TaskConversation({ comments, locale, task }: { comments: StaffTaskComment[]; locale: Locale; task: StaffTask }) {
  const t = taskConversationText[locale];
  const collaboration = collaborationText[locale];
  const [items, setItems] = useState(comments);
  const [mentions, setMentions] = useState<CollaborationTarget[]>([]);
  const [cc, setCc] = useState<CollaborationTarget[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [canComment, setCanComment] = useState(true);
  const [audienceConfirm, setAudienceConfirm] = useState<number | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const loadTargets = useCallback((query: string) => getTaskCommunicationTargets(task.id, query), [task.id]);
  const loaded = useCallback((data: CommunicationTargets) => setCanComment(data.capabilities.canComment), []);
  const removeWatcher = useCallback(async (userId: string) => (await removeTaskWatcher(task.id, userId)).ok, [task.id]);
  const complaintId = task.links.find((link) => link.entityType === 'COMPLAINT')?.entityId;

  function submit(event: React.FormEvent) { event.preventDefault(); void send(); }

  async function send(confirmedRecipientCount?: number) {
    if (!body.trim()) { setStatus('validation'); setMessage(t.validation); return; }
    setStatus('loading'); setMessage(t.loading);
    const result = await addTaskComment(task.id, {
      body: body.trim(), mentionTargets: mentions.map(({ id, type }) => ({ id, type })), ccUserIds: cc.map(({ id }) => id),
      ...(confirmedRecipientCount !== undefined ? { confirmedRecipientCount } : {}),
    });
    if (!result.ok) {
      if (result.error.code === 'COLLABORATION_AUDIENCE_CONFIRMATION_REQUIRED' && result.error.actualRecipientCount !== undefined) {
        setAudienceConfirm(result.error.actualRecipientCount); setStatus('idle'); setMessage(''); return;
      }
      setStatus('error'); setMessage(collaborationErrorMessage(locale, result.error.code)); return;
    }
    setItems((current) => [...current, result.data.comment]);
    setBody(''); setMentions([]); setCc([]); setStatus('success'); setMessage(t.success); setPickerVersion((value) => value + 1);
  }

  return (
    <section className="grid gap-4" aria-label={t.title}>
      <header className="grid gap-3 rounded-md border border-line-subtle bg-surface-raised p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-medium text-content-muted">{t.task}</p><h1 className="text-lg font-semibold">{task.title}</h1></div><StatusBadge>{taskStatusLabel(locale, task.status)}</StatusBadge></div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3"><Fact label={t.responsible} value={task.assigneeName ?? missingDisplay(locale)} /><Fact label={t.due} value={formatDisplayDate(task.dueAt, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} /><Fact label={t.next} value={task.nextAction?.what ?? missingDisplay(locale)} /></dl>
        {complaintId ? <a className="w-fit text-sm font-medium text-brand underline-offset-4 hover:underline" href={`/complaints/${complaintId}?tab=communication`}>{locale === 'ar' ? 'فتح الشكوى المرتبطة' : 'Open linked complaint'}</a> : null}
      </header>
      <section className="grid gap-2 rounded-md border border-line-subtle bg-surface-raised p-4"><h2 className="text-sm font-semibold">{t.comments}</h2>{items.length ? <ol className="grid gap-2">{items.map((comment) => <TaskComment comment={comment} key={comment.id} locale={locale} />)}</ol> : <StateBlock message={t.empty} />}</section>
      <form className="grid gap-4 rounded-md border border-line-subtle bg-surface-raised p-4" onSubmit={submit}>
        <Label className="grid gap-1 text-sm font-medium">{t.body}<Textarea className="min-h-28" disabled={!canComment} onChange={(event) => setBody(event.target.value)} value={body} /></Label>
        <AudiencePicker cc={cc} disabled={!canComment || status === 'loading'} key={pickerVersion} loadTargets={loadTargets} locale={locale} mentions={mentions} onLoaded={loaded} onRemoveWatcher={removeWatcher} setCc={setCc} setMentions={setMentions} />
        <Button disabled={!canComment || status === 'loading'} type="submit">{t.save}</Button>
        {status !== 'idle' ? <StateBlock message={message} tone={status === 'success' ? 'success' : status === 'loading' ? 'neutral' : 'error'} /> : null}
      </form>
      <ActionDialog description={collaboration.audienceConfirmDescription} footer={<><Button onClick={() => setAudienceConfirm(null)} type="button" variant="outline">{collaboration.cancel}</Button><Button onClick={() => { const count = audienceConfirm; setAudienceConfirm(null); if (count !== null) void send(count); }} type="button">{collaboration.audienceConfirmAction}</Button></>} onOpenChange={(open) => { if (!open) setAudienceConfirm(null); }} open={audienceConfirm !== null} title={collaboration.audienceConfirmTitle.replace('{count}', formatDisplayNumber(audienceConfirm, locale))}><p className="text-sm font-semibold">{collaboration.audienceConfirmTitle.replace('{count}', formatDisplayNumber(audienceConfirm, locale))}</p></ActionDialog>
    </section>
  );
}

function TaskComment({ comment, locale }: { comment: StaffTaskComment; locale: Locale }) {
  const author = locale === 'ar' ? comment.authorNameAr || comment.authorName || 'موظف' : comment.authorName || comment.authorNameAr || 'Employee';
  return <li className="rounded-sm border border-line-subtle bg-surface p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{author}</strong><time className="text-content-muted">{formatDisplayDate(comment.createdAt, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</time></div><p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>{comment.mentions.length ? <p className="mt-2 text-content-muted">@ {comment.mentions.map((mention) => locale === 'ar' ? mention.nameAr || mention.name || mention.sourceLabel : mention.name || mention.nameAr || mention.sourceLabel).join(locale === 'ar' ? '، ' : ', ')}</p> : null}</li>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="grid gap-1"><dt className="text-content-muted">{label}</dt><dd className="break-words font-medium">{value}</dd></div>; }
