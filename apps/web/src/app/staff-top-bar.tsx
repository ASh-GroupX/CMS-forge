'use client';

import { Moon, Search, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import type { Locale } from '../i18n/staff-shell';
import { localeHref } from '../lib/locale-href';

type Theme = 'light' | 'dark';
type SearchType = 'COMPLAINT' | 'TASK' | 'CASE' | 'DEAL' | 'CUSTOMER';
type SearchResult = { type: SearchType; id: string; label: string; labelAr: string; context: string; contextAr: string; href: string };
type SearchCopy = { label: string; placeholder: string; hint: string; loading: string; empty: string; error: string; types: Record<SearchType, string> };

export function StaffTopBar({ isRtl, languageHref, locale, search, showSearch = true, signedIn, switchLabel, switchTarget, subtitle, themeDark, themeLabel, themeLight, title }: {
  isRtl: boolean;
  languageHref: string;
  locale: Locale;
  search: SearchCopy;
  showSearch?: boolean;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    const stored = window.localStorage.getItem('cms-theme');
    const nextTheme: Theme = stored === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, []);

  useEffect(() => {
    if (!showSearch) return;
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [showSearch]);

  useEffect(() => {
    if (!showSearch) return;
    if (query.trim().length < 2) { setResults([]); setSearchState('idle'); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchState('loading');
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=8`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('search');
        const body = await response.json() as { items?: SearchResult[] };
        setResults(Array.isArray(body.items) ? body.items : []);
        setSearchState('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSearchState('error');
      }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, showSearch]);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    window.localStorage.setItem('cms-theme', nextTheme);
  }

  return <>
    <header className="sticky top-0 z-30 border-b border-line-subtle bg-surface/95 px-3 py-2 text-content-strong backdrop-blur md:px-5">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="min-w-0 lg:hidden"><p className="truncate text-xs font-semibold text-content-muted">{subtitle}</p><h1 className="truncate text-base font-semibold tracking-tight">{title}</h1></div>
        {showSearch ? <><Button className="hidden w-full max-w-xl justify-start text-content-muted md:flex" onClick={() => setSearchOpen(true)} type="button" variant="outline"><Search aria-hidden="true" className="me-2 size-4" /><span className="truncate">{search.placeholder}</span><kbd className="ms-auto rounded border border-line-subtle bg-surface-raised px-1.5 py-0.5 text-xs">⌘K</kbd></Button><Button aria-label={search.label} className="md:hidden" onClick={() => setSearchOpen(true)} size="icon" type="button" variant="outline"><Search aria-hidden="true" className="size-4" /></Button></> : <span />}
        <div className="flex items-center gap-2">
          <Badge className="hidden sm:inline-flex" variant="secondary">{signedIn}</Badge>
          <Button asChild variant="outline"><a aria-label={switchLabel} href={languageHref}>{switchTarget}</a></Button>
          <Button aria-label={themeLabel} aria-pressed={theme === 'dark'} onClick={toggleTheme} size="icon" type="button" variant="outline">{theme === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}<span className="sr-only">{theme === 'dark' ? themeLight : themeDark}</span></Button>
        </div>
      </div>
    </header>
    <Dialog onOpenChange={setSearchOpen} open={searchOpen}>
      <DialogContent className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-line-subtle p-4"><DialogTitle>{search.label}</DialogTitle></DialogHeader>
        <div className="p-4"><Input aria-label={search.label} autoComplete="off" autoFocus onChange={(event) => setQuery(event.target.value)} placeholder={search.placeholder} value={query} /></div>
        <div aria-live="polite" className="max-h-[55vh] overflow-y-auto border-t border-line-subtle p-2">
          {searchState === 'idle' ? <p className="p-3 text-sm text-content-muted">{search.hint}</p> : null}
          {searchState === 'loading' ? <p className="p-3 text-sm text-content-muted">{search.loading}</p> : null}
          {searchState === 'error' ? <p className="p-3 text-sm text-status-error">{search.error}</p> : null}
          {searchState === 'ready' && !results.length ? <p className="p-3 text-sm text-content-muted">{search.empty}</p> : null}
          {results.map((result) => <a className="flex min-h-14 items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand" href={localeHref(result.href, locale)} key={`${result.type}:${result.id}`}><Badge variant="outline">{search.types[result.type]}</Badge><span className="min-w-0"><bdi className="block truncate text-sm font-semibold">{isRtl ? result.labelAr : result.label}</bdi><bdi className="block truncate text-xs text-content-muted">{isRtl ? result.contextAr : result.context}</bdi></span></a>)}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
