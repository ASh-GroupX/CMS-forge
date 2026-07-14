export async function proofFetch(input) {
  const path = new URL(String(input)).pathname;
  if (path === '/auth/me') return json({ user: proofPrincipal() });
  if (path === '/notifications') return json({ items: proofNotifications() });
  if (path === '/staff/assignable') return json({ staff: proofStaff() });
  if (path === '/tasks/today') return json({
    completed: [],
    dueToday: [],
    overdue: [proofTask('task_proof_1', 'TASK-PROOF-001 Prepare customer callback', { status: 'IN_PROGRESS' })],
    overduePromises: [],
    assignedToMe: [proofTask('task_proof_2', 'TASK-PROOF-002 Confirm owner handoff', { status: 'OPEN', nextAction: null })],
    waitingOnMe: [],
  });
  if (path === '/tasks/board') return json({
    stages: [
      { id: 'stage_open', code: 'TASKS_OPEN', nameEn: 'Open', nameAr: 'مفتوحة', color: 'slate', position: 0, mappedTaskStatus: 'OPEN' },
      { id: 'stage_in_progress', code: 'TASKS_IN_PROGRESS', nameEn: 'In Progress', nameAr: 'قيد التنفيذ', color: 'blue', position: 1, mappedTaskStatus: 'IN_PROGRESS' },
      { id: 'stage_waiting', code: 'TASKS_WAITING', nameEn: 'Waiting', nameAr: 'في الانتظار', color: 'amber', position: 2, mappedTaskStatus: 'WAITING' },
      { id: 'stage_done', code: 'TASKS_DONE', nameEn: 'Done', nameAr: 'منجزة', color: 'green', position: 3, mappedTaskStatus: 'DONE' },
    ],
    columns: [
      { stageId: 'stage_open', cards: [
        proofBoardCard('task_board_1', 'BOARD-PROOF-001 Call customer about delivery date', 'stage_open', 0, { dueState: 'OVERDUE', daysActive: 5, commentCount: 2 }),
        proofBoardCard('task_board_2', 'BOARD-PROOF-002 Review warranty claim documents', 'stage_open', 1, { dueState: 'UPCOMING', daysActive: 1, commentCount: 0 }),
      ] },
      { stageId: 'stage_in_progress', cards: [
        proofBoardCard('task_board_3', 'BOARD-PROOF-003 Confirm paint shop booking', 'stage_in_progress', 0, { status: 'IN_PROGRESS', dueState: 'DUE_TODAY', daysActive: 3, commentCount: 4, isCustomerPromise: true }),
      ] },
      { stageId: 'stage_waiting', cards: [] },
      { stageId: 'stage_done', cards: [
        proofBoardCard('task_board_4', 'BOARD-PROOF-004 Close out survey follow-up', 'stage_done', 0, { status: 'DONE', dueState: null, daysActive: 8, commentCount: 1 }),
      ] },
    ],
  });
  if (path === '/tasks/manager-rollup') return json({
    overdueByEmployee: [{ assigneeId: 'usr_proof', assigneeName: 'Proof Admin', count: 2 }],
    dueToday: [proofTask('task_manager_proof', 'TASK-MANAGER-PROOF Release delivery gate')],
    overduePromises: [],
    stuck: [proofTask('task_manager_stuck', 'TASK-MANAGER-STUCK Follow up blocked case', { stuckReasons: ['NEXT_ACTION_OVERDUE'] })],
    workloadByAssignee: [{ assigneeId: 'usr_proof', assigneeName: 'Proof Admin', count: 2 }],
    escalated: [],
    promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 },
  });
  if (path === '/tasks/task_manager_proof/manager-detail') return json({ task: {
    id: 'task_manager_proof',
    title: 'TASK-MANAGER-PROOF Release delivery gate',
    ownerId: 'usr_owner',
    ownerName: 'Proof Owner',
    assigneeId: 'usr_proof',
    assigneeName: 'Proof Admin',
    branchId: 'branch_proof',
    branchName: 'Proof branch',
    displayTimeZone: 'Asia/Riyadh',
    dueAt: '2026-06-21T09:00:00.000Z',
    status: 'IN_PROGRESS',
    nextAction: { what: 'Confirm the delivery release', whoId: 'usr_proof', whoName: 'Proof Admin', when: '2026-06-21T08:30:00.000Z' },
    isCustomerPromise: false,
    links: [{ entityType: 'COMPLAINT', entityId: 'cmp-proof' }],
    stuckReasons: ['NO_MOVEMENT'],
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    capabilities: { canOpenInteractive: true },
  } });
  if (path === '/tasks/related-records') return json({ records: [{ recordType: 'CUSTOMER', recordId: 'cust_proof', label: 'Proof Customer', labelAr: 'Proof Customer AR', context: 'Main Branch', contextAr: 'Main Branch AR' }] });
  if (path === '/deals/handoff-board') return json({
    byStage: [
      { stage: 'BOOKING', count: 1, deals: [proofDeal('deal_proof_1', 'DEAL-PROOF-001 Delivery handoff', { blocker: null, delayAgeMinutes: 90 })] },
      { stage: 'PAYMENT', count: 0, deals: [] },
    ],
    stuck: [proofDeal('deal_proof_2', 'DEAL-PROOF-002 Payment blocker', { blocker: 'Finance approval missing', delayAgeMinutes: 240 })],
    currentHolder: [{ currentHolderId: 'usr_proof', currentHolderName: 'Proof Admin', count: 2 }],
  });
  if (path === '/reports/dashboard') return json({ summary: { openComplaints: 9, overdueComplaints: 2, slaWarningComplaints: 3, closedComplaints: 7, averageTatHours: 18 } });
  if (path === '/reports/kpis') return json({ kpis: proofKpis() });
  if (path === '/reports/catalog') return json({ items: [
    { id: 'RPT-001', name: 'Open complaints summary', users: 'Managers', requiredFilters: ['date', 'branch'], status: 'DELIVERED', signoffRequired: false, exportable: true, unavailableReason: null },
    { id: 'RPT-002', name: 'Overdue complaints', users: 'Managers', requiredFilters: ['branch', 'owner'], status: 'DEFERRED', signoffRequired: true, exportable: false, unavailableReason: 'Deferred pending business signoff.' },
    { id: 'RPT-017', name: 'Audit activity report', users: 'Admin', requiredFilters: ['actor', 'action'], status: 'DELIVERED', signoffRequired: false, exportable: true, unavailableReason: null },
  ] });
  if (path === '/admin/users') return json({
    users: [{ id: 'usr_proof', email: 'proof@example.test', nameEn: 'Proof Admin', nameAr: 'Proof Admin AR', roleCode: 'ADMIN', roleName: 'Admin', branchId: null, branchName: null, isActive: true }],
    roles: [{ id: 'role_admin', code: 'ADMIN', nameEn: 'Admin', nameAr: 'Admin AR' }],
    branches: [{ id: 'branch_proof', code: 'PROOF', nameEn: 'Proof branch', nameAr: 'Proof branch AR' }],
  });
  if (path === '/complaints/form-options') return json({
    branches: [{ id: 'branch_proof', code: 'PROOF', nameEn: 'Proof branch', nameAr: 'Proof branch AR' }],
    categories: [{ id: 'cat_proof', code: 'PROOF', nameEn: 'Proof category', nameAr: 'Proof category AR', parentId: null }],
    severities: ['HIGH', 'MEDIUM', 'LOW'],
  });
  if (path === '/complaints/search') return json({ items: [proofRow('CMP-PROOF-001', 'Proof queue row')] });
  if (path === '/reports') return json({ items: [proofRow('CMP-PROOF-RPT-001', 'Proof report row', { categoryId: 'cat_proof' })] });
  if (path.endsWith('/duplicate-candidates')) return json({ items: [proofRow('CMP-PROOF-DUP-001', 'Proof duplicate row')], windowDays: 30 });
  if (path.endsWith('/related')) return json({ items: [proofRow('CMP-PROOF-REL-001', 'Proof related row')] });
  if (path.startsWith('/complaints/')) return json({
    complaint: {
      ...proofRow('CMP-PROOF-DETAIL', 'Proof detail row'),
      categoryId: 'cat_proof',
      categoryName: 'Proof category',
      categoryNameAr: 'تصنيف الاختبار',
      description: 'Proof detail description.',
      incidentAt: '2026-06-19T00:00:00.000Z',
      customer: proofCustomer(),
      customerSource: 'DMS',
      manualCustomer: false,
      vehicleRelated: true,
      vehicle: proofVehicle(),
      vehicleSource: 'LOCAL',
      manualVehicle: false,
      vehicleDataUnavailableReason: null,
      statusHistory: [{ id: 'hist_1', toStatus: 'SUBMITTED', createdAt: '2026-06-19T00:00:00.000Z' }],
    },
  });
  return json({}, 404);
}

