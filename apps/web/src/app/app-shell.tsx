import { Bell, Building2, CheckSquare2, ClipboardList, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, Menu, Search, Send, UsersRound } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import { modernUiText } from '../i18n/staff-modern-ui';
import type { StaffSessionPrincipal } from '../lib/staff-session-api';
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
const mobileKeys = ['dashboard', 'today', 'queue', 'notifications'] as const satisfies readonly StaffNavKey[];

export function AppShell({
  activePath = '',
  activeSearch = '',
  children,
  locale,
  navKeys,
  principal,
  sidebarAfter,
  sidebarBefore,
}: {
  activePath?: string;
  activeSearch?: string;
  children: ReactNode;
  locale: Locale;
  navKeys: readonly StaffNavKey[];
  principal: StaffSessionPrincipal | null;
  sidebarAfter?: ReactNode;
  sidebarBefore?: ReactNode;
}) {
  const t = staffShellText[locale];
  const visibleItems = staffNavItems.filter(({ key }) => navKeys.includes(key));
  const identity = principal ? staffIdentity(principal, locale) : null;

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-surface-canvas text-content-strong">
      <a className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-brand" href="#staff-main">
        {t.skipToMain}
      </a>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-e border-line-subtle bg-surface p-3 text-content-strong lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <div className="mb-4 px-2 pb-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{t.subtitle}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{t.title}</h1>
          </div>
          {identity ? (
            <section className="mb-4 rounded-lg border border-line-subtle bg-surface-raised p-3 shadow-sm" aria-label={identity.name}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground" aria-hidden="true">{identity.initials}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{identity.name}</p>
                  <p className="truncate text-xs text-content-muted">{identity.role}</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 border-t border-line-subtle pt-3 text-xs text-content-muted">
                <Building2 aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{identity.branch}</span>
              </p>
            </section>
          ) : null}
          {sidebarBefore}
          <nav className="grid gap-4" aria-label={t.title}>{desktopSections.map((section) => { const items = visibleItems.filter((item) => (section.items as readonly string[]).includes(item.key)); return items.length ? <section className="grid gap-1" key={section.key} aria-label={t.navSections[section.key]}><h2 className="px-2 text-xs font-semibold text-content-muted">{t.navSections[section.key]}</h2>{items.map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</section> : null; })}</nav>
          {sidebarAfter}
        </aside>
        <div className="min-w-0">
          <StaffTopBar
            languageHref={languageHref(activePath, activeSearch, locale === 'ar' ? 'en' : 'ar')}
            signedIn={principal ? t.auth.signedIn : t.auth.signedOut}
            search={modernUiText[locale].search}
            isRtl={locale === 'ar'}
            locale={locale}
            subtitle={t.subtitle}
            switchLabel={t.switchLabel}
            switchTarget={t.switchTarget}
            themeDark={t.theme.dark}
            themeLabel={t.theme.label}
            themeLight={t.theme.light}
            title={t.title}
          />
          <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line-subtle bg-surface/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 shadow-lg backdrop-blur lg:hidden" aria-label={t.title}>
            {mobileKeys.flatMap((key) => { const item = visibleItems.find((candidate) => candidate.key === key); return item ? [<MobileNavLink activePath={activePath} item={item} key={item.key} label={mobileLabel(t, key)} locale={locale} />] : []; })}
            <Dialog><DialogTrigger asChild><button className="grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-semibold text-content-muted focus:outline-none focus:ring-2 focus:ring-brand" type="button"><Menu aria-hidden="true" className="size-5" /><span className="truncate">{t.mobileNav.more}</span></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t.mobileNav.title}</DialogTitle></DialogHeader><nav className="grid gap-1" aria-label={t.mobileNav.title}>{visibleItems.filter((item) => !(mobileKeys as readonly StaffNavKey[]).includes(item.key)).map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</nav></DialogContent></Dialog>
          </nav>
          <section className="mx-auto grid min-w-0 max-w-[96rem] content-start gap-4 p-3 pb-24 md:p-5 md:pb-24 xl:p-7 lg:pb-7" id="staff-main">{children}</section>
        </div>
      </div>
    </main>
  );
}

type NavItem = (typeof staffNavItems)[number];
type ShellCopy = (typeof staffShellText)[Locale];
function DesktopNavLink({ activePath, item: { key, Icon, href }, locale, t }: { activePath: string; item: NavItem; locale: Locale; t: ShellCopy }) { const [label, description] = t.nav[key]; const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} aria-label={`${label}: ${description}`} className={`grid min-h-10 grid-cols-[1.5rem_1fr] items-center gap-2 rounded-md px-2 py-2 text-start text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-brand/10 text-brand' : 'text-content-muted hover:bg-surface-raised hover:text-content-strong'}`} href={`${href}?locale=${locale}`} title={description}><Icon aria-hidden="true" className="size-4" /><span className="truncate">{label}</span></a>; }
function MobileNavLink({ activePath, item: { key, Icon, href }, label, locale }: { activePath: string; item: NavItem; label: string; locale: Locale }) { const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} className={`grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'text-brand' : 'text-content-muted'}`} href={`${href}?locale=${locale}`}><Icon aria-hidden="true" className="size-5" /><span className="w-full truncate text-center">{label}</span></a>; }
function mobileLabel(t: ShellCopy, key: (typeof mobileKeys)[number]): string { if (key === 'queue') return t.mobileNav.cases; if (key === 'dashboard') return t.nav.dashboard[0]; return t.mobileNav[key]; }

const ROLE_LABELS: Record<Locale, Record<string, string>> = {
  en: { ADMIN: 'Administrator', CR_MANAGER: 'Customer relations manager', BRANCH_MANAGER: 'Branch manager', MGMT_READONLY: 'Management viewer', STAFF: 'Employee' },
  ar: { ADMIN: 'مسؤول النظام', CR_MANAGER: 'مدير علاقات العملاء', BRANCH_MANAGER: 'مدير الفرع', MGMT_READONLY: 'عرض الإدارة', STAFF: 'موظف' },
};

function staffIdentity(principal: StaffSessionPrincipal, locale: Locale) {
  const name = (locale === 'ar' ? principal.nameAr : principal.nameEn).trim() || principal.email;
  const branch = (locale === 'ar' ? principal.branchNameAr : principal.branchName) || staffShellText[locale].branch;
  return {
    name,
    branch,
    role: ROLE_LABELS[locale][principal.roleCode] ?? ROLE_LABELS[locale].STAFF,
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase(locale),
  };
}

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
