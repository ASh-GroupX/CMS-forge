import React from 'react';
import { portalTrackingText, resolvePortalTrackingLocale, type PortalTrackingLocale } from '../../../i18n/portal-tracking';

export type PortalTrackingPreviewState = 'loading' | 'requested' | 'verified' | 'validation' | 'invalid' | 'expired' | 'error' | 'followup';

type SearchParams = {
  locale?: string | string[];
  reference?: string | string[];
  state?: string | string[];
};

export default async function PortalTrackingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalTrackingLocale(params?.locale);
  const state = previewState(readParam(params?.state));
  const reference = readParam(params?.reference) || portalTrackingText[locale].sample.reference;
  return <PortalTrackingScreen locale={locale} reference={reference} state={state} />;
}

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
        <header className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <a
              className="rounded-sm border border-slate-300 px-2 py-1 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
              href={`/portal/track?locale=${switchLocale}`}
              aria-label={t.switchLabel}
            >
              {t.switchTarget}
            </a>
          </div>
        </header>

        <PortalTrackingMessage locale={locale} state={state} />

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-4">
            <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm" method="post" aria-label={t.sections.request}>
              <h2 className="text-sm font-semibold">{t.sections.request}</h2>
              <TextField label={t.fields.reference} name="referenceNumber" value={preserve ? reference : ''} />
              <TextField label={t.fields.phone} name="customerPhone" type="tel" value={preserve ? t.sample.phone : ''} />
              {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.states.validation}</span> : null}
              <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="submit">
                {t.actions.request}
              </button>
            </form>

            <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm" method="post" aria-label={t.sections.verify}>
              <h2 className="text-sm font-semibold">{t.sections.verify}</h2>
              <TextField label={t.fields.code} name="verificationCode" type="text" value="" />
              <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60" disabled={state === 'loading'} type="submit">
                {t.actions.verify}
              </button>
            </form>
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
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm" aria-label={t.sections.status}>
      <h2 className="text-sm font-semibold">{t.sections.status}</h2>
      <dl className="grid gap-2 text-sm md:grid-cols-2">
        {[
          [t.fields.reference, reference],
          [t.sections.status, t.sample.status],
          [t.fields.created, t.sample.created],
          [t.fields.updated, t.sample.updated],
        ].map(([label, value]) => (
          <div className="rounded-sm bg-slate-50 px-3 py-2" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-semibold text-slate-800">{value}</dd>
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
    </section>
  );
}

function FollowUpPanel({ locale, submitted }: { locale: PortalTrackingLocale; submitted: boolean }) {
  const t = portalTrackingText[locale];
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm" method="post" aria-label={t.sections.followUp}>
      <h2 className="text-sm font-semibold">{t.sections.followUp}</h2>
      {submitted ? <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">{t.states.followup}</p> : null}
      <label className="grid gap-1 text-sm font-medium">
        {t.fields.followUp}
        <textarea className="min-h-24 rounded-sm border border-slate-300 px-2 py-2" defaultValue={submitted ? t.sample.followUp : ''} name="body" />
      </label>
      <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="submit">
        {t.actions.followUp}
      </button>
    </form>
  );
}

function PrivacyPanel({ locale }: { locale: PortalTrackingLocale }) {
  const t = portalTrackingText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm" aria-label={t.sections.status}>
      {t.privacy}
    </section>
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
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={value} name={name} type={type} />
    </label>
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalTrackingPreviewState | undefined {
  return value === 'loading' || value === 'requested' || value === 'verified' || value === 'validation' || value === 'invalid' || value === 'expired' || value === 'error' || value === 'followup' ? value : undefined;
}
