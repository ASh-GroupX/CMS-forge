'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { portalTimelineText, portalTrackingText, type PortalTrackingLocale } from '../../i18n/portal-tracking';
import {
  getPortalTracking,
  requestPortalOtp,
  submitPortalFollowUp,
  uploadPortalAttachment,
  verifyPortalOtp,
  type PortalTrackingComplaint,
} from '../../lib/portal-tracking-api';
import { PortalFollowUpPanel } from './follow-up-panel';

export type PortalTrackingPreviewState = 'loading' | 'requested' | 'verified' | 'validation' | 'requestValidation' | 'codeValidation' | 'requestError' | 'trackingError' | 'invalid' | 'expired' | 'error' | 'followup' | 'attachment' | 'closed';
type Feedback = PortalTrackingPreviewState | 'denied' | undefined;

export function PortalTrackingScreen({ locale }: { locale: PortalTrackingLocale }) {
  return <PortalTrackingView initialFeedback={undefined} initialFollowUp="" initialPhone="" initialReference="" initialTracking={null} locale={locale} />;
}

export function PortalTrackingPreview({ locale, reference, state }: { locale: PortalTrackingLocale; reference: string; state?: PortalTrackingPreviewState | undefined }) {
  const t = portalTrackingText[locale];
  const timelineLabels = portalTimelineText[locale];
  return (
    <PortalTrackingView
      initialFeedback={state}
      initialFollowUp={state === 'followup' || state === 'attachment' ? t.sample.followUp : ''}
      initialPhone={state && state !== 'verified' && state !== 'followup' && state !== 'attachment' && state !== 'closed' ? t.sample.phone : ''}
      initialReference={state ? reference : ''}
      initialTracking={sampleTracking(locale, reference, state)}
      locale={locale}
    />
  );
}

function PortalTrackingView({ initialFeedback, initialFollowUp, initialPhone, initialReference, initialTracking, locale }: { initialFeedback: Feedback; initialFollowUp: string; initialPhone: string; initialReference: string; initialTracking: PortalTrackingComplaint | null; locale: PortalTrackingLocale }) {
  const t = portalTrackingText[locale];
  const [referenceNumber, setReferenceNumber] = useState(initialReference);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [portalSession, setPortalSession] = useState<string | null>(null);
  const [tracking, setTracking] = useState<PortalTrackingComplaint | null>(initialTracking);
  const [followUp, setFollowUp] = useState(initialFollowUp);
  const [feedback, setFeedback] = useState<Feedback>(initialFeedback);
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    if (!referenceNumber.trim() || !customerPhone.trim()) return setFeedback('requestValidation');
    setBusy(true);
    const result = await requestPortalOtp({ referenceNumber, customerPhone, locale });
    setBusy(false);
    if (!result.ok) return setFeedback('requestError');
    setVerificationId(result.data.verificationId);
    setPortalSession(null);
    setTracking(null);
    setFeedback('requested');
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!verificationId || !otp.trim()) return setFeedback('codeValidation');
    setBusy(true);
    const verified = await verifyPortalOtp({ verificationId, otp });
    if (!verified.ok) {
      setBusy(false);
      return setFeedback(feedbackFromCode(verified.error.code));
    }
    setPortalSession(verified.data.session.sessionToken);
    const nextTracking = await getPortalTracking(verified.data.session.sessionToken);
    setBusy(false);
    if (!nextTracking.ok) return setFeedback('trackingError');
    setTracking(nextTracking.data.complaint);
    setFeedback('verified');
  }

  async function sendFollowUp(event: React.FormEvent) {
    event.preventDefault();
    if (!portalSession || !followUp.trim()) return setFeedback('validation');
    if (tracking && isTerminal(tracking.status)) return setFeedback('closed');
    setBusy(true);
    const result = await submitPortalFollowUp(portalSession, followUp);
    setBusy(false);
    if (!result.ok) return setFeedback(tracking && isTerminal(tracking.status) ? 'denied' : feedbackFromCode(result.error.code));
    setFeedback('followup');
  }

  async function sendAttachment(file: File | null) {
    if (!portalSession || !file) return setFeedback('validation');
    if (tracking && isTerminal(tracking.status)) return setFeedback('closed');
    setBusy(true);
    const result = await uploadPortalAttachment(portalSession, file);
    setBusy(false);
    if (!result.ok) return setFeedback(tracking && isTerminal(tracking.status) ? 'denied' : feedbackFromCode(result.error.code));
    setFeedback('attachment');
  }

  return (
    <section lang={t.lang} dir={t.dir} className="grid gap-4" aria-label={t.title}>
      <PortalTrackingMessage locale={locale} state={busy ? 'loading' : feedback} />

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-4">
            <Card className="rounded-md border-line-subtle bg-surface shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{t.sections.request}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <form className="grid gap-3" onSubmit={requestCode} aria-label={t.sections.request}>
                  <TextField label={t.fields.reference} name="referenceNumber" value={referenceNumber} onChange={setReferenceNumber} autoComplete="off" />
                  <TextField label={t.fields.phone} name="customerPhone" type="tel" value={customerPhone} onChange={setCustomerPhone} autoComplete="tel" />
                  <Button className="min-h-11 focus:ring-2 focus:ring-ring" disabled={busy} type="submit">{t.actions.request}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-md border-line-subtle bg-surface shadow-sm">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{t.sections.verify}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <form className="grid gap-3" onSubmit={verifyCode} aria-label={t.sections.verify}>
                  <TextField label={t.fields.code} name="verificationCode" type="text" value={otp} onChange={setOtp} autoComplete="one-time-code" />
                  <Button className="min-h-11 focus:ring-2 focus:ring-ring" disabled={busy || !verificationId} type="submit">{t.actions.verify}</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            {tracking ? <VerifiedTracking locale={locale} tracking={tracking} /> : <PrivacyPanel locale={locale} />}
            {tracking ? (
              <PortalFollowUpPanel
                attachmentSubmitted={feedback === 'attachment'}
                busy={busy}
                closed={isTerminal(tracking.status)}
                locale={locale}
                onAttachmentSubmit={sendAttachment}
                onTextChange={setFollowUp}
                onTextSubmit={sendFollowUp}
                textSubmitted={feedback === 'followup'}
                textValue={followUp}
              />
            ) : null}
          </div>
      </section>
    </section>
  );
}

