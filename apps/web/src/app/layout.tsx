import type { Metadata } from 'next';
import { headers } from 'next/headers';
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = resolveRootLocale((await headers()).get(rootLocaleHeader));

  return (
    <html lang={locale} dir={rootDirection(locale)} suppressHydrationWarning>
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
