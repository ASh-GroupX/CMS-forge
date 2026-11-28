import { ComplaintStatus, InternalTicketStatus } from '@prisma/client';
import type { ComplaintsAnalyticsFilter } from './reports.complaints.js';
import type { TicketsAnalyticsFilter } from './reports.tickets.js';

export type DepartmentRecordCriteria = {
  branchId?: string | null; dateFrom?: string | null; dateTo?: string | null;
  search?: string | null; status?: string | null; view?: string | null;
};

export function departmentRecordFilters(filter: DepartmentRecordCriteria): { complaints: ComplaintsAnalyticsFilter; tickets: TicketsAnalyticsFilter } {
  const view = ['active', 'resolved', 'overdue', 'unassigned', 'none'].includes(filter.view ?? '')
    ? filter.view as NonNullable<ComplaintsAnalyticsFilter['view']> : null;
  const common = { branchId: filter.branchId ?? null, dateFrom: filter.dateFrom ?? null, dateTo: filter.dateTo ?? null, search: filter.search ?? null, view };
  const complaintStatus = Object.values(ComplaintStatus).find(status => status === filter.status);
  const ticketStatus = Object.values(InternalTicketStatus).find(status => status === filter.status);
  return {
    complaints: { ...common, status: complaintStatus ?? null, view: filter.status && !complaintStatus ? 'none' : view },
    tickets: { ...common, status: ticketStatus ?? null, view: filter.status && !ticketStatus ? 'none' : view },
  };
}
