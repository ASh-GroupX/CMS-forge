'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import type { Locale } from '../../i18n/staff-shell';
import {
  listStaffComplaintAttachments,
  prepareStaffAttachmentDownload,
  uploadStaffComplaintAttachment,
  type StaffAttachment,
} from '../../lib/staff-attachments-api';

export type ComplaintAttachmentPreviewState = 'loading' | 'empty' | 'error' | 'pending' | 'clean' | 'rejected';
type LocalState = ComplaintAttachmentPreviewState | 'uploading' | 'uploaded' | 'downloaded' | undefined;

export function ComplaintAttachmentControls({
  attachmentState,
  complaintId,
  locale,
}: {
  attachmentState?: ComplaintAttachmentPreviewState | undefined;
  complaintId?: string | undefined;
  locale: Locale;
}) {
  const t = complaintDetailText[locale];
  const [items, setItems] = useState<StaffAttachment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<LocalState>(attachmentState);

  useEffect(() => {
    if (!complaintId) return;
    let active = true;
    setState('loading');
    setMessage(null);
    void listStaffComplaintAttachments(complaintId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setItems(result.data.items);
        setState(result.data.items.length ? undefined : 'empty');
      } else {
        setState('error');
      }
    });
    return () => { active = false; };
  }, [complaintId]);

  const preview = items.length ? items : previewItems(attachmentState, t.values.file);
  const scanState = scanBadge(preview[0]?.scanStatus ?? attachmentState);
  const visibleState = state === 'uploading' ? 'loading' : state === 'uploaded' || state === 'downloaded' ? undefined : state;

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!complaintId) return setState('error');
    setState('uploading');
    setMessage(null);
    const result = await uploadStaffComplaintAttachment(complaintId, file);
    if (!result.ok) {
      setMessage(uploadMessage(result.error.code, t.attachmentUploadMessages));
      return setState(result.error.kind === 'validation' ? undefined : 'error');
    }
    setItems((current) => [result.data.attachment, ...current.filter((item) => item.id !== result.data.attachment.id)]);
    setFile(null);
    setMessage(t.attachmentUploadMessages.uploaded);
    return setState('uploaded');
  }

  async function download(item: StaffAttachment) {
    if (!complaintId || item.scanStatus !== 'CLEAN') return setState('error');
    setState('loading');
    setMessage(null);
    const result = await prepareStaffAttachmentDownload(complaintId, item.id);
    if (!result.ok) return setState('error');
    setMessage(t.attachmentUploadMessages.downloaded);
    setState('downloaded');
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.attachments}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t.sections.attachments}</h3>
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">{t.badges[scanState]}</Badge>
      </div>
      {visibleState === 'loading' || visibleState === 'empty' || visibleState === 'error' ? (
        <p className="mt-3 text-sm text-slate-600" role={visibleState === 'error' ? 'alert' : 'status'}>
          {t.attachmentStates[visibleState]}
        </p>
      ) : (
        <dl className="mt-3 grid gap-2 text-sm">
          {(preview.length ? preview : previewItems('empty', t.values.file)).map((item) => (
            <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={item.id || item.fileName}>
              <dt className="text-slate-500">{t.labels.file}</dt>
              <dd className="break-words font-medium text-slate-800">{item.fileName}</dd>
              <dt className="text-slate-500">{t.labels.scan}</dt>
              <dd className="font-medium text-slate-800">{t.badges[scanBadge(item.scanStatus)]}</dd>
              <dt className="text-slate-500">{t.attachmentActions.download}</dt>
              <dd><Button disabled={item.scanStatus !== 'CLEAN' || !complaintId || !item.id} size="sm" type="button" variant="outline" onClick={() => { void download(item); }}>{t.attachmentActions.download}</Button></dd>
            </div>
          ))}
        </dl>
      )}
      <form className="mt-3 grid gap-2" onSubmit={upload}>
        <Label className="grid gap-1 text-sm font-medium">
          {t.attachmentActions.upload}
          <Input accept=".jpg,.jpeg,.png,.webp,.pdf,.mp3,.wav,.ogg,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/quicktime,video/webm" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </Label>
        <Button disabled={!complaintId || state === 'uploading'} type="submit" variant="outline">{t.attachmentActions.upload}</Button>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-700" role="status">{message}</p> : null}
      <ul className="mt-3 grid gap-1 text-sm text-slate-600">
        {t.attachmentActions.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}

function scanBadge(value: string | undefined): 'pending' | 'clean' | 'rejected' {
  if (value === 'CLEAN' || value === 'clean') return 'clean';
  if (value === 'REJECTED' || value === 'rejected') return 'rejected';
  return 'pending';
}

function previewItems(state: ComplaintAttachmentPreviewState | undefined, fileName: string): StaffAttachment[] {
  if (state !== 'pending' && state !== 'clean' && state !== 'rejected') return [];
  const scanStatus = state === 'clean' ? 'CLEAN' : state === 'rejected' ? 'REJECTED' : 'PENDING';
  return [{ id: '', complaintId: '', fileName, contentType: 'application/pdf', sizeBytes: 0, scanStatus, customerVisible: false }];
}

function uploadMessage(code: string, messages: { required: string; size: string; type: string }): string {
  if (code === 'ATTACHMENT_REQUIRED') return messages.required;
  if (code === 'ATTACHMENT_SIZE_EXCEEDED') return messages.size;
  return messages.type;
}
