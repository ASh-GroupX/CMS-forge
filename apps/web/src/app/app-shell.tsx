import { Bell, Building2, CheckSquare2, ClipboardList, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, Menu, Search, Send, ShieldCheck, UsersRound } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { modernUiText } from '../i18n/staff-modern-ui';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { StaffSessionPrincipal } from '../lib/staff-session-api';
import { StaffTopBar } from './staff-top-bar';

export const staffNavItems = [
  { key: 'dashboard', Icon: Gauge, href: '/dashboard' },
  { key: 'today', Icon: CheckSquare2, href: '/tasks/today' },
  { key: 'sent', Icon: Send, href: '/tasks/sent' },
  { key: 'notifications', Icon: Bell, href: '/notifications' },
  { key: 'queue', Icon: Inbox, href: '/complaints' },
  { key: 'manager', Icon: UsersRound, href: '/tasks/manager' },
  { key: 'reports', Icon: ClipboardList, href: '/reports' },
  { key: 'promises', Icon: Handshake, href: '/tasks/promises' },
  { key: 'handoff', Icon: GitBranch, href: '/deals/handoff' },
  { key: 'create', Icon: FilePlus2, href: '/complaints/new' },
  { key: 'detail', Icon: Search, href: '/complaints' },
  { key: 'groups', Icon: UsersRound, href: '/communication-groups' },
  { key: 'admin', Icon: FolderCog, href: '/admin' },
  { key: 'audit', Icon: History, href: '/audit' },
] as const;

export type StaffNavKey = (typeof staffNavItems)[number]['key'];
export type StaffIdentity = { branch: string; initials: string; name: string; role: string };

const desktopSections = [
  { key: 'work', items: ['dashboard', 'today', 'sent', 'notifications'] },
  { key: 'complaints', items: ['queue', 'manager', 'reports', 'promises', 'handoff', 'create'] },
  { key: 'administration', items: ['groups', 'admin', 'audit'] },
] as const;
const mobileKeys = ['dashboard', 'today', 'queue', 'notifications'] as const satisfies readonly StaffNavKey[];

export function AppShell({ activePath = '', activeSearch = '', children, locale, navKeys, principal, sidebarAfter, sidebarBefore }: {
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
  const modern = modernUiText[locale];
  const visibleItems = staffNavItems.filter(({ key }) => navKeys.includes(key));
  const identity = principal ? staffIdentity(principal, locale) : null;
  const dashboard = activePath === '/dashboard';
  const heading = dashboard ? greetingFor(principal, locale, identity?.name ?? t.auth.signedIn) : t.title;
  const subheading = dashboard && identity ? `${identity.role} • ${identity.branch}` : t.subtitle;

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-surface-canvas text-content-strong">
      <a className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:ring-2 focus:ring-brand" href="#staff-main">{t.skipToMain}</a>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden border-e border-line-subtle bg-surface px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 px-2 pb-5">
            <span className="grid size-11 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm"><ShieldCheck aria-hidden="true" className="size-7" /></span>
            <div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight">{t.title}</h1><p className="truncate text-xs text-content-muted">{t.subtitle}</p></div>
          </div>
          {identity ? <section className="mb-5 rounded-xl border border-line-subtle bg-surface-raised p-3 shadow-sm" aria-label={identity.name}>
            <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/5 text-sm font-bold text-brand">{identity.initials}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{identity.name}</p><p className="truncate text-xs text-content-muted">{identity.role}</p></div></div>
            <p className="mt-3 flex items-center gap-2 border-t border-line-subtle pt-3 text-xs text-content-muted"><Building2 aria-hidden="true" className="size-4" /><span className="truncate">{identity.branch}</span></p>
          </section> : null}
          <nav className="grid gap-3" aria-label={t.title}>{desktopSections.map((section) => {
            const items = visibleItems.filter((item) => (section.items as readonly string[]).includes(item.key));
            return items.length ? <section className="grid gap-1 border-t border-line-subtle pt-3 first:border-0 first:pt-0" key={section.key}><h2 className="sr-only">{t.navSections[section.key]}</h2>{items.map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</section> : null;
          })}</nav>
          <div className="mt-auto border-t border-line-subtle pt-4">{sidebarAfter}{sidebarBefore}</div>
        </aside>
        <div className="min-w-0">
          <StaffTopBar account={identity ? { initials: identity.initials, name: identity.name } : null} heading={heading} isRtl={locale === 'ar'} languageHref={languageHref(activePath, activeSearch, locale === 'ar' ? 'en' : 'ar')} locale={locale} notificationsHref={`/notifications?locale=${locale}`} search={modern.search} subheading={subheading} switchLabel={t.switchLabel} switchTarget={t.switchTarget} themeDark={t.theme.dark} themeLabel={t.theme.label} themeLight={t.theme.light} />
          <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line-subtle bg-surface/95 px-1 pb-[max(.25rem,env(safe-area-inset-bottom))] pt-1 shadow-lg backdrop-blur lg:hidden" aria-label={t.title}>
            {mobileKeys.flatMap((key) => { const item = visibleItems.find((candidate) => candidate.key === key); return item ? [<MobileNavLink activePath={activePath} item={item} key={item.key} label={mobileLabel(t, key)} locale={locale} />] : []; })}
            <Dialog><DialogTrigger asChild><button className="grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-semibold text-content-muted focus:outline-none focus:ring-2 focus:ring-brand" type="button"><Menu aria-hidden="true" className="size-5" /><span className="truncate">{t.mobileNav.more}</span></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t.mobileNav.title}</DialogTitle></DialogHeader><nav className="grid gap-1" aria-label={t.mobileNav.title}>{visibleItems.filter((item) => !(mobileKeys as readonly StaffNavKey[]).includes(item.key)).map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</nav></DialogContent></Dialog>
          </nav>
          <section className="staff-workspace mx-auto grid min-w-0 max-w-[96rem] content-start gap-4 p-3 pb-24 md:p-5 md:pb-24 lg:p-6 lg:pb-6" id="staff-main">{children}</section>
        </div>
      </div>
    </main>
  );
}

type NavItem = (typeof staffNavItems)[number];
type ShellCopy = (typeof staffShellText)[Locale];
function DesktopNavLink({ activePath, item: { key, Icon, href }, locale, t }: { activePath: string; item: NavItem; locale: Locale; t: ShellCopy }) { const [label, description] = t.nav[key]; const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} aria-label={`${label}: ${description}`} className={`grid min-h-12 grid-cols-[1.5rem_1fr] items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-brand text-brand-foreground shadow-sm' : 'text-content-muted hover:bg-surface-raised hover:text-content-strong'}`} href={`${href}?locale=${locale}`} title={description}><Icon aria-hidden="true" className="size-5" /><span className="truncate">{label}</span></a>; }
function MobileNavLink({ activePath, item: { key, Icon, href }, label, locale }: { activePath: string; item: NavItem; label: string; locale: Locale }) { const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} className={`grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'text-brand' : 'text-content-muted'}`} href={`${href}?locale=${locale}`}><Icon aria-hidden="true" className="size-5" /><span className="w-full truncate text-center">{label}</span></a>; }
function mobileLabel(t: ShellCopy, key: (typeof mobileKeys)[number]): string { if (key === 'queue') return t.mobileNav.cases; if (key === 'dashboard') return t.nav.dashboard[0]; return t.mobileNav[key]; }

