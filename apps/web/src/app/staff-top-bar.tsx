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
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 text-foreground shadow-sm backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-normal">{title}</h1>
            <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{signedIn}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            aria-label={switchLabel}
            className="rounded-sm border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
            href={languageHref}
          >
            {switchTarget}
          </a>
          <button
            aria-label={themeLabel}
            aria-pressed={theme === 'dark'}
            className="inline-flex size-10 items-center justify-center rounded-sm border border-border bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
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
