'use client';

import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function StaffTopBar({
  languageHref,
  signedIn,
  switchLabel,
  switchTarget,
  subtitle,
  themeDark,
  themeLabel,
  themeLight,
  title,
}: {
  languageHref: string;
  signedIn: string;
  switchLabel: string;
  switchTarget: string;
  subtitle: string;
  themeDark: string;
  themeLabel: string;
  themeLight: string;
  title: string;
}) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('cms-theme');
    const nextTheme: Theme = stored === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    window.localStorage.setItem('cms-theme', nextTheme);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line-subtle bg-surface/95 px-3 py-2 text-content-strong backdrop-blur md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-content-muted">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold tracking-normal">{title}</h1>
            <span className="rounded-sm bg-surface-raised px-2 py-1 text-xs font-semibold text-content-muted">{signedIn}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            aria-label={switchLabel}
            className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2 text-sm font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
            href={languageHref}
          >
            {switchTarget}
          </a>
          <button
            aria-label={themeLabel}
            aria-pressed={theme === 'dark'}
            className="inline-flex size-10 items-center justify-center rounded-sm border border-line-subtle bg-surface-raised hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
            <span className="sr-only">{theme === 'dark' ? themeLight : themeDark}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
