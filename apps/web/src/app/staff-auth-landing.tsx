import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { modernUiText } from '../i18n/staff-modern-ui';
import { AuthPanel } from './staff-shell-panels';
import type { ResetFixtureState } from './password-reset-panel';
import { StaffTopBar } from './staff-top-bar';

export function StaffAuthLanding({
  authError,
  locale,
  resetState,
}: {
  authError: boolean;
  locale: Locale;
  resetState?: ResetFixtureState | undefined;
}) {
  const t = staffShellText[locale];
  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-surface-canvas text-content-strong">
      <StaffTopBar
        isRtl={locale === 'ar'}
        languageHref={`?locale=${locale === 'ar' ? 'en' : 'ar'}`}
        locale={locale}
        search={modernUiText[locale].search}
        showSearch={false}
        signedIn={t.auth.signedOut}
        subtitle={t.subtitle}
        switchLabel={t.switchLabel}
        switchTarget={t.switchTarget}
        themeDark={t.theme.dark}
        themeLabel={t.theme.label}
        themeLight={t.theme.light}
        title={t.title}
      />
      <section className="grid min-h-[calc(100vh-3.75rem)] lg:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
        <div className="hidden border-e border-line-subtle bg-surface-raised p-8 text-content-strong lg:grid lg:content-between">
          <div>
            <p className="text-sm font-semibold text-content-muted">{t.subtitle}</p>
            <h1 className="mt-2 max-w-lg text-4xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-3 text-sm text-content-muted">{t.branch}</p>
          </div>
          <div className="grid gap-2 border-t border-line-subtle pt-4 text-sm text-content-muted">
            <span>{t.nav.today[0]}</span>
            <span>{t.nav.queue[0]}</span>
            <span>{t.nav.reports[0]}</span>
          </div>
        </div>
        <div className="grid content-center px-4 py-8 md:px-6">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 lg:hidden">
              <p className="text-sm font-semibold text-content-muted">{t.subtitle}</p>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 text-sm text-content-muted">{t.branch}</p>
            </div>
            <AuthPanel authError={authError} isSignedIn={false} locale={locale} resetState={resetState} />
          </div>
        </div>
      </section>
    </main>
  );
}
