import React from 'react';
import { headers } from 'next/headers';
import { getMyTickets, getDepartmentTickets } from '../../../../lib/staff-internal-tickets-actions';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { MyWorkBoard } from '../my-work-board';

export default async function InternalTicketsPage({ searchParams }: { searchParams?: Promise<{ filter?: string; status?: string; locale?: string }> }) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || (requestHeaders.get('x-cms-locale') ?? undefined));
  const filter = params?.filter;
  const statusFilter = params?.status;

  const principal = await getStaffSessionPrincipal();
  const isManager = principal?.roleCode === 'BRANCH_MANAGER' || principal?.roleCode === 'DEPARTMENT_MANGER' || principal?.roleCode === 'CR_MANAGER';
  
  const myDirectTickets = await getMyTickets().then(t => t || []);
  
  let allTickets = myDirectTickets;
  
  // If the user is a manager, fetch department tickets and merge them so they can see pending approvals and new tickets
  if (isManager) {
    const deptTickets = await getDepartmentTickets(principal?.departmentId || '').catch(() => []);
    const map = new Map();
    for (const t of myDirectTickets) map.set(t.id, t);
    for (const t of deptTickets) map.set(t.id, t);
    allTickets = Array.from(map.values());
  }

  let myTasks = allTickets;

  if (filter === 'manager-inbox') {
    myTasks = myTasks.filter((t: any) => t.status === 'NEW' || t.status === 'TRANSFERRED');
  } else if (filter === 'manager-active') {
    myTasks = myTasks.filter((t: any) => !['CLOSED', 'RESOLVED', 'REJECTED', 'PENDING_APPROVAL', 'NEW'].includes(t.status));
  } else if (filter === 'manager-pending') {
    myTasks = myTasks.filter((t: any) => t.status === 'PENDING_APPROVAL');
  } else if (filter === 'manager-rating') {
    myTasks = myTasks.filter((t: any) => t.status === 'RESOLVED');
  } else {
    // Standard user view: show assigned or requested by them. Managers also see pending approvals and new tickets natively.
    myTasks = myTasks.filter((t: any) => {
      const isMine = t.assignedEmployeeId === principal?.userId || t.requestedById === principal?.userId;
      const isManagerPendingOrInbox = isManager && (t.status === 'PENDING_APPROVAL' || t.status === 'NEW' || t.status === 'TRANSFERRED');
      return isMine || isManagerPendingOrInbox;
    });

    if (filter === 'sent') {
      myTasks = myTasks.filter((t: any) => t.requestedById === principal?.userId);
    } else if (filter === 'received') {
      myTasks = myTasks.filter((t: any) => t.assignedEmployeeId === principal?.userId || (isManager && (t.status === 'PENDING_APPROVAL' || t.status === 'NEW' || t.status === 'TRANSFERRED')));
    }
  }

  const now = new Date();
  if (statusFilter === 'active') {
    myTasks = myTasks.filter((t: any) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(t.status));
  } else if (statusFilter === 'completed') {
    myTasks = myTasks.filter((t: any) => ['RESOLVED', 'CLOSED'].includes(t.status));
  } else if (statusFilter === 'on-time') {
    myTasks = myTasks.filter((t: any) => {
      if (!t.dueAt) return true; // No due date means it can't be overdue
      const dueDate = new Date(t.dueAt);
      if (['RESOLVED', 'CLOSED'].includes(t.status)) {
        const finishDate = t.resolvedAt ? new Date(t.resolvedAt) : (t.updatedAt ? new Date(t.updatedAt) : now);
        return finishDate <= dueDate;
      }
      return dueDate >= now;
    });
  } else if (statusFilter === 'overdue') {
    myTasks = myTasks.filter((t: any) => {
      if (!t.dueAt) return false;
      const dueDate = new Date(t.dueAt);
      if (['RESOLVED', 'CLOSED'].includes(t.status)) {
        const finishDate = t.resolvedAt ? new Date(t.resolvedAt) : (t.updatedAt ? new Date(t.updatedAt) : now);
        return finishDate > dueDate;
      }
      return dueDate < now;
    });
  } else if (statusFilter === 'pending') {
    myTasks = myTasks.filter((t: any) => t.status === 'PENDING_APPROVAL');
  }

  return <MyWorkBoard tickets={myTasks} propLocale={locale} />;
}
