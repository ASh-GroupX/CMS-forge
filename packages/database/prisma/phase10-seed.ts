import {
  CaseConfidentialityLevel,
  CaseLifecycleStatus,
  CaseLinkEntityType,
  CaseParticipantRole,
  CaseType,
  ComplaintStatus,
  DealStage,
  PrismaClient,
  TaskConfidentialityLevel,
  TaskLinkEntityType,
  TaskParticipantRole,
  TaskStatus,
  TaskVisibility,
} from '@prisma/client';

type SeedRef = { id: string };

type Phase10SeedRefs = {
  mainBranch: SeedRef;
  northBranch: SeedRef;
  adminUser: SeedRef;
  crManager: SeedRef;
  officerMain: SeedRef;
  branchMgrNorth: SeedRef;
  customerA: SeedRef;
  complaint1: SeedRef;
};

export async function seedPhase10DealershipDemo(prisma: PrismaClient, refs: Phase10SeedRefs): Promise<void> {
  const [dealActive] = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'seed_deal_active' },
      update: {
        currentHolderId: refs.officerMain.id,
        stage: DealStage.QUOTE,
        stageDueAt: new Date('2026-06-21T09:00:00.000Z'),
        blocker: null,
      },
      create: {
        id: 'seed_deal_active',
        title: 'Camry delivery handoff',
        branchId: refs.mainBranch.id,
        ownerId: refs.crManager.id,
        currentHolderId: refs.officerMain.id,
        stage: DealStage.QUOTE,
        stageDueAt: new Date('2026-06-21T09:00:00.000Z'),
      },
    }),
    prisma.deal.upsert({
      where: { id: 'seed_deal_stuck' },
      update: {
        currentHolderId: refs.branchMgrNorth.id,
        stage: DealStage.QUALIFIED,
        stageDueAt: new Date('2026-06-18T09:00:00.000Z'),
        blocker: 'Finance approval missing',
      },
      create: {
        id: 'seed_deal_stuck',
        title: 'Sonata finance handoff',
        branchId: refs.northBranch.id,
        ownerId: refs.branchMgrNorth.id,
        currentHolderId: refs.branchMgrNorth.id,
        stage: DealStage.QUALIFIED,
        stageDueAt: new Date('2026-06-18T09:00:00.000Z'),
        blocker: 'Finance approval missing',
      },
    }),
  ]);

  await Promise.all([
    prisma.task.upsert({
      where: { id: 'seed_task_overdue_promise' },
      update: { dueAt: new Date('2026-06-18T09:00:00.000Z'), status: TaskStatus.OPEN, isCustomerPromise: true },
      create: {
        id: 'seed_task_overdue_promise',
        title: 'Call customer with delivery update',
        ownerId: refs.crManager.id,
        assigneeId: refs.officerMain.id,
        dueAt: new Date('2026-06-18T09:00:00.000Z'),
        status: TaskStatus.OPEN,
        nextActionWhat: 'Call customer with delivery update',
        nextActionWhoId: refs.officerMain.id,
        nextActionWhen: new Date('2026-06-18T08:30:00.000Z'),
        isCustomerPromise: true,
        visibility: TaskVisibility.PARTICIPANTS,
        confidentialityLevel: TaskConfidentialityLevel.NORMAL,
      },
    }),
    prisma.task.upsert({
      where: { id: 'seed_task_internal_confidential' },
      update: { dueAt: new Date('2026-06-19T09:00:00.000Z'), status: TaskStatus.OPEN, confidentialityLevel: TaskConfidentialityLevel.CONFIDENTIAL },
      create: {
        id: 'seed_task_internal_confidential',
        title: 'Prepare HR grievance interview',
        ownerId: refs.adminUser.id,
        assigneeId: refs.crManager.id,
        dueAt: new Date('2026-06-19T09:00:00.000Z'),
        status: TaskStatus.OPEN,
        nextActionWhat: 'Prepare HR grievance interview',
        nextActionWhoId: refs.crManager.id,
        nextActionWhen: new Date('2026-06-19T08:30:00.000Z'),
        visibility: TaskVisibility.PARTICIPANTS,
        confidentialityLevel: TaskConfidentialityLevel.CONFIDENTIAL,
      },
    }),
  ]);

  await prisma.taskLink.deleteMany({ where: { taskId: { in: seedTaskIds } } });
  await prisma.taskParticipant.deleteMany({ where: { taskId: { in: seedTaskIds } } });
  await prisma.taskLink.createMany({ data: taskLinks(refs, dealActive.id) });
  await prisma.taskParticipant.createMany({ data: taskParticipants(refs) });

  await prisma.case.upsert({
    where: { id: 'seed_case_employee_grievance' },
    update: {
      lifecycleStatus: CaseLifecycleStatus.HR_REVIEW,
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      ownerId: refs.adminUser.id,
    },
    create: {
      id: 'seed_case_employee_grievance',
      type: CaseType.EMPLOYEE_GRIEVANCE,
      status: ComplaintStatus.IN_PROGRESS,
      lifecycleStatus: CaseLifecycleStatus.HR_REVIEW,
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      branchId: refs.mainBranch.id,
      ownerId: refs.adminUser.id,
      subject: 'Confidential employee grievance',
      descriptionEn: 'Seed-only restricted HR case for ACL proof.',
    },
  });
  await prisma.caseLink.deleteMany({ where: { caseId: 'seed_case_employee_grievance' } });
  await prisma.caseParticipant.deleteMany({ where: { caseId: 'seed_case_employee_grievance' } });
  await prisma.caseLink.createMany({ data: caseLinks(refs) });
  await prisma.caseParticipant.createMany({ data: caseParticipants(refs) });
  await prisma.caseRestrictedNote.upsert({
    where: { id: 'seed_case_note_hr' },
    update: { body: 'Restricted HR note for seed ACL proof.' },
    create: {
      id: 'seed_case_note_hr',
      caseId: 'seed_case_employee_grievance',
      authorId: refs.adminUser.id,
      body: 'Restricted HR note for seed ACL proof.',
    },
  });
}

