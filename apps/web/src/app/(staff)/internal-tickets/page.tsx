import React from 'react';
import { getDepartmentTickets, getTeamWorkload, getTicketOptions, getMyTickets } from '../../../lib/staff-internal-tickets-actions';
import { Inbox, User, Building2, Users } from 'lucide-react';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import Link from 'next/link';

const STATUS_META: Record<string, { label: string; barColor: string; }> = {
  PENDING_APPROVAL: { label: 'Pending Approval', barColor: 'bg-orange-400' },
  NEW:              { label: 'Sent',             barColor: 'bg-blue-400' },
  ASSIGNED:         { label: 'Assigned',         barColor: 'bg-cyan-400' },
  IN_PROGRESS:      { label: 'In Progress',      barColor: 'bg-amber-400' },
  WAITING:          { label: 'Waiting',          barColor: 'bg-purple-400' },
  RESOLVED:         { label: 'Resolved',         barColor: 'bg-emerald-400' },
  CLOSED:           { label: 'Completed',        barColor: 'bg-slate-400' },
  REJECTED:         { label: 'Rejected',         barColor: 'bg-red-400' },
};

const STATUS_ORDER = ['PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'];

function getMeta(status: string) {
  return STATUS_META[status] || { label: 'Sent', barColor: 'bg-blue-400' };
}

