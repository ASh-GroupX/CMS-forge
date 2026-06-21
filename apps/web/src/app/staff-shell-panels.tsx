import React from 'react';
import { loginStaffAction, logoutStaffAction } from '../lib/staff-auth-actions';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { PasswordResetPanel, type ResetPreviewState } from './password-reset-panel';

export type RolePreview = 'staff' | 'admin' | 'management';

export const roleNav = {
  staff: ['today', 'dashboard', 'queue', 'create', 'detail', 'notifications'],
  admin: ['today', 'manager', 'dashboard', 'queue', 'create', 'detail', 'admin', 'reports', 'audit', 'notifications'],
  management: ['today', 'manager', 'dashboard', 'queue', 'detail', 'reports', 'audit', 'notifications'],
} as const;

export function RolePanel({ locale, role }: { locale: Locale; role: RolePreview }) {
  const t = staffShellText[locale];
  const roles: RolePreview[] = ['staff', 'admin', 'management'];

  return (
    <section className="mb-4 rounded-md border border-border bg-muted p-3" aria-label={t.role.label}>
      <p className="text-xs font-semibold text-muted-foreground">{t.role.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {roles.map((candidate) => (
          <a
            className={`rounded-sm border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${
              candidate === role ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-card text-foreground'
            }`}
            href={`?locale=${locale}&session=signed-in&role=${candidate}`}
            key={candidate}
          >
            {t.role[candidate]}
          </a>
        ))}
      </div>
    </section>
  );
}

export function AuthPanel({
  authError,
  isSignedIn,
  locale,
  resetState,
}: {
  authError: boolean;
  isSignedIn: boolean;
  locale: Locale;
  resetState?: ResetPreviewState | undefined;
}) {
  const t = staffShellText[locale];
  const previewQuery = `?locale=${locale}`;

  if (isSignedIn) {
    return (
      <section className="mb-4 rounded-md border border-border bg-muted p-3" aria-label={t.auth.signedIn}>
        <p className="text-sm font-semibold">{t.auth.signedIn}</p>
        <form action={logoutStaffAction}>
          <input name="locale" type="hidden" value={locale} />
          <button className="mt-3 inline-flex rounded-sm border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand" type="submit">
            {t.auth.logout}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mb-4 rounded-md border border-border bg-muted p-3" aria-label={t.auth.loginTitle}>
      <h2 className="text-sm font-semibold">{t.auth.loginTitle}</h2>
      {authError ? <p className="mt-2 rounded-sm border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-800" role="alert">{t.auth.genericError}</p> : null}
      <form action={loginStaffAction} className="mt-3 grid gap-2">
        <input name="locale" type="hidden" value={locale} />
        <label className="grid gap-1 text-sm font-medium">
          {t.auth.identifier}
          <input className="rounded-sm border border-border bg-background px-3 py-2" name="identifier" autoComplete="username" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.auth.password}
          <input className="rounded-sm border border-border bg-background px-3 py-2" name="password" type="password" autoComplete="current-password" />
        </label>
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="submit">{t.auth.submit}</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <a className="text-brand underline" href={`${previewQuery}&session=signed-in`}>{t.auth.previewSignedIn}</a>
        <a className="text-brand underline" href={`${previewQuery}&auth=error`}>{t.auth.previewError}</a>
      </div>
      <PasswordResetPanel locale={locale} state={resetState} />
    </section>
  );
}
