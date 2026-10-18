import type { EmployeeTodayTasks, StaffTask, StaffTaskStatus } from './staff-tasks-api';

export function ticketToStaffTask(ticket: any): StaffTask {
  const status: StaffTaskStatus =
    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
      ? 'DONE'
      : ticket.status === 'WAITING' || ticket.status === 'PENDING_APPROVAL'
      ? 'WAITING'
      : ticket.status === 'NEW' || ticket.status === 'REJECTED'
      ? 'OPEN'
      : 'IN_PROGRESS';

  const dueAt = ticket.dueAt ? new Date(ticket.dueAt).toISOString() : new Date(ticket.createdAt).toISOString();

  return {
    id: `ticket_${ticket.id}`,
    title: ticket.ticketNumber ? `[${ticket.ticketNumber}] ${ticket.title}` : ticket.title,
    ownerId: ticket.requestedById || '',
    ownerName: ticket.requestedBy?.name || ticket.requestedBy?.nameEn || null,
    assigneeId: ticket.assignedEmployeeId || null,
    assigneeName: ticket.assignedEmployee?.name || ticket.assignedEmployee?.nameEn || null,
    assignedDepartmentId: ticket.targetDepartmentId || null,
    assignedDepartmentName: ticket.targetDepartment?.nameEn || ticket.targetDepartment?.name || null,
    assignedDepartmentNameAr: ticket.targetDepartment?.nameAr || null,
    branchId: null,
    branchName: null,
    displayTimeZone: 'UTC',
    dueAt,
    status,
    nextAction: ticket.status === 'PENDING_APPROVAL'
      ? { what: 'Approval required', whoId: ticket.requestedBy?.departmentId || '', whoName: 'Manager', when: ticket.updatedAt || dueAt }
      : null,
    isCustomerPromise: false,
    visibility: 'INTERNAL',
    confidentialityLevel: 'NORMAL',
    links: [{ entityType: 'INTERNAL_TICKET', entityId: ticket.id }],
    participantUserIds: [ticket.requestedById, ...(ticket.assignedEmployeeId ? [ticket.assignedEmployeeId] : [])].filter(Boolean),
    createdAt: new Date(ticket.createdAt).toISOString(),
    updatedAt: new Date(ticket.updatedAt || ticket.createdAt).toISOString(),
  };
}

export function complaintToStaffTask(complaint: any): StaffTask {
  const status: StaffTaskStatus =
    complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
      ? 'DONE'
      : complaint.status === 'MANAGER_REVIEW' || complaint.status === 'BRANCH_REVIEW'
      ? 'WAITING'
      : complaint.status === 'SUBMITTED'
      ? 'OPEN'
      : 'IN_PROGRESS';

  const dueAt = complaint.slaTargetAt ? new Date(complaint.slaTargetAt).toISOString() : new Date(complaint.createdAt).toISOString();

  return {
    id: `complaint_${complaint.id}`,
    title: complaint.referenceNumber ? `[${complaint.referenceNumber}] ${complaint.subject || 'Customer Complaint'}` : complaint.subject || 'Customer Complaint',
    ownerId: complaint.ownerId || '',
    ownerName: complaint.ownerName || null,
    assigneeId: complaint.assignedUserId || null,
    assigneeName: complaint.assignedUserName || null,
    assignedDepartmentId: complaint.assignedDepartmentId || null,
    assignedDepartmentName: complaint.assignedDepartmentName || null,
    assignedDepartmentNameAr: complaint.assignedDepartmentNameAr || null,
    branchId: complaint.branchId || null,
    branchName: complaint.branchName || null,
    displayTimeZone: 'UTC',
    dueAt,
    status,
    nextAction: null,
    isCustomerPromise: true,
    visibility: 'INTERNAL',
    confidentialityLevel: 'NORMAL',
    links: [{ entityType: 'COMPLAINT', entityId: complaint.id }],
    participantUserIds: [complaint.assignedUserId, complaint.ownerId].filter(Boolean),
    createdAt: new Date(complaint.createdAt).toISOString(),
    updatedAt: new Date(complaint.updatedAt || complaint.createdAt).toISOString(),
  };
}

export function mergeWorkItems(
  base: EmployeeTodayTasks,
  tickets: any[],
  complaints: any[],
  now: Date = new Date(),
): EmployeeTodayTasks {
  const result: EmployeeTodayTasks = {
    completed: [...(base.completed || [])],
    dueToday: [...(base.dueToday || [])],
    overdue: [...(base.overdue || [])],
    overduePromises: [...(base.overduePromises || [])],
    assignedToMe: [...(base.assignedToMe || [])],
    waitingOnMe: [...(base.waitingOnMe || [])],
  };

  const seenIds = new Set<string>();
  for (const bucket of Object.values(base)) {
    for (const t of bucket) {
      seenIds.add(t.id);
      const link = t.links?.find((l) => l.entityType === 'INTERNAL_TICKET' || l.entityType === 'COMPLAINT');
      if (link) seenIds.add(link.entityId);
    }
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const extraTasks: StaffTask[] = [];

  for (const ticket of tickets) {
    if (!ticket?.id || seenIds.has(ticket.id) || seenIds.has(`ticket_${ticket.id}`)) continue;
    seenIds.add(ticket.id);
    extraTasks.push(ticketToStaffTask(ticket));
  }

  for (const complaint of complaints) {
    if (!complaint?.id || seenIds.has(complaint.id) || seenIds.has(`complaint_${complaint.id}`)) continue;
    seenIds.add(complaint.id);
    extraTasks.push(complaintToStaffTask(complaint));
  }

  for (const task of extraTasks) {
    const isDone = task.status === 'DONE';
    const dueTime = new Date(task.dueAt).getTime();
    const isOverdue = !isDone && dueTime < startOfToday.getTime();
    const isDueToday = !isDone && dueTime >= startOfToday.getTime() && dueTime <= endOfToday.getTime();

    if (isDone) {
      result.completed.push(task);
    } else {
      if (isOverdue) {
        result.overdue.push(task);
      }
      if (isDueToday) {
        result.dueToday.push(task);
      }
      if (task.status === 'WAITING') {
        result.waitingOnMe.push(task);
      } else {
        result.assignedToMe.push(task);
      }
      if (task.isCustomerPromise && isOverdue) {
        result.overduePromises.push(task);
      }
    }
  }

  return result;
}