function MiniProgressBar({ tickets }: { tickets: any[] }) {
  const total = tickets.length;
  if (total === 0) return null;

  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const s = t.status || 'NEW';
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-surface-raised shadow-inner mb-2" title="Workload Distribution">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] || 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        const meta = getMeta(status);
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

export default async function DepartmentTicketsPage() {
  const principal = await getStaffSessionPrincipal();
  const isAdmin = principal?.roleCode === 'ADMIN';
  const isManager = principal?.roleCode === 'BRANCH_MANAGER' || principal?.roleCode === 'DEPARTMENT_MANGER' || principal?.roleCode === 'DEPARTMENT_MANAGER' || principal?.roleCode === 'CR_MANAGER';

  // Fetch tickets for the department (or all for admin)
  const tickets = await getDepartmentTickets(isAdmin ? 'ALL' : (principal?.departmentId || '')).catch(() => []);
  const myTickets = await getMyTickets().catch(() => []);
  
  // Merge them so we have a complete picture (including source department pending approvals)
  const allTicketsMap = new Map();
  for (const t of tickets) allTicketsMap.set(t.id, t);
  for (const t of myTickets) allTicketsMap.set(t.id, t);
  const allTickets = Array.from(allTicketsMap.values());
  const team = await getTeamWorkload().catch(() => []);
  const options = await getTicketOptions().catch(() => ({ departments: [] }));
  
  // "Manager Pending Inbox" — NEW tickets that just arrived, only visible to manager
  const pendingInbox = allTickets.filter((t: any) => t.status === 'NEW' || t.status === 'TRANSFERRED');

  // "Team Tasks" — Unassigned tickets explicitly assigned to the team by the manager
  const teamTasks = tickets.filter((t: any) => !t.assignedEmployeeId && t.status !== 'CLOSED' && t.status !== 'PENDING_APPROVAL' && t.status !== 'REJECTED' && t.status !== 'NEW' && t.status !== 'TRANSFERRED');
  
  // Filter team members based on role
  // If not a manager, the user should only see themselves!
  const visibleTeam = (isAdmin || isManager) 
    ? team 
    : team.filter((member: any) => member.id === principal?.userId);

  return (
    <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{isAdmin ? 'All Departments Board' : 'Department Ticket Board'}</h2>
      </div>

      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/internal-tickets/my-work?filter=manager-inbox" className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Inbox className="size-3.5 text-indigo-500" /> Pending Inbox
            </div>
            <p className="text-2xl font-black text-content-strong">
              {pendingInbox.length}
            </p>
          </Link>
          <Link href="/internal-tickets/my-work?filter=manager-active" className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <Users className="size-3.5 text-blue-500" /> Team Active
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((t: any) => !['CLOSED', 'RESOLVED', 'REJECTED', 'PENDING_APPROVAL', 'NEW'].includes(t.status)).length}
            </p>
          </Link>
          <Link href="/internal-tickets/my-work?filter=manager-pending" className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-orange-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <svg className="size-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg> Pending Approval
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((t: any) => t.status === 'PENDING_APPROVAL').length}
            </p>
          </Link>
          <Link href="/internal-tickets/my-work?filter=manager-rating" className="rounded-2xl border border-line-subtle bg-surface-canvas p-4 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="absolute -right-4 -top-4 size-16 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center gap-1.5 text-content-muted font-medium text-xs uppercase tracking-wider">
              <svg className="size-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg> Needs Rating
            </div>
            <p className="text-2xl font-black text-content-strong">
              {allTickets.filter((t: any) => t.status === 'RESOLVED').length}
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
                <h3 className="font-semibold text-indigo-700 text-sm">Pending Inbox</h3>
              </div>
              <span className="bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingInbox.length}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {pendingInbox.map((t: any) => (
                <a key={t.id} href={`/internal-tickets/${t.id}`} className="block p-3 rounded-xl border border-indigo-200 bg-surface hover:border-indigo-400 transition-colors text-left shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-content-strong truncate flex-1">{t.title}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 ml-2">NEW</span>
                  </div>
                  <p className="text-[10px] text-content-muted mt-1 truncate">{t.description}</p>
                  <p className="text-[9px] text-indigo-500 font-semibold mt-1.5">From: {t.requestedBy?.nameEn || 'Unknown'}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Team Tasks Column (Visible to everyone — ASSIGNED with no employee) */}
        <div className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface-canvas/50 p-4 shadow-sm min-h-[20rem]">
          <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-brand" />
              <h3 className="font-semibold text-content-strong text-sm">Team Tasks</h3>
            </div>
            <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-xs font-bold">{teamTasks.length}</span>
          </div>
          
          {teamTasks.length === 0 ? (
            <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl">
               <p className="text-xs text-content-muted">No team tickets.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teamTasks.map((t: any) => (
                <a key={t.id} href={`/internal-tickets/${t.id}`} className="block p-3 rounded-xl border border-line-subtle bg-surface hover:border-brand transition-colors text-left shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-content-strong truncate flex-1">{t.title}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ml-2">{t.status}</span>
                  </div>
                  <p className="text-[10px] text-content-muted mt-1 truncate">{t.description}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Columns: Departments for ADMIN, Employees for Manager/Employee */}
        {isAdmin ? (
          options.departments.map((dept: any) => {
            const deptTickets = tickets.filter((t: any) => t.targetDepartmentId === dept.id && t.status !== 'CLOSED' && t.assignedEmployeeId);
            return (
              <div key={dept.id} className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm min-h-[20rem]">
                <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
                      <Building2 className="size-3" />
                    </div>
                    <h3 className="font-semibold text-content-strong text-sm truncate max-w-[150px]">{dept.nameEn}</h3>
                  </div>
                  <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {deptTickets.length}
                  </span>
                </div>
                
                <MiniProgressBar tickets={deptTickets} />
                
                {deptTickets.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl mt-2">
                    <p className="text-xs text-content-muted">No active tasks</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {deptTickets.map((t: any) => (
                      <a key={t.id} href={`/internal-tickets/${t.id}`} className="block p-3 rounded-xl border border-line-subtle bg-surface-canvas hover:border-brand transition-colors text-left shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-content-strong truncate flex-1">{t.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ml-2">{t.status}</span>
                        </div>
                        <p className="text-[10px] text-content-muted truncate">{t.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          visibleTeam.map((member: any) => {
            const memberTickets = tickets.filter((t: any) => t.assignedEmployeeId === member.id && t.status !== 'CLOSED');
            return (
              <div key={member.id} className="flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm min-h-[20rem]">
                <div className="flex items-center justify-between border-b border-line-subtle pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold uppercase">
                      {String(member.name || member.nameEn || member.nameAr || '?')[0]}
                    </div>
                    <h3 className="font-semibold text-content-strong text-sm truncate max-w-[150px]">{member.name || member.nameEn || member.nameAr || 'Unknown'}</h3>
                  </div>
                  <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {memberTickets.length}
                  </span>
                </div>
                
                <MiniProgressBar tickets={memberTickets} />
                
                {memberTickets.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-line-subtle rounded-xl mt-2">
                    <p className="text-xs text-content-muted">No active tasks</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {memberTickets.map((t: any) => (
                      <a key={t.id} href={`/internal-tickets/${t.id}`} className="block p-3 rounded-xl border border-line-subtle bg-surface-canvas hover:border-brand transition-colors text-left shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-content-strong truncate flex-1">{t.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised ml-2">{t.status}</span>
                        </div>
                        <p className="text-[10px] text-content-muted truncate">{t.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
