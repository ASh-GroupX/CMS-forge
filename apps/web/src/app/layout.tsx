import type { Metadata } from 'next';
import { headers } from 'next/headers';
import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText, type Locale } from '../i18n/staff-shell';
import '../globals.css';

export const metadata: Metadata = {
  title: 'CMS-Auto Staff',
  description: 'Staff complaint management shell',
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
    <html lang={locale} dir={rootDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
