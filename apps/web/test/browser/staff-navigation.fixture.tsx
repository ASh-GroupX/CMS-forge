import React from 'react';
import Link from 'next/link';
import { hydrateRoot } from 'react-dom/client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CreateInternalTicketForm from '../../src/app/(staff)/internal-tickets/new/client-form';
import { TicketNoteForm } from '../../src/app/(staff)/internal-tickets/[id]/ticket-note-form';
import { StaffPageNavigation } from '../../src/components/shared/staff-page-navigation';
import { StaffNavAnchor } from '../../src/components/shared/staff-nav-anchor';
import { StaffNavigationScope, useStaffUiState } from '../../src/lib/use-staff-ui-state';
import { staffDetailBackHref } from '../../src/lib/staff-report-navigation';
import { staffNavigationText } from '../../src/i18n/staff-navigation';
import { reportsAnalyticsI18n } from '../../src/i18n/staff-reports-analytics';

function ReportFilters({ locale }: { locale: 'en' | 'ar' }) {
  const [query, setQuery] = useStaffUiState('search', '');
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return <section data-view-ready={ready}><label>Report search<input aria-label="Report search" value={query} onChange={event => setQuery(event.target.value)} /></label><Link href={`/internal-tickets/existing?returnTo=reports&locale=${locale}`}>Review report ticket</Link></section>;
}
export function StaffNavigationFixture({ locale = 'en', owner = 'staff-1' }: { locale?: 'en' | 'ar'; owner?: string }) {
  const pathname = usePathname() ?? '/internal-tickets/new';
  const router = useRouter();
  const returnTo = useSearchParams()?.get('returnTo') ?? 'new-ticket';
  const t = staffNavigationText[locale];
  if (pathname === '/signed-out') return <main><h1>Signed out</h1></main>;
  return <StaffNavigationScope owner={owner}><main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-4 p-4">
    <div className="flex gap-3">{[['/internal-tickets', 'Tickets'], ['/reports', 'Reports'], ['/admin', 'Admin']].map(([href, label]) => <StaffNavAnchor key={href} href={`${href}?locale=${locale}`} rootHref={href!} navKey={label!} activePath={pathname} className="p-2" activeClassName="bg-brand text-primary-foreground" inactiveClassName="text-muted-foreground">{label}</StaffNavAnchor>)}</div>
    <StaffPageNavigation owner={owner} locale={locale} />
    <form data-staff-logout onSubmit={event => { event.preventDefault(); router.push(`/signed-out?locale=${locale}`); }}><button type="submit">Log out</button></form>
    {pathname === '/internal-tickets/new' ? <CreateInternalTicketForm locale={locale} draftOwner={owner} options={{
      departments: [{ id: 'dept-1', nameEn: 'Service', nameAr: 'الصيانة' }, { id: 'dept-2', nameEn: 'Sales', nameAr: 'المبيعات' }],
      categories: [{ id: 'category-1', nameEn: 'Customer problem' }], employees: [{ id: 'employee-1', departmentId: 'dept-1', nameEn: 'Employee One' }],
    }} /> : pathname === '/internal-tickets/existing' ? <section className="space-y-4 rounded-xl border p-5">
      <h1>Existing ticket</h1><Link data-preserve-client-navigation href={staffDetailBackHref(returnTo, locale, 'tickets')}>{returnTo === 'new-ticket' ? t.backToDraft : reportsAnalyticsI18n[locale].statusBoard.backToReports}</Link><TicketNoteForm ticketId="existing" />
    </section> : pathname === '/reports' ? <ReportFilters locale={locale} /> : pathname === '/admin' ? <section><h1>Admin settings</h1><form><label>Admin label<input aria-label="Admin label" /></label></form><a href={`/reports?locale=${locale}`}>Go to reports</a></section> : <section><h1>Ticket queue</h1><Link data-preserve-client-navigation href={`/internal-tickets/new?locale=${locale}`}>Create another ticket</Link></section>}
  </main></StaffNavigationScope>;
}
if (typeof document !== 'undefined') {
  const root = document.getElementById('root')!;
  hydrateRoot(root, <StaffNavigationFixture locale={root.dataset.locale === 'ar' ? 'ar' : 'en'} owner={decodeURIComponent(root.dataset.owner!)} />);
}
