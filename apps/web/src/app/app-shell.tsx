import { Bell, CheckSquare2, ClipboardList, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, Menu, Search, Send, UsersRound } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { StaffTopBar } from './staff-top-bar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export const staffNavItems = [
  { key: 'today', Icon: CheckSquare2, href: '/tasks/today' },
  { key: 'sent', Icon: Send, href: '/tasks/sent' },
  { key: 'promises', Icon: Handshake, href: '/tasks/promises' },
  { key: 'handoff', Icon: GitBranch, href: '/deals/handoff' },
  { key: 'queue', Icon: Inbox, href: '/complaints' },
  { key: 'reports', Icon: ClipboardList, href: '/reports' },
  { key: 'manager', Icon: UsersRound, href: '/tasks/manager' },
  { key: 'dashboard', Icon: Gauge, href: '/dashboard' },
  { key: 'create', Icon: FilePlus2, href: '/complaints/new' },
  { key: 'detail', Icon: Search, href: '/complaints' },
  { key: 'admin', Icon: FolderCog, href: '/admin' },
  { key: 'audit', Icon: History, href: '/audit' },
  { key: 'notifications', Icon: Bell, href: '/notifications' },
  { key: 'groups', Icon: UsersRound, href: '/communication-groups' },
] as const;

export type StaffNavKey = (typeof staffNavItems)[number]['key'];
const desktopSections = [
  { key: 'work', items: ['today', 'sent', 'promises', 'handoff', 'manager', 'notifications'] },
  { key: 'complaints', items: ['queue', 'create', 'detail'] },
  { key: 'reports', items: ['dashboard', 'reports', 'audit'] },
  { key: 'administration', items: ['groups', 'admin'] },
] as const;
const mobileKeys = ['today', 'queue', 'create', 'notifications'] as const satisfies readonly StaffNavKey[];

export function AppShell({
  activePath = '',
  activeSearch = '',
  children,
  locale,
  navKeys,
  sidebarAfter,
  sidebarBefore,
  signedIn,
}: {
  activePath?: string;
  activeSearch?: string;
  children: ReactNode;
  locale: Locale;
  navKeys: readonly StaffNavKey[];
  sidebarAfter?: ReactNode;
  sidebarBefore?: ReactNode;
  signedIn: boolean;
}) {
  const t = staffShellText[locale];
  const visibleItems = staffNavItems.filter(({ key }) => navKeys.includes(key));

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-surface-canvas text-content-strong">
      <a className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-brand" href="#staff-main">
        {t.skipToMain}
      </a>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="order-2 hidden border-e border-line-subtle bg-surface-raised p-3 text-content-strong lg:sticky lg:top-0 lg:order-1 lg:block lg:h-screen lg:overflow-y-auto">
          <div className="mb-4 border-b border-line-subtle pb-3">
            <p className="text-xs font-semibold text-content-muted">{t.subtitle}</p>
            <h1 className="text-xl font-semibold tracking-normal">{t.title}</h1>
            <p className="mt-1 text-xs text-content-muted">{t.branch}</p>
          </div>
          {sidebarBefore}
          <nav className="grid gap-4" aria-label={t.title}>{desktopSections.map((section) => { const items = visibleItems.filter((item) => (section.items as readonly string[]).includes(item.key)); return items.length ? <section className="grid gap-1" key={section.key} aria-label={t.navSections[section.key]}><h2 className="px-2 text-xs font-semibold text-content-muted">{t.navSections[section.key]}</h2>{items.map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</section> : null; })}</nav>
          {sidebarAfter}
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          <StaffTopBar
            languageHref={languageHref(activePath, activeSearch, locale === 'ar' ? 'en' : 'ar')}
            signedIn={signedIn ? t.auth.signedIn : t.auth.signedOut}
            subtitle={t.subtitle}
            switchLabel={t.switchLabel}
            switchTarget={t.switchTarget}
            themeDark={t.theme.dark}
            themeLabel={t.theme.label}
            themeLight={t.theme.light}
            title={t.title}
          />
          <nav className="sticky top-[4.5rem] z-20 grid grid-cols-5 border-b border-line-subtle bg-surface/95 px-1 py-1 backdrop-blur lg:hidden" aria-label={t.title}>
            {mobileKeys.flatMap((key) => { const item = visibleItems.find((candidate) => candidate.key === key); return item ? [<MobileNavLink activePath={activePath} item={item} key={item.key} label={mobileLabel(t, key)} locale={locale} />] : []; })}
            <Dialog><DialogTrigger asChild><button className="grid min-w-0 place-items-center gap-1 rounded-sm px-1 py-2 text-xs font-semibold text-content-muted focus:outline-none focus:ring-2 focus:ring-brand" type="button"><Menu aria-hidden="true" className="size-4" /><span className="truncate">{t.mobileNav.more}</span></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t.mobileNav.title}</DialogTitle></DialogHeader><nav className="grid gap-1" aria-label={t.mobileNav.title}>{visibleItems.filter((item) => !(mobileKeys as readonly StaffNavKey[]).includes(item.key)).map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</nav></DialogContent></Dialog>
          </nav>
          <section className="grid min-w-0 content-start gap-3 p-3 md:p-4 xl:p-5" id="staff-main">{children}</section>
        </div>
      </div>
    </main>
  );
}

type NavItem = (typeof staffNavItems)[number];
type ShellCopy = (typeof staffShellText)[Locale];
function DesktopNavLink({ activePath, item: { key, Icon, href }, locale, t }: { activePath: string; item: NavItem; locale: Locale; t: ShellCopy }) { const [label, description] = t.nav[key]; const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} aria-label={`${label}: ${description}`} className={`grid grid-cols-[1.5rem_1fr] items-center gap-2 rounded-sm px-2 py-2 text-start text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-brand/10 text-brand' : 'text-content-muted hover:bg-surface hover:text-content-strong'}`} href={`${href}?locale=${locale}`} title={description}><Icon aria-hidden="true" className="size-4" /><span className="truncate">{label}</span></a>; }
function MobileNavLink({ activePath, item: { key, Icon, href }, label, locale }: { activePath: string; item: NavItem; label: string; locale: Locale }) { const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} className={`grid min-w-0 place-items-center gap-1 rounded-sm px-1 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-brand/10 text-brand' : 'text-content-muted'}`} href={`${href}?locale=${locale}`}><Icon aria-hidden="true" className="size-4" /><span className="w-full truncate text-center">{label}</span></a>; }
function mobileLabel(t: ShellCopy, key: (typeof mobileKeys)[number]): string { if (key === 'queue') return t.mobileNav.cases; return t.mobileNav[key]; }

function languageHref(pathname: string, search: string, locale: Locale): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.set('locale', locale);
  const query = params.toString();
  return `${pathname || '/'}${query ? `?${query}` : ''}`;
}

export function isActiveNav(key: StaffNavKey, href: string, activePath: string): boolean {
  if (!activePath) return false;
  if (key === 'create') return activePath === '/complaints/new';
  if (key === 'detail') return /^\/complaints\/[^/]+/.test(activePath) && activePath !== '/complaints/new';
  if (key === 'queue') return activePath === '/complaints';
  return activePath === href || activePath.startsWith(`${href}/`);
}
