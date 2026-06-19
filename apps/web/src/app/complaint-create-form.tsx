import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';

export type CreateFormPreviewState = 'validation' | 'success' | 'error';

export function ComplaintCreateForm({
  locale,
  state,
}: {
  locale: Locale;
  state?: CreateFormPreviewState | undefined;
}) {
  const t = staffShellText[locale].createForm;
  const preserveInput = state === 'success' || state === 'error';

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      {state === 'success' || state === 'error' ? (
        <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm" role={state === 'error' ? 'alert' : 'status'}>
          {state === 'success' ? t.states.success : t.states.error}
        </p>
      ) : null}
      <form className="grid gap-3 p-4 md:grid-cols-2">
        {(['category', 'severity', 'branch'] as const).map((field) => (
          <label className="grid gap-1 text-sm font-medium" key={field}>
            {t.fields[field]}
            <select className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserveInput ? 'sample' : ''}>
              <option value="">{t.choose}</option>
              <option value="sample">{t.sampleOption}</option>
            </select>
            {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.validation.required}</span> : null}
          </label>
        ))}
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.incidentDate}
          <input className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserveInput ? '2026-06-19' : ''} type="date" />
        </label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          {t.fields.subject}
          <input className="rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserveInput ? t.sampleSubject : ''} />
          {state === 'validation' ? <span className="text-xs font-semibold text-red-700">{t.validation.required}</span> : null}
        </label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          {t.fields.description}
          <textarea className="min-h-24 rounded-sm border border-slate-300 px-2 py-2" defaultValue={preserveInput ? t.sampleDescription : ''} />
          {state === 'validation' ? (
            <span className="text-xs font-semibold text-red-700">{t.validation.vinRequired}</span>
          ) : null}
        </label>
      </form>
    </section>
  );
}
