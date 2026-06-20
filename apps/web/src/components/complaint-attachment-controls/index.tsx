import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import type { Locale } from '../../i18n/staff-shell';

export type ComplaintAttachmentPreviewState = 'loading' | 'empty' | 'error' | 'pending' | 'clean' | 'rejected';

export function ComplaintAttachmentControls({
  attachmentState,
  locale,
}: {
  attachmentState?: ComplaintAttachmentPreviewState | undefined;
  locale: Locale;
}) {
  const t = complaintDetailText[locale];
  const scanState = attachmentState === 'clean' || attachmentState === 'rejected' ? attachmentState : 'pending';

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.attachments}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t.sections.attachments}</h3>
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">{t.badges[scanState]}</Badge>
      </div>
      {attachmentState === 'loading' || attachmentState === 'empty' || attachmentState === 'error' ? (
        <p className="mt-3 text-sm text-slate-600" role={attachmentState === 'error' ? 'alert' : 'status'}>
          {t.attachmentStates[attachmentState]}
        </p>
      ) : (
        <dl className="mt-3 grid gap-2 text-sm">
          {[
            [t.labels.file, t.values.file],
            [t.labels.scan, t.badges[scanState]],
          ].map(([label, value]) => (
            <div className="grid grid-cols-[8rem_1fr] gap-2 rounded-sm bg-white px-3 py-2" key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline">
          {t.attachmentActions.upload}
        </Button>
        <Button type="button" variant="outline">
          {t.attachmentActions.download}
        </Button>
      </div>
      <ul className="mt-3 grid gap-1 text-sm text-slate-600">
        {t.attachmentActions.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}
