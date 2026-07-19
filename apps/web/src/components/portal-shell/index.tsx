import React from 'react';
import type { ReactNode } from 'react';
import { BrandMark } from '../brand-mark';
import { portalShellText, type PortalShellLocale, type PortalShellPage } from '../../i18n/portal-shell';

const portalRoutes: Record<PortalShellPage, string> = {
  submit: '/portal',
  track: '/portal/track',
  survey: '/portal/survey',
};

export function PortalShell({
  children,
  current,
  locale,
  privacy,
  subtitle,
  switchHref,
  switchLabel,
  switchTarget,
  title,
}: {
  children: ReactNode;
  current: PortalShellPage;
  locale: PortalShellLocale;
  privacy: string;
  subtitle: string;
  switchHref: string;
  switchLabel: string;
  switchTarget: string;
  title: string;
}) {
  const t = portalShellText[locale];

  return (
    <div className="min-h-screen bg-surface-canvas text-content-strong" dir={t.dir} lang={t.lang}>
      <a className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-brand" href="#portal-main">
        {t.skipToMain}
      </a>
      <header className="border-b border-line-subtle bg-surface/90 px-4 py-4 shadow-md backdrop-blur-xl md:px-6">
        <div className="mx-auto mb-4 max-w-5xl border-b border-line-subtle pb-4">
          <BrandMark />
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-content-muted">{t.navLabel}</p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-content-strong md:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-content-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label={t.navLabel} className="flex flex-wrap gap-1">
              {(Object.keys(portalRoutes) as PortalShellPage[]).map((key) => (
                <a
                  aria-current={current === key ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${
                    current === key ? 'bg-brand text-brand-foreground' : 'border border-line-subtle bg-surface-raised text-content-strong hover:bg-accent'
                  }`}
                  href={`${portalRoutes[key]}?locale=${locale}`}
                  key={key}
                >
                  {t.nav[key]}
                </a>
              ))}
            </nav>
            <a
              aria-label={switchLabel}
              className="inline-flex min-h-11 items-center rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm font-semibold text-content-strong hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
              href={switchHref}
            >
              {switchTarget}
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-5xl gap-4 p-4 md:p-6" id="portal-main">
        {children}
      </main>
      <footer className="border-t border-line-subtle bg-surface px-4 py-4 md:px-6">
        <section aria-label={t.footerLabel} className="mx-auto grid max-w-5xl gap-2 text-sm text-content-muted md:grid-cols-2">
          <p>{privacy}</p>
          <p>{t.trust}</p>
        </section>
      </footer>
    </div>
  );
}
