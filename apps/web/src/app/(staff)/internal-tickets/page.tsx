import React from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Inbox, Users, Clock, Star } from 'lucide-react';
import {
  getDepartmentTickets,
  getTeamWorkload,
  getTicketOptions,
  getMyTickets,
} from '../../../lib/staff-internal-tickets-actions';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { internalTicketsText } from '../../../i18n/staff-internal-tickets';
import { resolveLocale } from '../../../i18n/staff-shell';
import { DepartmentKanbanBoard } from './department-kanban-board';

export default async function DepartmentTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || (requestHeaders.get('x-cms-locale') ?? undefined));
  const t = internalTicketsText[locale] || internalTicketsText.en;
  const isAr = locale === 'ar';

  const principal = await getStaffSessionPrincipal();
  const isAdmin = principal?.roleCode === 'ADMIN';
  const isManager =
    principal?.roleCode === 'BRANCH_MANAGER' ||
    principal?.roleCode === 'DEPARTMENT_MANGER' ||
    principal?.roleCode === 'DEPARTMENT_MANAGER' ||
    principal?.roleCode === 'CR_MANAGER';

  // Fetch tickets for the department (or all for admin)
  const tickets = await getDepartmentTickets(isAdmin ? 'ALL' : principal?.departmentId || '').catch(() => []);
  const myTickets = await getMyTickets().catch(() => []);

  // Merge them for a complete picture
  const allTicketsMap = new Map();
  for (const item of tickets) allTicketsMap.set(item.id, item);
  for (const item of myTickets) allTicketsMap.set(item.id, item);
  const allTickets = Array.from(allTicketsMap.values());

  const team = await getTeamWorkload().catch(() => []);
  const options = await getTicketOptions().catch(() => ({ departments: [] }));

  const pendingInboxCount = allTickets.filter(
    (ticket: any) => ticket.status === 'NEW' || ticket.status === 'TRANSFERRED'
  ).length;

  const teamActiveCount = allTickets.filter(
    (ticket: any) =>
      !['CLOSED', 'RESOLVED', 'REJECTED', 'PENDING_APPROVAL', 'NEW'].includes(ticket.status)
  ).length;

  const pendingApprovalCount = allTickets.filter(
    (ticket: any) => ticket.status === 'PENDING_APPROVAL'
  ).length;

  const needsRatingCount = allTickets.filter(
    (ticket: any) => ticket.status === 'RESOLVED'
  ).length;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-content-strong">
            {isAdmin ? t.departmentBoard.allTitle : t.departmentBoard.deptTitle}
          </h2>
          {isManager && (
            <p className="text-xs text-content-muted mt-0.5">
              {isAr
                ? 'يمكن للمدير سحب وإفلات أي مهمة إلى عمود الموظف لإسنادها مباشرة.'
                : 'Drag and drop any task card onto an employee column to assign or reassign directly.'}
            </p>
          )}
        </div>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href={`/internal-tickets/my-work?filter=manager-inbox&locale=${locale}`}
            className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-brand/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Inbox className="size-3.5 text-brand" /> {t.departmentBoard.pendingInbox}
            </div>
            <p className="text-2xl font-black text-content-strong">{pendingInboxCount}</p>
          </Link>
          <Link
            href={`/internal-tickets/my-work?filter=manager-active&locale=${locale}`}
            className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-brand/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Users className="size-3.5 text-brand" /> {t.departmentBoard.teamActive}
            </div>
            <p className="text-2xl font-black text-content-strong">{teamActiveCount}</p>
          </Link>
          <Link
            href={`/internal-tickets/my-work?filter=manager-pending&locale=${locale}`}
            className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-status-warning/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Clock className="size-3.5 text-status-warning" /> {t.departmentBoard.pendingApproval}
            </div>
            <p className="text-2xl font-black text-content-strong">{pendingApprovalCount}</p>
          </Link>
          <Link
            href={`/internal-tickets/my-work?filter=manager-rating&locale=${locale}`}
            className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-status-success/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Star className="size-3.5 text-status-success" /> {t.departmentBoard.needsRating}
            </div>
            <p className="text-2xl font-black text-content-strong">{needsRatingCount}</p>
          </Link>
        </div>
      )}

      {/* Interactive Kanban Board with Drag and Drop */}
      <DepartmentKanbanBoard
        initialTickets={allTickets}
        team={team}
        departments={options.departments}
        isAdmin={Boolean(isAdmin)}
        isManager={Boolean(isManager)}
        locale={locale}
        principalUserId={principal?.userId}
      />
    </div>
  );
}