const ROLE_LABELS: Record<Locale, Record<string, string>> = {
  en: { ADMIN: 'Administrator', CR_MANAGER: 'Customer relations manager', BRANCH_MANAGER: 'Branch manager', MGMT_READONLY: 'Management viewer', STAFF: 'Employee' },
  ar: { ADMIN: 'مسؤول النظام', CR_MANAGER: 'مدير علاقات العملاء', BRANCH_MANAGER: 'مدير الفرع', MGMT_READONLY: 'عرض الإدارة', STAFF: 'موظف' },
};

export function staffIdentity(principal: StaffSessionPrincipal, locale: Locale): StaffIdentity {
  const name = (locale === 'ar' ? principal.nameAr : principal.nameEn).trim() || principal.email;
  const roleLabels = ROLE_LABELS[locale];
  return { name, branch: (locale === 'ar' ? principal.branchNameAr : principal.branchName) || staffShellText[locale].branch, role: roleLabels[principal.roleCode] ?? roleLabels.STAFF!, initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase(locale) };
}

function greetingFor(principal: StaffSessionPrincipal | null, locale: Locale, name: string): string {
  const greetings = modernUiText[locale].dashboard.greetings;
  if (!principal) return greetings.hello.replace('{name}', name);
  const hour = Number(new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23', timeZone: principal.branchTimezone ?? 'UTC' }).format(new Date()));
  return (hour < 12 ? greetings.morning : hour < 18 ? greetings.afternoon : greetings.evening).replace('{name}', name);
}

function languageHref(pathname: string, search: string, locale: Locale): string { const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search); params.set('locale', locale); const query = params.toString(); return `${pathname || '/'}${query ? `?${query}` : ''}`; }
export function isActiveNav(key: StaffNavKey, href: string, activePath: string): boolean { if (!activePath) return false; if (key === 'create') return activePath === '/complaints/new'; if (key === 'detail') return false; if (key === 'queue') return activePath === '/complaints' || (activePath.startsWith('/complaints/') && activePath !== '/complaints/new'); return activePath === href || activePath.startsWith(`${href}/`); }
