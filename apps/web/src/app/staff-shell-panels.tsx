import React from 'react';
import { loginStaffAction, logoutStaffAction } from '../lib/staff-auth-actions';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { PasswordResetPanel, type ResetFixtureState } from './password-reset-panel';
import { PasswordInput } from '../components/password-input';

export type RolePreview = 'staff' | 'admin' | 'management';

export const roleNav = {
  staff: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'dashboard', 'create', 'notifications'],
  admin: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'create', 'admin', 'audit', 'notifications'],
  management: ['today', 'sent', 'promises', 'handoff', 'queue', 'reports', 'manager', 'dashboard', 'audit', 'notifications'],
} as const;

export function RolePanel({ locale, role }: { locale: Locale; role: RolePreview }) {
  const t = staffShellText[locale];
  const roles: RolePreview[] = ['staff', 'admin', 'management'];

  return (
    <section className="mb-3 rounded-sm border border-brand-foreground/15 bg-brand-foreground/5 p-2" aria-label={t.role.label}>
      <p className="text-xs font-semibold text-brand-foreground/65">{t.role.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {roles.map((candidate) => (
          <a
            className={`rounded-sm border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${
              candidate === role ? 'border-brand bg-brand text-brand-foreground' : 'border-brand-foreground/15 bg-transparent text-brand-foreground/78'
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
  resetState?: ResetFixtureState | undefined;
}) {
  const t = staffShellText[locale];
  if (isSignedIn) {
    return (
      <section className="mb-3 rounded-sm border border-brand-foreground/15 bg-brand-foreground/5 p-2" aria-label={t.auth.signedIn}>
        <p className="text-sm font-semibold">{t.auth.signedIn}</p>
        <form action={logoutStaffAction}>
          <input name="locale" type="hidden" value={locale} />
          <button className="mt-2 inline-flex rounded-sm border border-brand-foreground/15 px-3 py-2 text-sm font-semibold hover:bg-brand/15 focus:outline-none focus:ring-2 focus:ring-brand" type="submit">
            {t.auth.logout}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-line-subtle bg-surface p-3 shadow-sm" aria-label={t.auth.loginTitle}>
      <h2 className="text-base font-semibold">{t.auth.loginTitle}</h2>
      {authError ? <p className="mt-2 rounded-sm border border-status-error-border bg-status-error-bg px-2 py-1 text-sm text-status-error" role="alert">{t.auth.genericError}</p> : null}
      <form action={loginStaffAction} className="mt-3 grid gap-2">
        <input name="locale" type="hidden" value={locale} />
        <label className="grid gap-1 text-sm font-medium text-content-strong">
          {t.auth.identifier}
          <input className="h-density-field rounded-sm border border-line-subtle bg-surface px-3 py-2 text-content-strong focus:outline-none focus:ring-2 focus:ring-brand" name="identifier" autoComplete="username" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-content-strong">
          {t.auth.password}
          <PasswordInput hideLabel={t.auth.hidePassword} id="staff-password" name="password" showLabel={t.auth.showPassword} />
        </label>
        <button className="h-density-field rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground focus:outline-none focus:ring-2 focus:ring-brand" type="submit">{t.auth.submit}</button>
      </form>
      <PasswordResetPanel locale={locale} state={resetState} />
    </section>
  );
}
