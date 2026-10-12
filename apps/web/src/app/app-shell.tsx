import { Activity, Bell, Building2, CheckSquare2, ClipboardList, Columns3, FilePlus2, FolderCog, Gauge, GitBranch, Handshake, History, Inbox, KanbanSquare, LayoutDashboard, Menu, Search, Send, UsersRound } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { BrandMark } from '../components/brand-mark';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { modernUiText } from '../i18n/staff-modern-ui';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { StaffSessionPrincipal } from '../lib/staff-session-api';
import { StaffTopBar } from './staff-top-bar';

export const staffNavItems = [
  // ── Work ──
  { key: 'dashboard', Icon: LayoutDashboard, href: '/dashboard' },
  { key: 'internalTickets', Icon: CheckSquare2, href: '/internal-tickets' },
  { key: 'complaints', Icon: Inbox, href: '/complaints' },
  { key: 'customers', Icon: UsersRound, href: '/customers' },
  { key: 'tasks', Icon: CheckSquare2, href: '/tasks' },
  { key: 'communication', Icon: Send, href: '/communication' },
  // ── Management ──
  { key: 'reports', Icon: ClipboardList, href: '/reports' },
  { key: 'admin', Icon: FolderCog, href: '/admin' },
  { key: 'audit', Icon: History, href: '/audit' },
] as const;

export type StaffNavKey = (typeof staffNavItems)[number]['key'];
export type StaffIdentity = { branch: string; initials: string; name: string; role: string };

const desktopSections = [
  { key: 'work', items: ['dashboard', 'internalTickets', 'complaints', 'customers', 'tasks', 'communication'] },
  { key: 'administration', items: ['reports', 'admin', 'audit'] },
] as const;
const mobileKeys = ['dashboard', 'complaints', 'internalTickets', 'tasks'] as const satisfies readonly StaffNavKey[];


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
      <div className="flex min-h-screen">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen p-4 pe-0 w-[18rem] shrink-0">
          <aside className="flex h-full flex-col min-w-0 max-w-full overflow-x-hidden rounded-3xl border border-line-subtle bg-nav/70 backdrop-blur-2xl px-4 py-6 text-nav-foreground shadow-2xl shadow-brand/5 overflow-y-auto relative">
            <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
            <div className="min-w-0 px-2 pb-6 relative">
              <BrandMark label={t.title} tagline={t.subtitle} />
            </div>
            {identity ? <section className="mb-6 relative rounded-2xl border border-line-subtle/80 bg-surface/50 p-4 shadow-lg shadow-black/5 backdrop-blur-md" aria-label={identity.name}>
              <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 text-sm font-bold text-brand shadow-inner">{identity.initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-nav-foreground">{identity.name}</p><p className="truncate text-xs text-nav-muted/80">{identity.role}</p></div></div>
              <p className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs font-medium text-nav-muted/80"><Building2 aria-hidden="true" className="size-3.5" /><span className="truncate">{identity.branch}</span></p>
            </section> : null}
          <nav className="grid min-w-0 gap-3 overflow-x-hidden" aria-label={t.title}>{desktopSections.map((section) => {
            const items = visibleItems.filter((item) => (section.items as readonly string[]).includes(item.key));
            return items.length ? <section className="grid min-w-0 gap-1 border-t border-nav-border pt-3 first:border-0 first:pt-0" key={section.key}><h2 className="sr-only">{t.navSections[section.key]}</h2>{items.map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</section> : null;
          })}</nav>
          <div className="mt-auto pt-4 relative z-10 [&_button]:w-full [&_button]:rounded-xl [&_button]:border-line-subtle/80 [&_button]:bg-surface/50 [&_button]:backdrop-blur-md [&_button]:text-nav-foreground [&_button]:shadow-sm [&_button:hover]:bg-surface/80 [&_button:hover]:shadow [&_button]:transition-all">{sidebarAfter}{sidebarBefore}</div>
          </aside>
        </div>
        <div className="min-w-0 flex-1">
          <StaffTopBar account={identity ? { initials: identity.initials, name: identity.name } : null} createLabel={t.nav.create[0]} heading={heading} isRtl={locale === 'ar'} languageHref={languageHref(activePath, activeSearch, locale === 'ar' ? 'en' : 'ar')} locale={locale} notificationsHref={`/notifications?locale=${locale}`} search={modern.search} subheading={subheading} switchLabel={t.switchLabel} switchTarget={t.switchTarget} themeDark={t.theme.dark} themeLabel={t.theme.label} themeLight={t.theme.light} />
          <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-nav-border bg-nav/80 px-1 pb-[max(.25rem,env(safe-area-inset-bottom))] pt-1 text-nav-foreground shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl lg:hidden" aria-label={t.title}>
            {mobileKeys.flatMap((key) => { const item = visibleItems.find((candidate) => candidate.key === key); return item ? [<MobileNavLink activePath={activePath} item={item} key={item.key} label={mobileLabel(t, key)} locale={locale} />] : []; })}
            <Dialog><DialogTrigger asChild><button className="grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-semibold text-content-muted focus:outline-none focus:ring-2 focus:ring-brand" type="button"><Menu aria-hidden="true" className="size-5" /><span className="truncate">{t.mobileNav.more}</span></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t.mobileNav.title}</DialogTitle></DialogHeader><nav className="grid gap-1" aria-label={t.mobileNav.title}>{visibleItems.filter((item) => !(mobileKeys as readonly StaffNavKey[]).includes(item.key)).map((item) => <DesktopNavLink activePath={activePath} item={item} key={item.key} locale={locale} t={t} />)}</nav></DialogContent></Dialog>
          </nav>
          <section className="staff-workspace mx-auto grid min-w-0 max-w-[96rem] content-start gap-5 p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-8" id="staff-main">{children}</section>
        </div>
      </div>
    </main>
  );
}