function proofRow(referenceNumber, subject, extra = {}) {
  return { id: 'proof_1', referenceNumber, status: 'IN_PROGRESS', severity: 'HIGH', subject, branchId: 'branch_proof', displayTimeZone: 'Asia/Riyadh', ownerId: 'usr_proof', createdAt: '2026-06-20T00:00:00.000Z', updatedAt: '2026-06-20T10:00:00.000Z', ...extra };
}

function proofTask(id, title, extra = {}) {
  return {
    id,
    title,
    ownerId: 'usr_proof',
    ownerName: 'Proof Admin',
    assigneeId: 'usr_proof',
    assigneeName: 'Proof Admin',
    branchId: 'branch_proof',
    branchName: 'Proof branch',
    displayTimeZone: 'Asia/Riyadh',
    dueAt: '2026-06-19T09:00:00.000Z',
    status: 'OPEN',
    nextAction: { what: 'Call customer with next step', whoId: 'usr_proof', whoName: 'Proof Admin', when: '2026-06-19T10:00:00.000Z' },
    isCustomerPromise: false,
    visibility: 'INTERNAL',
    confidentialityLevel: 'NORMAL',
    links: [{ entityType: 'CUSTOMER', entityId: 'cust_proof' }],
    participantUserIds: ['usr_proof'],
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    ...extra,
  };
}

