'use client';

import React, { useId, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { StateBlock } from '../shared/ui-primitives';
import { portalTrackingText, type PortalTrackingLocale } from '../../i18n/portal-tracking';

type PortalFollowUpPanelProps = {
  attachmentSubmitted: boolean;
  busy: boolean;
  closed: boolean;
  locale: PortalTrackingLocale;
  onAttachmentSubmit: (file: File | null) => void;
  onTextChange: (value: string) => void;
  onTextSubmit: (event: React.FormEvent) => void;
  textSubmitted: boolean;
  textValue: string;
};

export function PortalFollowUpPanel({
  attachmentSubmitted,
  busy,
  closed,
  locale,
  onAttachmentSubmit,
  onTextChange,
  onTextSubmit,
  textSubmitted,
  textValue,
}: PortalFollowUpPanelProps) {
  const t = portalTrackingText[locale];
  const helpId = useId();
  const [file, setFile] = useState<File | null>(null);

  return (
    <Card className="rounded-md border-line-subtle bg-surface shadow-sm">
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{t.sections.followUp}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 p-4 pt-0">
        {closed ? <StateBlock message={t.states.closed} tone="error" /> : null}
        {textSubmitted ? <StateBlock message={t.states.followup} tone="success" /> : null}
        {attachmentSubmitted ? <StateBlock message={t.states.attachment} tone="success" /> : null}

        <form className="grid gap-3" onSubmit={onTextSubmit} aria-label={t.sections.followUp}>
          <Label className="grid gap-1 text-sm font-medium">
            {t.fields.followUp}
            <Textarea className="min-h-28" disabled={closed} name="body" value={textValue} onChange={(event) => onTextChange(event.target.value)} />
          </Label>
          <Button className="min-h-11 focus:ring-2 focus:ring-ring" disabled={busy || closed} type="submit">{t.actions.followUp}</Button>
        </form>

        <form className="grid gap-3 border-t border-line-subtle pt-4" onSubmit={(event) => { event.preventDefault(); onAttachmentSubmit(file); }} aria-label={t.sections.attachments}>
          <Label className="grid gap-1 text-sm font-medium">
            {t.fields.attachment}
            <Input
              accept=".jpg,.jpeg,.png,.webp,.pdf,.mp3,.wav,.ogg,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/quicktime,video/webm"
              aria-describedby={helpId}
              className="min-h-11"
              disabled={closed}
              name="attachment"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Label>
          <ul className="grid gap-1 text-xs text-content-muted" id={helpId}>
            {t.attachmentRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
          {file ? <StateBlock message={`${t.states.selectedAttachment}: ${file.name}`} /> : null}
          <Button className="min-h-11 focus:ring-2 focus:ring-ring" disabled={busy || closed} type="submit">{t.actions.attachment}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
