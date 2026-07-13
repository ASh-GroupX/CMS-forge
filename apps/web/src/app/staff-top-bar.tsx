'use client';

import { Bell, Moon, Search, Sun } from 'lucide-react';
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

export function StaffTopBar({ account = null, heading, isRtl, languageHref, locale, notificationsHref = '/notifications', search, showSearch = true, signedIn, subheading, subtitle, switchLabel, switchTarget, themeDark, themeLabel, themeLight, title }: {
  account?: { initials: string; name: string } | null;
  heading?: string;
  isRtl: boolean;
  languageHref: string;
  locale: Locale;
  notificationsHref?: string;
  search: SearchCopy;
  showSearch?: boolean;
  signedIn?: string;
  subheading?: string;
  subtitle?: string;
  switchLabel: string;
  switchTarget: string;
  themeDark: string;
  themeLabel: string;
  themeLight: string;
  title?: string;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => { const stored = window.localStorage.getItem('cms-theme'); const nextTheme: Theme = stored === 'dark' ? 'dark' : 'light'; setTheme(nextTheme); document.documentElement.classList.toggle('dark', nextTheme === 'dark'); }, []);
  useEffect(() => { if (!showSearch) return; const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, [showSearch]);
  useEffect(() => {
    if (!showSearch) return;
    if (query.trim().length < 2) { setResults([]); setSearchState('idle'); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchState('loading');
      try { const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=8`, { cache: 'no-store', signal: controller.signal }); if (!response.ok) throw new Error('search'); const body = await response.json() as { items?: SearchResult[] }; setResults(Array.isArray(body.items) ? body.items : []); setSearchState('ready'); }
      catch (error) { if ((error as Error).name !== 'AbortError') setSearchState('error'); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, showSearch]);

  function toggleTheme() { const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'; setTheme(nextTheme); document.documentElement.classList.toggle('dark', nextTheme === 'dark'); window.localStorage.setItem('cms-theme', nextTheme); }

  const resolvedHeading = heading ?? title ?? '';
  const resolvedSubheading = subheading ?? signedIn ?? subtitle ?? '';

  return <>
    <header className="sticky top-0 z-30 border-b border-line-subtle bg-surface/95 px-3 backdrop-blur md:px-5">
      <div className="flex min-h-[5.75rem] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3"><div className="min-w-0"><h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{resolvedHeading}</h1><p className="mt-1 truncate text-sm text-content-muted">{resolvedSubheading}</p></div><Button aria-label={themeLabel} aria-pressed={theme === 'dark'} className="hidden size-11 shrink-0 md:inline-flex" onClick={toggleTheme} size="icon" type="button" variant="ghost">{theme === 'dark' ? <Sun aria-hidden="true" className="size-5 text-status-warning" /> : <Sun aria-hidden="true" className="size-5 text-status-warning" />}<span className="sr-only">{theme === 'dark' ? themeLight : themeDark}</span></Button></div>
        <div className="flex shrink-0 items-center gap-2">
          {showSearch ? <><Button className="hidden h-11 w-[19rem] justify-start rounded-lg text-content-muted xl:flex" onClick={() => setSearchOpen(true)} type="button" variant="outline"><Search aria-hidden="true" className="me-2 size-5" /><span className="truncate">{search.placeholder}</span></Button><Button aria-label={search.label} className="xl:hidden" onClick={() => setSearchOpen(true)} size="icon" type="button" variant="outline"><Search aria-hidden="true" className="size-5" /></Button></> : null}
          <Button asChild aria-label={search.label} size="icon" variant="ghost"><a href={notificationsHref}><Bell aria-hidden="true" className="size-5" /></a></Button>
          <Button asChild className="hidden sm:inline-flex" variant="ghost"><a aria-label={switchLabel} href={languageHref}>{switchTarget}</a></Button>
          <Button aria-label={themeLabel} aria-pressed={theme === 'dark'} className="md:hidden" onClick={toggleTheme} size="icon" type="button" variant="ghost">{theme === 'dark' ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}</Button>
          {account ? <div className="hidden items-center gap-2 border-s border-line-subtle ps-3 sm:flex"><span className="grid size-9 place-items-center rounded-full bg-brand/5 text-xs font-bold text-brand">{account.initials}</span><span className="max-w-28 truncate text-sm font-semibold">{account.name}</span></div> : null}
        </div>
      </div>
    </header>
    <Dialog onOpenChange={setSearchOpen} open={searchOpen}>
      <DialogContent className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl"><DialogHeader className="border-b border-line-subtle p-4"><DialogTitle>{search.label}</DialogTitle></DialogHeader><div className="p-4"><Input aria-label={search.label} autoComplete="off" autoFocus onChange={(event) => setQuery(event.target.value)} placeholder={search.placeholder} value={query} /></div><div aria-live="polite" className="max-h-[55vh] overflow-y-auto border-t border-line-subtle p-2">
        {searchState === 'idle' ? <p className="p-3 text-sm text-content-muted">{search.hint}</p> : null}{searchState === 'loading' ? <p className="p-3 text-sm text-content-muted">{search.loading}</p> : null}{searchState === 'error' ? <p className="p-3 text-sm text-status-error">{search.error}</p> : null}{searchState === 'ready' && !results.length ? <p className="p-3 text-sm text-content-muted">{search.empty}</p> : null}
        {results.map((result) => <a className="flex min-h-14 items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand" href={localeHref(result.href, locale)} key={`${result.type}:${result.id}`}><Badge variant="outline">{search.types[result.type]}</Badge><span className="min-w-0"><bdi className="block truncate text-sm font-semibold">{isRtl ? result.labelAr : result.label}</bdi><bdi className="block truncate text-xs text-content-muted">{isRtl ? result.contextAr : result.context}</bdi></span></a>)}
      </div></DialogContent>
    </Dialog>
  </>;
}
