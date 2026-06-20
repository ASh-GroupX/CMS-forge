import React from 'react';
import { portalSurveyText, resolvePortalSurveyLocale, type PortalSurveyLocale } from '../../../i18n/portal-survey';

export type PortalSurveyPreviewState = 'success' | 'used' | 'expired' | 'validation' | 'loading' | 'error';

type SearchParams = {
  locale?: string | string[];
  state?: string | string[];
};

export default async function PortalSurveyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalSurveyLocale(params?.locale);
  return <PortalSurveyScreen locale={locale} state={previewState(readParam(params?.state))} />;
}

export function PortalSurveyScreen({
  locale,
  state,
}: {
  locale: PortalSurveyLocale;
  state?: PortalSurveyPreviewState | undefined;
}) {
  const t = portalSurveyText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const closed = state === 'used' || state === 'expired';
  const preserve = Boolean(state && state !== 'success' && !closed);

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6">
      <div className="mx-auto grid max-w-3xl gap-4">
        <header className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <a
              className="rounded-sm border border-slate-300 px-2 py-1 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
              href={`/portal/survey?locale=${switchLocale}`}
              aria-label={t.switchLabel}
            >
              {t.switchTarget}
            </a>
          </div>
        </header>

        <PortalSurveyMessage locale={locale} state={state} />

        {closed ? null : (
          <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm" method="post">
            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold">{t.fields.rating}</legend>
              <div className="grid grid-cols-5 gap-2">
                {t.ratingLabels.map((label, index) => {
                  const value = String(index + 1);
                  return (
                    <label className="grid min-h-20 content-center gap-2 rounded-sm border border-slate-300 bg-slate-50 px-2 py-3 text-center text-sm font-semibold" key={label}>
                      <input className="mx-auto size-4" defaultChecked={preserve && value === '4'} disabled={state === 'loading'} name="rating" type="radio" value={value} aria-label={label} />
                      <span>{value}</span>
                    </label>
                  );
                })}
              </div>
              {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.states.validation}</span> : null}
            </fieldset>

            <label className="grid gap-1 text-sm font-medium">
              {t.fields.comment}
              <textarea className="min-h-28 rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserve ? t.sample.comment : ''} disabled={state === 'loading'} name="comment" />
            </label>

            <p className="rounded-sm bg-slate-100 px-3 py-2 text-sm text-slate-700">{t.privacy}</p>
            <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60" disabled={state === 'loading'} type="submit">
              {state === 'loading' ? t.actions.submitting : t.actions.submit}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function PortalSurveyMessage({ locale, state }: { locale: PortalSurveyLocale; state?: PortalSurveyPreviewState | undefined }) {
  const t = portalSurveyText[locale];
  if (!state) return null;
  const safe = state === 'success';
  return (
    <p className={`rounded-md border px-4 py-3 text-sm font-medium ${safe ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role={safe || state === 'loading' ? 'status' : 'alert'}>
      {t.states[state]}
    </p>
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalSurveyPreviewState | undefined {
  return value === 'success' || value === 'used' || value === 'expired' || value === 'validation' || value === 'loading' || value === 'error' ? value : undefined;
}