type NavItem = (typeof staffNavItems)[number];
type ShellCopy = (typeof staffShellText)[Locale];
function DesktopNavLink({ activePath, item: { key, Icon, href }, locale, t }: { activePath: string; item: NavItem; locale: Locale; t: ShellCopy }) { const [label, description] = t.nav[key]; const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} aria-label={`${label}: ${description}`} className={`group relative grid min-h-[2.875rem] min-w-0 max-w-full grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-start text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'bg-brand text-primary-foreground shadow-md shadow-brand/20' : 'text-nav-muted hover:bg-nav-raised hover:text-nav-foreground'}`} href={`${href}?locale=${locale}`} title={description}><Icon aria-hidden="true" className={`relative z-10 size-[1.125rem] transition-transform duration-300 group-hover:scale-110 ${active ? 'text-primary-foreground' : 'text-nav-muted group-hover:text-brand'}`} /><span className="relative z-10 min-w-0 truncate">{label}</span></a>; }
function MobileNavLink({ activePath, item: { key, Icon, href }, label, locale }: { activePath: string; item: NavItem; label: string; locale: Locale }) { const active = isActiveNav(key, href, activePath); return <a aria-current={active ? 'page' : undefined} className={`grid min-h-11 min-w-0 place-items-center gap-1 rounded-md px-1 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand ${active ? 'text-white' : 'text-nav-muted'}`} href={`${href}?locale=${locale}`}><Icon aria-hidden="true" className={`size-5 ${active ? 'text-brand' : ''}`} /><span className="w-full truncate text-center">{label}</span></a>; }
function mobileLabel(t: ShellCopy, key: (typeof mobileKeys)[number]): string { if (key === 'dashboard') return t.nav.dashboard[0]; if (key === 'complaints') return t.mobileNav.cases; if (key === 'internalTickets') return t.nav.internalTickets[0]; if (key === 'tasks') return t.mobileNav.today; return 'Nav'; }

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
export function isActiveNav(key: StaffNavKey, href: string, activePath: string): boolean { if (!activePath) return false; if ((key as string) === 'operations') return activePath === '/operations' || activePath.startsWith('/operations/'); if (key === 'complaints') return activePath === '/complaints' || (activePath.startsWith('/complaints/') && activePath !== '/complaints/new'); return activePath === href || activePath.startsWith(`${href}/`); }
