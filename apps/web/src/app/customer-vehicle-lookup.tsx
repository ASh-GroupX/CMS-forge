import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';

export type LookupPreviewState = 'loading' | 'none' | 'error';

const fields = ['phone', 'customerCode', 'name', 'vin', 'plate'] as const;

export function CustomerVehicleLookup({ locale, state }: { locale: Locale; state?: LookupPreviewState | undefined }) {
  const t = staffShellText[locale].lookup;

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      <div className="grid gap-2 border-b border-slate-200 p-4 md:grid-cols-5">
        {fields.map((field) => (
          <label className="grid gap-1 text-sm font-medium" key={field}>
            {t.fields[field]}
            <input className="rounded-sm border border-slate-300 px-2 py-2" name={`lookup-${field}`} />
          </label>
        ))}
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">{t.resultTitle}</p>
          {state ? (
            <p className="mt-2 text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
              {t.states[state]}
            </p>
          ) : (
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-sm bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  {t.sources.local}
                </span>
                <span className="rounded-sm bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">
                  {t.sources.dms}
                </span>
              </div>
              <p>{t.safeCustomer}</p>
              <p>{t.safeVehicle}</p>
            </div>
          )}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">{t.manualTitle}</p>
          <p className="mt-2 text-sm text-slate-600">{t.manualHelp}</p>
          <button className="mt-3 rounded-sm border border-slate-300 px-3 py-2 text-sm font-semibold" type="button">
            {t.manualAction}
          </button>
        </div>
      </div>
    </section>
  );
}
