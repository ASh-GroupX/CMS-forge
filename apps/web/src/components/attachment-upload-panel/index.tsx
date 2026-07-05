import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttachmentDropzone, StateBlock, StatusBadge } from '../shared/ui-primitives';
import { attachmentText } from '../../i18n/staff-attachments';
import { confirmationText } from '../../i18n/staff-confirmations';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type AttachmentPreviewState = 'loading' | 'empty' | 'error' | 'pending' | 'clean' | 'rejected';

export function AttachmentUploadPanel({
  locale,
  state,
}: {
  locale: Locale;
  state?: AttachmentPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = attachmentText[locale];
  const confirm = confirmationText[locale].attachmentReject;
  const scanState = state === 'pending' || state === 'clean' || state === 'rejected' ? state : 'pending';

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        <AttachmentDropzone id="attachment-file" label={t.chooseFile} rules={t.fileRules} />
        <section aria-label={t.selectedFile} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">{t.selectedFile}</h3>
          {state === 'loading' || state === 'empty' || state === 'error' ? (
            <StateBlock className="mt-2" message={t.states[state]} tone={state === 'error' ? 'error' : 'neutral'} />
          ) : (
            <div className="mt-2"><StatusBadge tone={scanState === 'rejected' ? 'danger' : scanState === 'clean' ? 'success' : 'warning'}>{t.scan[scanState]}</StatusBadge></div>
          )}
        </section>
        {state === 'rejected' ? (
          <section
            aria-label={confirm.title}
            className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error md:col-span-2"
            role="alert"
          >
            <p className="font-semibold">{confirm.title}</p>
            <p className="mt-1">{confirm.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline">
                {confirm.confirm}
              </Button>
              <Button type="button" variant="outline">
                {confirm.cancel}
              </Button>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
