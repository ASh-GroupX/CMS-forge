import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';

export type ResetPreviewState = 'request' | 'requested' | 'token' | 'success' | 'invalid';

export function PasswordResetPanel({ locale, state }: { locale: Locale; state?: ResetPreviewState | undefined }) {
  const t = staffShellText[locale].reset;
  const queryPrefix = `?locale=${locale}&reset=`;
  const showRequest = state === 'request' || state === 'requested';
  const showToken = state === 'token' || state === 'success' || state === 'invalid';

  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-white p-3" aria-label={t.title}>
      <h3 className="text-sm font-semibold">{t.title}</h3>
      <p className="mt-1 text-xs text-slate-600">{t.help}</p>

      {state ? null : (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <a className="text-brand underline" href={`${queryPrefix}request`}>
            {t.requestEntry}
          </a>
          <a className="text-brand underline" href={`${queryPrefix}token`}>
            {t.tokenEntry}
          </a>
        </div>
      )}

      {showRequest ? (
        <form className="mt-3 grid gap-2">
          {state === 'requested' ? (
            <p className="rounded-sm border border-green-200 bg-green-50 px-2 py-1 text-sm text-green-800" role="status">
              {t.requestSuccess}
            </p>
          ) : null}
          <label className="grid gap-1 text-sm font-medium">
            {t.identifier}
            <input className="rounded-sm border border-slate-300 px-3 py-2" name="resetIdentifier" autoComplete="username" />
          </label>
          <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">
            {t.requestSubmit}
          </button>
          <a className="text-xs font-semibold text-brand underline" href={`${queryPrefix}token`}>
            {t.tokenEntry}
          </a>
        </form>
      ) : null}

      {showToken ? (
        <form className="mt-3 grid gap-2">
          {state === 'success' ? (
            <p className="rounded-sm border border-green-200 bg-green-50 px-2 py-1 text-sm text-green-800" role="status">
              {t.resetSuccess}
            </p>
          ) : null}
          {state === 'invalid' ? (
            <p className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-800" role="alert">
              {t.invalidToken}
            </p>
          ) : null}
          <label className="grid gap-1 text-sm font-medium">
            {t.token}
            <input className="rounded-sm border border-slate-300 px-3 py-2" name="resetToken" autoComplete="off" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {t.newPassword}
            <input
              className="rounded-sm border border-slate-300 px-3 py-2"
              name="newPassword"
              type="password"
              autoComplete="new-password"
            />
          </label>
          <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">
            {t.resetSubmit}
          </button>
          <a className="text-xs font-semibold text-brand underline" href={`${queryPrefix}request`}>
            {t.requestEntry}
          </a>
        </form>
      ) : null}
    </section>
  );
}
