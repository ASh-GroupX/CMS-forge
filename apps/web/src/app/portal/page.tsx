import React from 'react';
import { portalSubmissionText, resolvePortalLocale, type PortalLocale } from '../../i18n/portal-submission';

export type PortalSubmissionPreviewState = 'loading' | 'validation' | 'success' | 'error';

type SearchParams = {
  locale?: string | string[];
  reference?: string | string[];
  state?: string | string[];
};

export default async function PortalSubmissionPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolvePortalLocale(params?.locale);
  const state = previewState(readParam(params?.state));
  const reference = readParam(params?.reference) || 'CMP-2026-018';
  return <PortalSubmissionScreen locale={locale} reference={reference} state={state} />;
}

export function PortalSubmissionScreen({
  locale,
  reference,
  state,
}: {
  locale: PortalLocale;
  reference: string;
  state?: PortalSubmissionPreviewState | undefined;
}) {
  const t = portalSubmissionText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const preserve = Boolean(state && state !== 'success');

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
              href={`/portal?locale=${switchLocale}`}
              aria-label={t.switchLabel}
            >
              {t.switchTarget}
            </a>
          </div>
        </header>

        <PortalSubmissionMessage locale={locale} reference={reference} state={state} />

        <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2" method="post">
          <FieldGroup title={t.sections.contact}>
            <TextField error={state === 'validation' ? t.validation.required : undefined} label={t.fields.customerName} name="customerName" value={preserve ? t.values.name : ''} />
            <TextField error={state === 'validation' ? t.validation.required : undefined} label={t.fields.customerPhone} name="customerPhone" type="tel" value={preserve ? t.values.phone : ''} />
          </FieldGroup>

          <FieldGroup title={t.sections.complaint}>
            <SelectField choose={t.choices.choose} label={t.fields.branch} name="branchId" option={t.choices.branch} preserve={preserve} value="branch_main" />
            <SelectField choose={t.choices.choose} label={t.fields.category} name="categoryId" option={t.choices.category} preserve={preserve} value="cat_service" />
            <SelectField choose={t.choices.choose} label={t.fields.subcategory} name="subcategoryId" option={t.choices.subcategory} preserve={preserve} value="cat_delay" />
            <SelectField choose={t.choices.choose} label={t.fields.severity} name="severity" option={t.choices.severity} preserve={preserve} value="HIGH" />
            <label className="grid gap-1 text-sm font-medium">
              {t.fields.incidentAt}
              <input className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserve ? '2026-06-19' : ''} name="incidentAt" type="date" />
            </label>
            <TextField label={t.fields.subject} name="subject" value={preserve ? t.values.subject : ''} />
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              {t.fields.description}
              <textarea className="min-h-28 rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserve ? t.values.description : ''} name="description" />
              {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.validation.required}</span> : null}
            </label>
          </FieldGroup>

          <FieldGroup title={t.sections.vehicle}>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input className="size-4" defaultChecked={preserve} name="vehicleRelated" type="checkbox" />
              {t.fields.vehicleRelated}
            </label>
            <TextField label={t.fields.vehicleVin} name="vehicleVin" value={preserve ? t.values.vin : ''} />
          </FieldGroup>

          <FieldGroup title={t.sections.attachments}>
            <label className="grid gap-1 text-sm font-medium">
              {t.fields.attachment}
              <input className="rounded-sm border border-slate-300 px-2 py-2" multiple name="attachment" type="file" />
              {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.validation.attachment}</span> : null}
            </label>
            <ul className="grid gap-1 text-sm text-slate-600">
              {t.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </FieldGroup>

          <p className="rounded-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 md:col-span-2">{t.privacy}</p>
          <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60 md:col-span-2" disabled={state === 'loading'} type="submit">
            {state === 'loading' ? t.actions.submitting : t.actions.submit}
          </button>
        </form>
      </div>
    </main>
  );
}

function PortalSubmissionMessage({ locale, reference, state }: { locale: PortalLocale; reference: string; state?: PortalSubmissionPreviewState | undefined }) {
  const t = portalSubmissionText[locale];
  if (!state) return null;
  if (state === 'success') {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">
        {t.states.success}. {t.states.reference}: {reference}.
      </p>
    );
  }
  const message = state === 'loading' ? t.states.loading : state === 'validation' ? t.states.validation : t.states.error;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role={state === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function FieldGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid content-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2 md:grid-cols-2" aria-label={title}>
      <h2 className="text-sm font-semibold md:col-span-2">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ error, label, name, type = 'text', value }: { error?: string | undefined; label: string; name: string; type?: string; value: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={value} name={name} type={type} />
      {error ? <span className="text-xs font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}

function SelectField({ choose, label, name, option, preserve, value }: { choose: string; label: string; name: string; option: string; preserve: boolean; value: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserve ? value : ''} name={name}>
        <option value="">{choose}</option>
        <option value={value}>{option}</option>
      </select>
    </label>
  );
}

function readParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function previewState(value: string | undefined): PortalSubmissionPreviewState | undefined {
  return value === 'loading' || value === 'validation' || value === 'success' || value === 'error' ? value : undefined;
}