const seedTaskIds = ['seed_task_overdue_promise', 'seed_task_internal_confidential'];

function taskLinks(refs: Phase10SeedRefs, dealId: string) {
  return [
    { taskId: 'seed_task_overdue_promise', entityType: TaskLinkEntityType.CUSTOMER, entityId: refs.customerA.id },
    { taskId: 'seed_task_overdue_promise', entityType: TaskLinkEntityType.DEAL, entityId: dealId },
    { taskId: 'seed_task_internal_confidential', entityType: TaskLinkEntityType.EMPLOYEE, entityId: refs.officerMain.id },
  ];
}

function taskParticipants(refs: Phase10SeedRefs) {
  return [
    { taskId: 'seed_task_overdue_promise', userId: refs.crManager.id, role: TaskParticipantRole.OWNER },
    { taskId: 'seed_task_overdue_promise', userId: refs.officerMain.id, role: TaskParticipantRole.ASSIGNEE },
    { taskId: 'seed_task_internal_confidential', userId: refs.adminUser.id, role: TaskParticipantRole.OWNER },
    { taskId: 'seed_task_internal_confidential', userId: refs.crManager.id, role: TaskParticipantRole.ASSIGNEE },
    { taskId: 'seed_task_internal_confidential', userId: refs.officerMain.id, role: TaskParticipantRole.PARTICIPANT },
  ];
}

function caseLinks(refs: Phase10SeedRefs) {
  return [
    { caseId: 'seed_case_employee_grievance', entityType: CaseLinkEntityType.EMPLOYEE, entityId: refs.officerMain.id },
    { caseId: 'seed_case_employee_grievance', entityType: CaseLinkEntityType.COMPLAINT, entityId: refs.complaint1.id },
  ];
}

function caseParticipants(refs: Phase10SeedRefs) {
  return [
    { caseId: 'seed_case_employee_grievance', userId: refs.adminUser.id, role: CaseParticipantRole.OWNER },
    { caseId: 'seed_case_employee_grievance', userId: refs.crManager.id, role: CaseParticipantRole.PARTICIPANT },
    { caseId: 'seed_case_employee_grievance', userId: refs.officerMain.id, role: CaseParticipantRole.ACCUSED },
  ];
}
