import React from 'react';
import { attachmentText } from '../i18n/staff-attachments';
import type { Locale } from '../i18n/staff-shell';

export type AttachmentPreviewState = 'loading' | 'empty' | 'error' | 'pending' | 'clean' | 'rejected';

export function AttachmentUploadPanel({
  locale,
  state,
}: {
  locale: Locale;
  state?: AttachmentPreviewState | undefined;
}) {
  const t = attachmentText[locale];
  const scanState = state === 'pending' || state === 'clean' || state === 'rejected' ? state : 'pending';

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          {t.chooseFile}
          <input className="rounded-sm border border-slate-300 px-2 py-2" type="file" />
        </label>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">{t.selectedFile}</p>
          {state === 'loading' || state === 'empty' || state === 'error' ? (
            <p className="mt-2 text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
              {t.states[state]}
            </p>
          ) : (
            <p className="mt-2 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {t.scan[scanState]}
            </p>
          )}
        </div>
        <ul className="grid gap-1 text-sm text-slate-600 md:col-span-2">
          {t.fileRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
