import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import React from 'react';
import type { ReactNode } from 'react';
import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import { resolveLocale, staffShellText, type Locale } from '../i18n/staff-shell';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'CMS-Auto', template: '%s · CMS-Auto' },
  description: 'Dealership accountability, complaint, task, and handoff operations.',
  icons: { icon: '/favicon.svg' },
};

export const rootLocaleHeader = 'x-cms-locale';

export function resolveRootLocale(value: string | null): Locale {
  return resolveLocale(value ?? undefined);
}

export function rootDirection(locale: Locale) {
  return staffShellText[locale].dir;
}

const themeScript = `
try {
  document.documentElement.classList.toggle('dark', localStorage.getItem('cms-theme') === 'dark');
} catch {}
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = resolveRootLocale((await headers()).get(rootLocaleHeader));

  return (
    <html lang={locale} dir={rootDirection(locale)} suppressHydrationWarning>
      <body>
        <Script id="cms-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
