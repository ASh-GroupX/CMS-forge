import React from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Inbox, Building2, Users, Clock, Star } from 'lucide-react';
import { getDepartmentTickets, getTeamWorkload, getTicketOptions, getMyTickets } from '../../../lib/staff-internal-tickets-actions';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { internalTicketsText } from '../../../i18n/staff-internal-tickets';
import { internalTicketStatusLabel } from '../../../i18n/domain-labels';
import { resolveLocale, type Locale } from '../../../i18n/staff-shell';

const STATUS_ORDER = ['PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'];

function MiniProgressBar({ tickets, locale }: { tickets: any[]; locale: Locale }) {
  const total = tickets.length;
  if (total === 0) return null;

  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const s = t.status || 'NEW';
    counts[s] = (counts[s] || 0) + 1;
  }

  const statuses = internalTicketsText[locale]?.statuses || internalTicketsText.en.statuses;

  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-surface-raised shadow-inner mb-2" title="Workload Distribution">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] || 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        const meta = statuses[status as keyof typeof statuses] || statuses.NEW;
        return (
          <div
            key={status}
            className={`${meta.barColor} transition-all duration-500`}
            style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
            title={`${meta.label}: ${count}`}
          />
        );
      })}
    </div>
  );
}

export default async function DepartmentTicketsPage({ searchParams }: { searchParams?: Promise<{ locale?: string }> }) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || (requestHeaders.get('x-cms-locale') ?? undefined));
  const t = internalTicketsText[locale] || internalTicketsText.en;
  const isAr = locale === 'ar';

  const principal = await getStaffSessionPrincipal();
  const isAdmin = principal?.roleCode === 'ADMIN';
  const isManager = principal?.roleCode === 'BRANCH_MANAGER' || principal?.roleCode === 'DEPARTMENT_MANGER' || principal?.roleCode === 'DEPARTMENT_MANAGER' || principal?.roleCode === 'CR_MANAGER';

  // Fetch tickets for the department (or all for admin)
  const tickets = await getDepartmentTickets(isAdmin ? 'ALL' : (principal?.departmentId || '')).catch(() => []);
  const myTickets = await getMyTickets().catch(() => []);
  
  // Merge them so we have a complete picture (including source department pending approvals)
  const allTicketsMap = new Map();
  for (const ticketItem of tickets) allTicketsMap.set(ticketItem.id, ticketItem);
  for (const ticketItem of myTickets) allTicketsMap.set(ticketItem.id, ticketItem);
  const allTickets = Array.from(allTicketsMap.values());
  const team = await getTeamWorkload().catch(() => []);
  const options = await getTicketOptions().catch(() => ({ departments: [] }));
  
  // "Manager Pending Inbox" — NEW tickets that just arrived, only visible to manager
  const pendingInbox = allTickets.filter((ticketItem: any) => ticketItem.status === 'NEW' || ticketItem.status === 'TRANSFERRED');

  // "Team Tasks" — Unassigned tickets explicitly assigned to the team by the manager
  const teamTasks = tickets.filter((ticketItem: any) => !ticketItem.assignedEmployeeId && ticketItem.status !== 'CLOSED' && ticketItem.status !== 'PENDING_APPROVAL' && ticketItem.status !== 'REJECTED' && ticketItem.status !== 'NEW' && ticketItem.status !== 'TRANSFERRED');
  
  // Filter team members based on role
  // If not a manager, the user should only see themselves!
  const visibleTeam = (isAdmin || isManager) 
    ? team 
    : team.filter((member: any) => member.id === principal?.userId);

  return (
    <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{isAdmin ? t.departmentBoard.allTitle : t.departmentBoard.deptTitle}</h2>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href={`/internal-tickets/my-work?filter=manager-inbox&locale=${locale}`} className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Inbox className="size-3.5 text-indigo-500" /> {t.departmentBoard.pendingInbox}
            </div>
            <p className="text-2xl font-black text-content-strong">
              {pendingInbox.length}
            </p>
          </Link>
          <Link href={`/internal-tickets/my-work?filter=manager-active&locale=${locale}`} className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Users className="size-3.5 text-blue-500" /> {t.departmentBoard.teamActive}
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((ticketItem: any) => !['CLOSED', 'RESOLVED', 'REJECTED', 'PENDING_APPROVAL', 'NEW'].includes(ticketItem.status)).length}
            </p>
          </Link>
          <Link href={`/internal-tickets/my-work?filter=manager-pending&locale=${locale}`} className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-orange-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Clock className="size-3.5 text-orange-500" /> {t.departmentBoard.pendingApproval}
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((ticketItem: any) => ticketItem.status === 'PENDING_APPROVAL').length}
            </p>
          </Link>
          <Link href={`/internal-tickets/my-work?filter=manager-rating&locale=${locale}`} className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Star className="size-3.5 text-emerald-500" /> {t.departmentBoard.needsRating}
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((ticketItem: any) => ticketItem.status === 'RESOLVED').length}
            </p>
          </Link>
        </div>
      )}

      <div className="flex gap-6 pb-6 items-start overflow-x-auto h-full w-full">
        {/* Manager Pending Inbox — only the manager sees NEW tickets */}
        {(isManager || isAdmin) && pendingInbox.length > 0 && (
          <div className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 p-4 shadow-sm min-h-[20rem]">
            <div className="flex items-center justify-between border-b border-indigo-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-indigo-500" />
                <h3 className="font-semibold text-indigo-700 text-sm">{t.departmentBoard.pendingInbox}</h3>
              </div>
              <span className="bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingInbox.length}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {pendingInbox.map((ticketItem: any) => {
                const reqName = isAr && ticketItem.requestedBy?.nameAr ? ticketItem.requestedBy.nameAr : (ticketItem.requestedBy?.nameEn || t.card.unknown);
                return (
                  <a key={ticketItem.id} href={`/internal-tickets/${ticketItem.id}?locale=${locale}`} className="block p-3 rounded-xl border border-indigo-200 bg-surface hover:border-indigo-400 transition-colors text-start shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-content-strong truncate flex-1">{ticketItem.title}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 ms-2">{t.departmentBoard.newBadge}</span>
                    </div>
                    <p className="text-[10px] text-content-muted mt-1 truncate">{ticketItem.description}</p>
                    <p className="text-[9px] text-indigo-500 font-semibold mt-1.5">{t.card.from}: {reqName}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Tasks Column (Visible to everyone — ASSIGNED with no employee) */}
        <div className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface-canvas/50 p-4 shadow-sm min-h-[20rem]">
          <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-brand" />
              <h3 className="font-semibold text-content-strong text-sm">{t.departmentBoard.teamTasks}</h3>
            </div>
            <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-xs font-bold">{teamTasks.length}</span>
          </div>
          
          {teamTasks.length === 0 ? (
            <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl">
               <p className="text-xs text-content-muted">{t.departmentBoard.noTeamTickets}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teamTasks.map((ticketItem: any) => (
                <a key={ticketItem.id} href={`/internal-tickets/${ticketItem.id}?locale=${locale}`} className="block p-3 rounded-xl border border-line-subtle bg-surface hover:border-brand transition-colors text-start shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-content-strong truncate flex-1">{ticketItem.title}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ms-2">{internalTicketStatusLabel(locale, ticketItem.status)}</span>
                  </div>
                  <p className="text-[10px] text-content-muted mt-1 truncate">{ticketItem.description}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Columns: Departments for ADMIN, Employees for Manager/Employee */}
        {isAdmin ? (
          options.departments.map((dept: any) => {
            const deptTickets = tickets.filter((ticketItem: any) => ticketItem.targetDepartmentId === dept.id && ticketItem.status !== 'CLOSED' && ticketItem.assignedEmployeeId);
            const deptName = isAr && dept.nameAr ? dept.nameAr : dept.nameEn;
            return (
              <div key={dept.id} className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm min-h-[20rem]">
                <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
                      <Building2 className="size-3" />
                    </div>
                    <h3 className="font-semibold text-content-strong text-sm truncate max-w-[150px]">{deptName}</h3>
                  </div>
                  <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {deptTickets.length}
                  </span>
                </div>
                
                <MiniProgressBar tickets={deptTickets} locale={locale} />
                
                {deptTickets.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl mt-2">
                    <p className="text-xs text-content-muted">{isAr ? 'لا توجد مهام نشطة' : 'No active tasks'}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {deptTickets.map((ticketItem: any) => (
                      <a key={ticketItem.id} href={`/internal-tickets/${ticketItem.id}?locale=${locale}`} className="block p-3 rounded-xl border border-line-subtle bg-surface-canvas hover:border-brand transition-colors text-start shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-content-strong truncate flex-1">{ticketItem.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ms-2">{internalTicketStatusLabel(locale, ticketItem.status)}</span>
                        </div>
                        <p className="text-[10px] text-content-muted truncate">{ticketItem.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          visibleTeam.map((member: any) => {
            const memberTickets = tickets.filter((ticketItem: any) => ticketItem.assignedEmployeeId === member.id && ticketItem.status !== 'CLOSED');
            const memberName = isAr && (member.nameAr || member.name) ? (member.nameAr || member.name) : (member.nameEn || member.name || t.card.unknown);
            return (
              <div key={member.id} className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm min-h-[20rem]">
                <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold uppercase">
                      {String(memberName)[0]}
                    </div>
                    <h3 className="font-semibold text-content-strong text-sm truncate max-w-[150px]">{memberName}</h3>
                  </div>
                  <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {memberTickets.length}
                  </span>
                </div>
                
                <MiniProgressBar tickets={memberTickets} locale={locale} />
                
                {memberTickets.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl mt-2">
                    <p className="text-xs text-content-muted">{isAr ? 'لا توجد مهام نشطة' : 'No active tasks'}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {memberTickets.map((ticketItem: any) => (
                      <a key={ticketItem.id} href={`/internal-tickets/${ticketItem.id}?locale=${locale}`} className="block p-3 rounded-xl border border-line-subtle bg-surface-canvas hover:border-brand transition-colors text-start shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-content-strong truncate flex-1">{ticketItem.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ms-2">{internalTicketStatusLabel(locale, ticketItem.status)}</span>
                        </div>
                        <p className="text-[10px] text-content-muted truncate">{ticketItem.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