function proofBoardCard(id, title, stageId, boardPosition, extra = {}) {
  return {
    id,
    title,
    ownerId: 'usr_proof',
    ownerName: 'Proof Owner',
    ownerNameAr: 'مالك الاختبار',
    assigneeId: 'usr_proof',
    assigneeName: 'Proof Admin',
    assigneeNameAr: 'مشرف الاختبار',
    branchId: 'branch_proof',
    dueAt: '2026-06-19T09:00:00.000Z',
    status: 'OPEN',
    stageId,
    boardPosition,
    isCustomerPromise: false,
    visibility: 'INTERNAL',
    confidentialityLevel: 'NORMAL',
    daysActive: 2,
    dueState: 'UPCOMING',
    commentCount: 0,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    ...extra,
  };
}

function proofDeal(id, title, extra = {}) {
  return {
    id,
    title,
    branchId: 'branch_proof',
    branchName: 'Proof branch',
    ownerId: 'usr_proof',
    ownerName: 'Proof Admin',
    currentHolderId: 'usr_proof',
    currentHolderName: 'Proof Admin',
    stage: 'BOOKING',
    stageDueAt: '2026-06-21T09:00:00.000Z',
    blocker: null,
    delayAgeMinutes: 120,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
    ...extra,
  };
}

function proofStaff() {
  return [
    { userId: 'usr_proof', displayName: 'Proof Admin', displayNameAr: 'Proof Admin AR', role: 'CR Officer', roleAr: 'CR Officer AR', branchLabel: 'Proof branch', branchLabelAr: 'Proof branch AR' },
  ];
}

function proofPrincipal() {
  return { sessionId: 'proof-session', userId: 'usr_proof', email: 'proof@example.test', nameEn: 'Ahmed Al-Masri', nameAr: 'أحمد المصري', roleCode: 'ADMIN', permissions: ['COMPLAINT_CREATE', 'REPORT_VIEW'], branchId: 'branch_proof', branchName: 'Cairo Branch', branchNameAr: 'فرع القاهرة', branchTimezone: 'Africa/Cairo' };
}

function proofNotifications() {
  return [
    proofNotification('1', 'Sara Khaled', 'Customer contacted and resolution date confirmed', null),
    proofNotification('2', 'Mohamed Yasser', 'Added an internal complaint note', null),
    proofNotification('3', 'Norhan Ali', 'Complaint closed and survey sent', '2026-06-20T09:00:00.000Z'),
    proofNotification('4', 'Alert system', 'New customer promise assigned', '2026-06-20T09:00:00.000Z'),
    proofNotification('5', 'Happy customer', 'Thank you for the quick response', '2026-06-20T09:00:00.000Z'),
  ];
}

function proofNotification(id, title, message, readAt) {
  return { id: `notification_${id}`, status: 'SENT', readAt, targetHref: '/notifications', templateCode: 'proof.update', queuedAt: `2026-06-20T0${id}:00:00.000Z`, payload: { title, message } };
}

function proofKpis() {
  return {
    onTimeCompletionPercent: 88,
    activeOverdueCount: 2,
    averageDelayHours: 1.5,
    customerPromiseKeptPercent: 91,
    reopenedCount: 3,
    reopenRate: 43,
    escalationCount: 5,
    slaBreachRate: 14,
    medianTatHours: 22,
    agingBuckets: { zeroToOneDays: 1, twoToThreeDays: 2, fourToSevenDays: 3, overSevenDays: 4 },
    averageFirstResponseHours: 0.75,
    averageResolutionHours: 16,
  };
}

function proofCustomer() {
  return { id: 'cust_proof', name: 'Proof Customer', phone: '+966500000099', identifier: 'CUST-PROOF', source: 'DMS' };
}

function proofVehicle() {
  return { id: 'veh_proof', vin: 'PROOFVIN00001', plate: 'PRF123', make: 'Nissan', model: 'Patrol', year: 2024, source: 'LOCAL' };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}
