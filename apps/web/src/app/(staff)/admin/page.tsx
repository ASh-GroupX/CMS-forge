import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { adminHubText } from '../../../i18n/staff-admin-hub';
import { resolveLocale, staffShellText } from '../../../i18n/staff-shell';
import { canAccessAdminSection } from '../../../lib/staff-nav-rules';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';

type SearchParams = { locale?: string | string[] };

const WORKSPACE_SECTION_KEYS: Record<string, string> = {
  users: 'admin:users',
  roles: 'admin:roles',
  branches: 'admin:branches',
  categories: 'admin:categories',
  sla: 'admin:sla',
  templates: 'admin:notification-templates',
  standardProblems: 'admin:standard-problems',
  complaintTemplates: 'admin:complaint-templates',
  ticketSettings: 'admin:ticket-settings',
  internalTickets: 'admin:internal-tickets',
  complaintSettings: 'admin:complaint-settings',
  bookingSettings: 'admin:booking-settings',
};

export default async function AdminPage({
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const t = adminHubText[locale];
  const shell = staffShellText[locale];
  const principal = await getStaffSessionPrincipal();

  const workspaces = [
    ['users', '/admin/users'],
    ['roles', '/admin/roles'],
    ['branches', '/admin/branches'],
    ['categories', '/admin/categories'],
    ['sla', '/admin/sla'],
    ['templates', '/admin/notification-templates'],
    ['standardProblems', '/admin/standard-problems'],
    ['complaintTemplates', '/admin/complaint-templates'],
    ['ticketSettings', '/admin/ticket-settings'],
    ['internalTickets', '/admin/internal-tickets'],
    ['complaintSettings', '/admin/complaint-settings'],
    ['bookingSettings', '/admin/booking-settings'],
  ] as const;

  const allowedWorkspaces = workspaces.filter(([key]) => {
    if (!principal) return true;
    const sectionKey = WORKSPACE_SECTION_KEYS[key] ?? `admin:${key}`;
    return canAccessAdminSection(
      sectionKey,
      principal.allowedNavKeys,
      principal.permissions,
      principal.roleCode,
    );
  });

  return (
    <section aria-label={t.title} className="grid gap-4" dir={shell.dir}>
      <div className="rounded-md border border-line-subtle bg-surface p-4">
        <h1 className="text-lg font-semibold tracking-normal text-content-strong">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-content-muted">{t.subtitle}</p>
      </div>

      {allowedWorkspaces.length === 0 ? (
        <div className="rounded-md border border-line-subtle bg-surface p-8 text-center text-sm text-content-muted">
          {locale === 'ar'
            ? 'لا توجد مساحات إدارية مخصصة لحسابك حالياً. يرجى التواصل مع مسؤول النظام.'
            : 'No administrative workspaces are currently assigned to your account. Please contact an administrator.'}
        </div>
      ) : (
        <div aria-label={t.workspacesLabel} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="list">
          {allowedWorkspaces.map(([key, href]) => {
            const [title, description] = t.workspaces[key];
            return (
              <Card className="rounded-md border-line-subtle bg-surface shadow-sm" key={key} role="listitem">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base tracking-normal">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button asChild className="focus:ring-2 focus:ring-ring" size="sm" variant="outline">
                    <a aria-label={`${t.open}: ${title}`} href={`${href}?locale=${locale}`}>{t.open}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