function VerifiedTracking({ locale, tracking }: { locale: PortalTrackingLocale; tracking: PortalTrackingComplaint }) {
  const t = portalTrackingText[locale];
  const timelineLabels = portalTimelineText[locale];
  return (
    <Card className="rounded-md border-line-subtle bg-surface shadow-sm" aria-label={t.sections.status}>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{t.sections.status}</CardTitle></CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          {[[t.fields.reference, tracking.referenceNumber], [t.sections.status, tracking.status], [t.fields.created, tracking.createdAt], [t.fields.updated, tracking.updatedAt]].map(([label, value]) => (
            <div className="rounded-sm bg-surface-raised px-3 py-2" key={label}>
              <dt className="text-content-muted">{label}</dt>
              <dd className="break-words font-semibold text-content-strong">{label === t.sections.status ? <StatusBadge tone="info">{value}</StatusBadge> : value}</dd>
            </div>
          ))}
        </dl>
        <section className="rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={t.sections.timeline}>
          <h3 className="text-sm font-semibold">{t.sections.timeline}</h3>
          <ol className="mt-3 grid gap-2 text-sm text-content-muted">
            {tracking.timeline.length ? tracking.timeline.map((item) => (
              <li className="rounded-sm border border-line-subtle bg-surface px-3 py-2" key={`${item.type ?? item.toStatus}-${item.createdAt}-${item.body ?? ''}`}>
                {timelineText(item, timelineLabels)}
              </li>
            )) : <li className="rounded-sm border border-line-subtle bg-surface px-3 py-2">{t.states.empty}</li>}
          </ol>
        </section>
      </CardContent>
    </Card>
  );
}

function PrivacyPanel({ locale }: { locale: PortalTrackingLocale }) {
  const t = portalTrackingText[locale];
  return <Card className="rounded-md border-line-subtle bg-surface text-sm text-content-muted shadow-sm" aria-label={t.sections.status}><CardContent className="p-4"><StateBlock message={t.privacy} /></CardContent></Card>;
}

function PortalTrackingMessage({ locale, state }: { locale: PortalTrackingLocale; state: Feedback }) {
  const t = portalTrackingText[locale];
  if (!state) return null;
  const isSafe = state === 'requested' || state === 'verified' || state === 'followup' || state === 'attachment';
  const message = state === 'denied' ? t.states.denied : state === 'followup' ? t.states.followup : state === 'attachment' ? t.states.attachment : t.states[state];
  return <StateBlock message={message} tone={isSafe ? 'success' : state === 'loading' ? 'neutral' : 'error'} />;
}

function TextField({ label, name, type = 'text', value, onChange, autoComplete }: { label: string; name: string; type?: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <Label className="grid gap-1 text-sm font-medium">{label}<Input autoComplete={autoComplete} className="min-h-11" name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></Label>;
}

function sampleTracking(locale: PortalTrackingLocale, reference: string, state?: PortalTrackingPreviewState): PortalTrackingComplaint | null {
  if (state !== 'verified' && state !== 'followup' && state !== 'attachment' && state !== 'closed') return null;
  const t = portalTrackingText[locale];
  const timelineLabels = portalTimelineText[locale];
  return {
    referenceNumber: reference,
    status: state === 'closed' ? 'CLOSED' : t.sample.status,
    createdAt: t.sample.created,
    updatedAt: t.sample.updated,
    timeline: [
      ...t.sample.timeline.map((item) => ({ fromStatus: null, toStatus: item, action: null, createdAt: '', type: 'STATUS' as const })),
      { fromStatus: null, toStatus: 'PUBLIC_UPDATE', action: 'PUBLIC_UPDATE', createdAt: t.sample.updated, type: 'PUBLIC_UPDATE' as const, body: timelineLabels.samplePublicUpdate },
    ],
  };
}

function timelineText(item: PortalTrackingComplaint['timeline'][number], labels: typeof portalTimelineText.en): string {
  if (item.type === 'PUBLIC_UPDATE' || item.body) return [labels.publicUpdate, item.body, item.createdAt].filter(Boolean).join(' - ');
  return [item.action, item.toStatus, item.createdAt].filter(Boolean).join(' - ');
}

function feedbackFromCode(code: string): Feedback {
  if (code === 'PORTAL_VERIFICATION_FAILED') return 'invalid';
  if (code === 'PORTAL_VERIFICATION_EXPIRED') return 'expired';
  return 'error';
}

function isTerminal(status: string): boolean {
  return status === 'CLOSED' || status === 'REJECTED';
}
