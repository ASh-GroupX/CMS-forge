'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CornerUpLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { staffNavigationText } from '../../i18n/staff-navigation';
import { clearStaffSession, enterStaffSession, readStaffSession, sanitizeNavigationTrail, staffSectionHref, staffSessionKey, writeStaffSession } from '../../lib/staff-navigation-session';
import type { Locale } from '../../i18n/staff-shell';

type Trail = { entries: { id: string; href: string }[]; index: number };
export function StaffPageNavigation({ owner, locale }: { owner: string; locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search?.toString();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const t = staffNavigationText[locale];
  const [trail, setTrail] = useState<Trail>({ entries: [], index: 0 });
  const currentTrail = useRef(trail);
  currentTrail.current = trail;
  const restoringPop = useRef(false);
  const [confirm, setConfirm] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const dirty = useRef(new Set<HTMLFormElement>());
  const leaving = useRef(false);
  const mounted = useRef(false);
  const previousOwner = useRef(owner);
  const lastHref = useRef('');
  const sectionHref = staffSectionHref(pathname ?? '', locale);
  const atSectionRoot = sectionHref.split('?')[0] === pathname;
  const request = useRef((action: () => void) => action());
  request.current = action => {
    window.dispatchEvent(new Event('cms:flush-drafts'));
    const unsaved = [...dirty.current].some(form => form.isConnected && form.dataset.draftPersisted !== 'true');
    if (unsaved) { pending.current = action; setConfirm(true); }
    else action();
  };
  useEffect(() => {
    if (previousOwner.current !== owner) { dirty.current.clear(); pending.current = null; restoringPop.current = false; previousOwner.current = owner; }
    const synchronize = () => {
    enterStaffSession(owner);
    const key = staffSessionKey(owner, 'navigation');
    const href = location.pathname + location.search;
    let next = sanitizeNavigationTrail(readStaffSession(key));
    const marker = history.state?.cmsStaffEntry;
    const index = next.entries.findIndex(entry => entry.id === marker?.id && entry.href === href && marker.owner === owner);
    if (index >= 0) next.index = index;
    else {
      const externalEntry = !mounted.current && (history.length <= 1 || !document.referrer || new URL(document.referrer).origin !== location.origin);
      if (marker || externalEntry) next = { entries: [], index: 0 };
      const entries = next.entries.slice(0, next.index + 1);
      const id = crypto.randomUUID();
      entries.push({ id, href });
      next = { entries: entries.slice(-80), index: Math.min(entries.length - 1, 79) };
      history.replaceState({ ...history.state, cmsStaffEntry: { id, owner } }, '', location.href);
    }
    mounted.current = true;
    leaving.current = false;
    writeStaffSession(key, next);
    setTrail(next);
    if (lastHref.current !== href) dirty.current.clear();
    lastHref.current = href;
    };
    synchronize();
    window.addEventListener('pageshow', synchronize);
    window.addEventListener('popstate', synchronize);
    return () => { window.removeEventListener('pageshow', synchronize); window.removeEventListener('popstate', synchronize); };
  }, [owner, pathname, query]);
  useEffect(() => {
    const markDirty = (event: Event) => {
      const element = event.target;
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
        if (element.form && element.type !== 'hidden' && element.form.getAttribute('method')?.toLowerCase() !== 'get') {
          dirty.current.add(element.form);
        }
      }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return;
      let url = new URL(anchor.href);
      if (url.origin !== location.origin || url.pathname.startsWith('/api/') || anchor.getAttribute('href')?.startsWith('#')) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      window.dispatchEvent(new Event('cms:flush-drafts'));
      const unsaved = [...dirty.current].some(form => form.isConnected && form.dataset.draftPersisted !== 'true');
      if (!unsaved && url.searchParams.get('locale') === locale) return;
      event.preventDefault();
      if (url.searchParams.has('locale') && url.searchParams.get('locale') !== locale) {
        const current = new URL(location.href); current.searchParams.set('locale', url.searchParams.get('locale')!); url = current;
      }
      if (!url.searchParams.has('locale')) url.searchParams.set('locale', locale);
      request.current(() => anchor.hasAttribute('data-preserve-client-navigation') ? routerRef.current.push(url.pathname + url.search + url.hash) : location.assign(url.pathname + url.search + url.hash));
    };
    const unload = (event: BeforeUnloadEvent) => {
      window.dispatchEvent(new Event('cms:flush-drafts'));
      if (!leaving.current && ([...dirty.current].some(form => form.isConnected && form.dataset.draftPersisted !== 'true') || document.querySelector('form[data-draft-has-files="true"]'))) { event.preventDefault(); event.returnValue = ''; }
    };
    const submit = (event: Event) => { if ((event.target as HTMLFormElement).matches('[data-staff-logout]')) { leaving.current = true; clearStaffSession(); } };
    const saved = (event: Event) => { dirty.current.delete((event as CustomEvent<HTMLFormElement>).detail); };
    const browserHistory = (event: PopStateEvent) => {
      if (restoringPop.current) {
        event.stopImmediatePropagation(); restoringPop.current = false; setConfirm(true); return;
      }
      if (leaving.current || ![...dirty.current].some(form => form.isConnected && form.dataset.draftPersisted !== 'true')) return;
      const current = currentTrail.current;
      const target = current.entries.findIndex(entry => entry.id === event.state?.cmsStaffEntry?.id);
      if (target < 0 || target === current.index) return;
      event.stopImmediatePropagation();
      const delta = target - current.index;
      pending.current = () => { leaving.current = true; history.go(delta); };
      restoringPop.current = true;
      history.go(-delta);
    };
    const beforeHistory = (event: Event) => browserHistory((event as CustomEvent<PopStateEvent>).detail);
    document.addEventListener('input', markDirty);
    document.addEventListener('change', markDirty);
    document.addEventListener('click', click, true);
    document.addEventListener('submit', submit, true);
    window.addEventListener('cms:form-saved', saved);
    window.addEventListener('cms:before-history', beforeHistory);
    window.addEventListener('beforeunload', unload);
    return () => {
      document.removeEventListener('input', markDirty); document.removeEventListener('change', markDirty);
      document.removeEventListener('click', click, true); document.removeEventListener('submit', submit, true);
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('cms:form-saved', saved);
      window.removeEventListener('cms:before-history', beforeHistory);
    };
  }, [locale]);
  return <>
    <nav aria-label={t.navigation} className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={trail.index === 0 && atSectionRoot} onClick={() => request.current(() => trail.index > 0 ? history.back() : location.assign(sectionHref))}><ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />{t.back}</Button>
      <Button type="button" variant="outline" size="sm" disabled={trail.index >= trail.entries.length - 1} onClick={() => request.current(() => history.forward())}>{t.forward}<ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" /></Button>
      {!atSectionRoot && <Button asChild variant="ghost" size="sm"><a href={sectionHref}><CornerUpLeft aria-hidden="true" className="size-4 rtl:rotate-180" />{t.up}</a></Button>}
    </nav>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent dir={locale === 'ar' ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t.unsaved}</DialogTitle><DialogDescription>{t.leaveHint}</DialogDescription></DialogHeader><DialogFooter>
      <Button type="button" variant="outline" onClick={() => { pending.current = null; setConfirm(false); }}>{t.stay}</Button>
      <Button type="button" onClick={() => { leaving.current = true; dirty.current.clear(); setConfirm(false); pending.current?.(); pending.current = null; }}>{t.leave}</Button>
    </DialogFooter></DialogContent></Dialog>
  </>;
}
