// Ticket board (GET /complaints/board) proof fixture — kept in its own module so
// tools/web-proof-fixtures.mjs stays within the agentic file budget. Mirrors
// apps/api/src/modules/complaints/dto/complaint-board.dto.ts.

export function complaintBoardFixture() {
  return {
    stages: [
      { id: 'tstage_submitted', code: 'TICKETS_SUBMITTED', nameEn: 'Submitted', nameAr: 'مُرسلة', color: 'blue', position: 0, mappedComplaintStatus: 'SUBMITTED' },
      { id: 'tstage_manager', code: 'TICKETS_MANAGER_REVIEW', nameEn: 'Manager review', nameAr: 'مراجعة المدير', color: 'violet', position: 1, mappedComplaintStatus: 'MANAGER_REVIEW' },
      { id: 'tstage_branch', code: 'TICKETS_BRANCH_REVIEW', nameEn: 'Branch review', nameAr: 'مراجعة الفرع', color: 'amber', position: 2, mappedComplaintStatus: 'BRANCH_REVIEW' },
      { id: 'tstage_progress', code: 'TICKETS_IN_PROGRESS', nameEn: 'In progress', nameAr: 'قيد المعالجة', color: 'blue', position: 3, mappedComplaintStatus: 'IN_PROGRESS' },
      { id: 'tstage_resolved', code: 'TICKETS_RESOLVED', nameEn: 'Resolved', nameAr: 'تم الحل', color: 'green', position: 4, mappedComplaintStatus: 'RESOLVED' },
    ],
    columns: [
      { stageId: 'tstage_submitted', cards: [
        ticketCard('CMP-BOARD-001', 'Late delivery of spare part', 'tstage_submitted', 'SUBMITTED', { severity: 'HIGH', slaState: 'WARNING', nextAction: 'Manager intake review' }, [
          { action: 'ACCEPT_INTAKE', toStatus: 'MANAGER_REVIEW' },
          { action: 'REJECT_AS_INVALID', toStatus: 'REJECTED' },
        ]),
      ] },
      { stageId: 'tstage_manager', cards: [
        ticketCard('CMP-BOARD-002', 'Repeated billing complaint', 'tstage_manager', 'MANAGER_REVIEW', { severity: 'CRITICAL', slaState: 'BREACHED', ownerName: 'Layla Hassan', nextAction: 'Manager routing decision' }, [
          { action: 'APPROVE_AND_ROUTE', toStatus: 'BRANCH_REVIEW' },
          { action: 'SEND_BACK', toStatus: 'DRAFT' },
          { action: 'REJECT_AS_INVALID', toStatus: 'REJECTED' },
        ]),
      ] },
      { stageId: 'tstage_branch', cards: [
        ticketCard('CMP-BOARD-003', 'Paint quality dispute', 'tstage_branch', 'BRANCH_REVIEW', { severity: 'MEDIUM', slaState: 'ON_TRACK', ownerName: 'Omar Nasser', nextAction: 'Branch assignment or resolution' }, [
          { action: 'ASSIGN_INVESTIGATION', toStatus: 'IN_PROGRESS' },
          { action: 'RESOLVE_DIRECTLY', toStatus: 'RESOLVED' },
          { action: 'REJECT_AFTER_REVIEW', toStatus: 'REJECTED' },
        ]),
      ] },
      { stageId: 'tstage_progress', cards: [
        ticketCard('CMP-BOARD-004', 'Warranty claim under review', 'tstage_progress', 'IN_PROGRESS', { severity: 'LOW', slaState: 'ON_TRACK', ownerName: 'Sara Khalid', nextAction: 'Investigation update' }, [
          { action: 'ADD_INVESTIGATION_UPDATE', toStatus: 'IN_PROGRESS' },
          { action: 'RESOLVE', toStatus: 'RESOLVED' },
          { action: 'REJECT_AFTER_INVESTIGATION', toStatus: 'REJECTED' },
        ]),
      ] },
      { stageId: 'tstage_resolved', cards: [] },
    ],
  };
}

function ticketCard(referenceNumber, subject, stageId, status, extra = {}, allowedTransitions = []) {
  return {
    id: `cmp_${referenceNumber.toLowerCase().replaceAll('-', '_')}`,
    referenceNumber,
    status,
    severity: 'MEDIUM',
    subject,
    branchId: 'branch_proof',
    branchName: 'Main Branch',
    displayTimeZone: 'Asia/Riyadh',
    ownerId: null,
    ownerName: null,
    slaState: 'ON_TRACK',
    slaDueAt: '2026-06-22T09:00:00.000Z',
    slaStage: 'RESOLUTION',
    slaPercentElapsed: 40,
    nextAction: null,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    stageId,
    ...extra,
    allowedTransitions,
  };
}
