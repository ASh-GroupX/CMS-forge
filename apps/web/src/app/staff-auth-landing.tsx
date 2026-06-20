import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { AuthPanel } from './staff-shell-panels';
import type { ResetPreviewState } from './password-reset-panel';
import { StaffTopBar } from './staff-top-bar';

export function StaffAuthLanding({
  authError,
  locale,
  resetState,
}: {
  authError: boolean;
  locale: Locale;
  resetState?: ResetPreviewState | undefined;
}) {
  const t = staffShellText[locale];
  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-background text-foreground">
      <StaffTopBar
        languageHref={`?locale=${locale === 'ar' ? 'en' : 'ar'}`}
        signedIn={t.auth.signedOut}
        subtitle={t.subtitle}
        switchLabel={t.switchLabel}
        switchTarget={t.switchTarget}
        themeDark={t.theme.dark}
        themeLabel={t.theme.label}
        themeLight={t.theme.light}
        title={t.title}
      />
      <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-md content-center gap-4 p-4 md:p-6">
        <div className="rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{t.subtitle}</p>
              <h1 className="text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t.branch}</p>
            </div>
          </div>
          <AuthPanel authError={authError} isSignedIn={false} locale={locale} resetState={resetState} />
        </div>
      </section>
    </main>
  );
}
