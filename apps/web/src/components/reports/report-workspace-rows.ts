import type { ComplaintsAnalyticsResponse, TicketsAnalyticsResponse, ComplaintRecordRow, TicketRecordRow } from '../../lib/staff-reports-analytics-api';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type { RecordTypeFilter } from './unified-filter-bar';

export function departmentWorkload(row: DepartmentPerformanceRow, type: RecordTypeFilter) {
  const tickets = type !== 'complaints';
  const complaints = type !== 'tickets';
  return {
    total: (tickets ? row.ticketsTargeted : 0) + (complaints ? row.complaintsTotal : 0),
    open: (tickets ? row.ticketsOpen : 0) + (complaints ? row.complaintsOpen : 0),
    resolved: (tickets ? row.ticketsResolved : 0) + (complaints ? row.complaintsResolved : 0),
    overdue: (tickets ? row.ticketsOverdue : 0) + (complaints ? row.complaintsOverdue : 0),
  };
}

export function officerWorkload(complaints: ComplaintsAnalyticsResponse | null, tickets: TicketsAnalyticsResponse | null, type: RecordTypeFilter) {
  const rows = new Map<string, { id: string; nameEn: string; nameAr: string; open: number; resolved: number; overdue: number }>();
  const source = [
    ...(type === 'tickets' ? [] : (complaints?.officers ?? []).map(row => ({ ...row, id: row.officerId }))),
    ...(type === 'complaints' ? [] : (tickets?.officers ?? []).map(row => ({ ...row, id: row.employeeId }))),
  ];
  for (const officer of source) {
    const row = rows.get(officer.id) ?? { id: officer.id, nameEn: officer.nameEn, nameAr: officer.nameAr, open: 0, resolved: 0, overdue: 0 };
    row.open += officer.activeWorkload;
    row.resolved += officer.resolved;
    row.overdue += officer.overdue;
    rows.set(officer.id, row);
  }
  return [...rows.values()].sort((a, b) => b.open - a.open || a.nameEn.localeCompare(b.nameEn));
}

export type DetailRow = { id: string; kind: 'ticket' | 'complaint'; reference: string; title: string; status: string; urgency: string; person: string; phone: string | null; creator: string | null; accepted: string | null; owner: string; source: string | null; department: string; created: string; due: string | null; firstResponse: string | null; resolved: string | null; closed: string | null; overdue: boolean };
export function detailRows(complaints: ComplaintRecordRow[], tickets: TicketRecordRow[]): DetailRow[] {
  return [
    ...complaints.map((row): DetailRow => ({ id: row.id, kind: 'complaint', reference: row.referenceNumber, title: row.subject, status: row.status, urgency: row.severity, person: row.customerName, phone: row.customerPhone, creator: row.createdByName, accepted: row.acceptedByName, owner: row.ownerName, source: null, department: row.departmentName, created: row.createdAt, due: null, firstResponse: row.firstResponseAt, resolved: row.resolvedAt, closed: row.closedAt, overdue: row.isOverdue })),
    ...tickets.map((row): DetailRow => ({ id: row.id, kind: 'ticket', reference: row.referenceNumber, title: row.title, status: row.status, urgency: row.priority, person: row.requestedByName, phone: null, creator: row.requestedByName, accepted: row.acceptedByName, owner: row.assignedEmployeeName, source: row.creatingDepartmentName, department: row.targetDepartmentName, created: row.createdAt, due: row.dueAt, firstResponse: null, resolved: row.resolvedAt, closed: row.closedAt, overdue: row.isOverdue })),
  ].sort((a, b) => b.created.localeCompare(a.created) || a.id.localeCompare(b.id));
}
