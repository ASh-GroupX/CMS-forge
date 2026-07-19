import React from 'react';
import { BrandMark } from '../components/brand-mark';
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
      <section className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(24rem,32rem)]">
        <div className="relative hidden overflow-hidden border-e border-nav-border bg-nav p-10 text-nav-foreground lg:grid lg:content-between">
          <div aria-hidden="true" className="absolute -start-24 top-1/4 size-96 rounded-full bg-brand/15 blur-3xl" />
          <div>
            <BrandMark label={t.title} tagline={t.subtitle} />
            <h1 className="mt-20 max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em] [text-wrap:balance]">{t.title}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-nav-muted">{t.branch}</p>
          </div>
          <div className="relative grid gap-5 border-s border-brand/40 ps-6 text-sm text-nav-muted">
            {[t.nav.today[0], t.nav.queue[0], t.nav.reports[0]].map((label, index) => <span className="relative before:absolute before:-start-[1.79rem] before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:bg-brand before:ring-4 before:ring-nav" key={label}><span className="me-3 font-mono text-[0.6875rem] text-brand">0{index + 1}</span>{label}</span>)}
          </div>
        </div>
        <div className="grid content-center bg-surface-canvas px-4 py-8 md:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 lg:hidden">
              <BrandMark label={t.title} tagline={t.subtitle} />
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">{t.title}</h1>
              <p className="mt-1 text-sm text-content-muted">{t.branch}</p>
            </div>
            <AuthPanel authError={authError} isSignedIn={false} locale={locale} resetState={resetState} />
          </div>
        </div>
      </section>
    </main>
  );
}
