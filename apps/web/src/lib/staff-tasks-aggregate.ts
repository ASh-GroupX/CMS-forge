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

export type WorkItemFilter = 'all' | 'ticket' | 'complaint' | 'task';

export function getTaskItemType(task: StaffTask): 'ticket' | 'complaint' | 'task' {
  if (task.id.startsWith('ticket_') || task.links?.some((l) => l.entityType?.toLowerCase() === 'internal_ticket')) {
    return 'ticket';
  }
  if (task.id.startsWith('complaint_') || task.links?.some((l) => l.entityType?.toLowerCase() === 'complaint')) {
    return 'complaint';
  }
  return 'task';
}

export function complaintToStaffTask(complaint: any): StaffTask {
  const rawStatus = String(complaint?.status || '').trim().toUpperCase();
  const isDone =
    rawStatus === 'COMPLETED' ||
    rawStatus === 'RESOLVED' ||
    rawStatus === 'CLOSED' ||
    rawStatus === 'REJECTED';

  const status: StaffTaskStatus = isDone
    ? 'DONE'
    : rawStatus === 'MANAGER_REVIEW' || rawStatus === 'BRANCH_REVIEW'
    ? 'WAITING'
    : rawStatus === 'SUBMITTED'
    ? 'OPEN'
    : 'IN_PROGRESS';

  const dueAt = complaint.slaDueAt
    ? new Date(complaint.slaDueAt).toISOString()
    : complaint.slaTargetAt
    ? new Date(complaint.slaTargetAt).toISOString()
    : new Date(complaint.createdAt).toISOString();

  return {
    id: `complaint_${complaint.id}`,
    title: complaint.referenceNumber ? `[${complaint.referenceNumber}] ${complaint.subject || 'Customer Complaint'}` : complaint.subject || 'Customer Complaint',
    ownerId: complaint.ownerId || '',
    ownerName: complaint.ownerName || null,
    assigneeId: complaint.ownerId || complaint.assignedUserId || null,
    assigneeName: complaint.ownerName || complaint.assignedUserName || null,
    assignedDepartmentId: complaint.assignedDepartmentId || complaint.departmentId || null,
    assignedDepartmentName: complaint.assignedDepartmentName || complaint.department?.nameEn || null,
    assignedDepartmentNameAr: complaint.assignedDepartmentNameAr || complaint.department?.nameAr || null,
    branchId: complaint.branchId || null,
    branchName: complaint.branchName || complaint.branch?.nameEn || null,
    displayTimeZone: complaint.displayTimeZone || 'UTC',
    dueAt,
    status,
    nextAction: complaint.nextAction
      ? { what: complaint.nextAction, whoId: complaint.ownerId || '', whoName: complaint.ownerName || '', when: dueAt }
      : null,
    isCustomerPromise: false,
    visibility: 'INTERNAL',
    confidentialityLevel: 'NORMAL',
    links: [{ entityType: 'COMPLAINT', entityId: complaint.id }],
    participantUserIds: [complaint.ownerId, complaint.createdById, complaint.backupOfficerId, complaint.collaboratorId].filter(Boolean),
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
  const isDoneComplaint = (status?: string | null) => {
    const s = String(status || '').trim().toUpperCase();
    return s === 'COMPLETED' || s === 'RESOLVED' || s === 'CLOSED' || s === 'REJECTED';
  };

  const complaintStatusMap = new Map<string, string>();
  for (const c of complaints) {
    if (c?.id && c?.status) {
      complaintStatusMap.set(String(c.id), String(c.status));
    }
  }

  const isTaskFinished = (task: StaffTask): boolean => {
    if (task.status === 'DONE') return true;
    if (task.id.startsWith('complaint_')) {
      const cId = task.id.replace('complaint_', '');
      const st = complaintStatusMap.get(cId);
      if (st && isDoneComplaint(st)) return true;
    }
    const cLink = task.links?.find((l) => l.entityType?.toLowerCase() === 'complaint');
    if (cLink) {
      const st = complaintStatusMap.get(String(cLink.entityId));
      if (st && isDoneComplaint(st)) return true;
    }
    return false;
  };

  const initialCompleted: StaffTask[] = [...(base.completed || [])];
  const completedIds = new Set(initialCompleted.map((t) => t.id));

  const filterActive = (tasks: StaffTask[] = []): StaffTask[] => {
    const active: StaffTask[] = [];
    for (const t of tasks) {
      if (isTaskFinished(t)) {
        if (!completedIds.has(t.id)) {
          completedIds.add(t.id);
          initialCompleted.push({ ...t, status: 'DONE' });
        }
      } else {
        active.push(t);
      }
    }
    return active;
  };

  const result: EmployeeTodayTasks = {
    completed: initialCompleted,
    dueToday: filterActive(base.dueToday),
    overdue: filterActive(base.overdue),
    overduePromises: [],
    assignedToMe: filterActive(base.assignedToMe),
    waitingOnMe: filterActive(base.waitingOnMe),
  };

  const seenIds = new Set<string>();
  for (const bucket of Object.values(result)) {
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
      if (!completedIds.has(task.id)) {
        completedIds.add(task.id);
        result.completed.push(task);
      }
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
    }
  }

  return result;
}
