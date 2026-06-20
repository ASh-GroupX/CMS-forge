import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { portalTrackingText, type PortalTrackingLocale } from '../../i18n/portal-tracking';

export type PortalTrackingPreviewState = 'loading' | 'requested' | 'verified' | 'validation' | 'invalid' | 'expired' | 'error' | 'followup';

export function PortalTrackingScreen({
  locale,
  reference,
  state,
}: {
  locale: PortalTrackingLocale;
  reference: string;
  state?: PortalTrackingPreviewState | undefined;
}) {
  const t = portalTrackingText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const hasVerification = state === 'verified' || state === 'followup';
  const preserve = Boolean(state && !hasVerification);

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6">
      <div className="mx-auto grid max-w-5xl gap-4">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4">
            <div>
              <CardTitle className="text-2xl tracking-normal">{t.title}</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="focus:ring-2 focus:ring-ring">
              <a href={`/portal/track?locale=${switchLocale}`} aria-label={t.switchLabel}>{t.switchTarget}</a>
            </Button>
          </CardHeader>
        </Card>

        <PortalTrackingMessage locale={locale} state={state} />

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-4">
            <Card className="rounded-md border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{t.sections.request}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <form className="grid gap-3" method="post" aria-label={t.sections.request}>
                  <TextField label={t.fields.reference} name="referenceNumber" value={preserve ? reference : ''} />
                  <TextField label={t.fields.phone} name="customerPhone" type="tel" value={preserve ? t.sample.phone : ''} />
                  {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.states.validation}</span> : null}
                  <Button className="focus:ring-2 focus:ring-ring" type="submit">{t.actions.request}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-md border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{t.sections.verify}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <form className="grid gap-3" method="post" aria-label={t.sections.verify}>
                  <TextField label={t.fields.code} name="verificationCode" type="text" value="" />
                  <Button className="focus:ring-2 focus:ring-ring" disabled={state === 'loading'} type="submit">{t.actions.verify}</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            {hasVerification ? <VerifiedTracking locale={locale} reference={reference} /> : <PrivacyPanel locale={locale} />}
            {hasVerification ? <FollowUpPanel locale={locale} submitted={state === 'followup'} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function VerifiedTracking({ locale, reference }: { locale: PortalTrackingLocale; reference: string }) {
  const t = portalTrackingText[locale];
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm" aria-label={t.sections.status}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{t.sections.status}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          {[
            [t.fields.reference, reference],
            [t.sections.status, t.sample.status],
            [t.fields.created, t.sample.created],
            [t.fields.updated, t.sample.updated],
          ].map(([label, value]) => (
            <div className="rounded-sm bg-slate-50 px-3 py-2" key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-800">{label === t.sections.status ? <Badge variant="secondary">{value}</Badge> : value}</dd>
            </div>
          ))}
        </dl>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.timeline}>
          <h3 className="text-sm font-semibold">{t.sections.timeline}</h3>
          <ol className="mt-3 grid gap-2 text-sm text-slate-700">
            {t.sample.timeline.map((item) => (
              <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={item}>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </CardContent>
    </Card>
  );
}

function FollowUpPanel({ locale, submitted }: { locale: PortalTrackingLocale; submitted: boolean }) {
  const t = portalTrackingText[locale];
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{t.sections.followUp}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form className="grid gap-3" method="post" aria-label={t.sections.followUp}>
          {submitted ? <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">{t.states.followup}</p> : null}
          <Label className="grid gap-1 text-sm font-medium">
            {t.fields.followUp}
            <Textarea className="min-h-24" defaultValue={submitted ? t.sample.followUp : ''} name="body" />
          </Label>
          <Button className="focus:ring-2 focus:ring-ring" type="submit">{t.actions.followUp}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PrivacyPanel({ locale }: { locale: PortalTrackingLocale }) {
  const t = portalTrackingText[locale];
  return (
    <Card className="rounded-md border-slate-200 bg-white text-sm text-slate-700 shadow-sm" aria-label={t.sections.status}>
      <CardContent className="p-4">{t.privacy}</CardContent>
    </Card>
  );
}

function PortalTrackingMessage({ locale, state }: { locale: PortalTrackingLocale; state?: PortalTrackingPreviewState | undefined }) {
  const t = portalTrackingText[locale];
  if (!state) return null;
  const isSafe = state === 'requested' || state === 'verified' || state === 'followup';
  const message = state === 'followup' ? t.states.followup : t.states[state];
  return (
    <p className={`rounded-md border px-4 py-3 text-sm font-medium ${isSafe ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role={isSafe || state === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function TextField({ label, name, type = 'text', value }: { label: string; name: string; type?: string; value: string }) {
  return (
    <Label className="grid gap-1 text-sm font-medium">
      {label}
      <Input defaultValue={value} name={name} type={type} />
    </Label>
  );
}
