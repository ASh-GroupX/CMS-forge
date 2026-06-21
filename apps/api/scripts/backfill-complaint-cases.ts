import { CaseLifecycleStatus, CaseLinkEntityType, CaseType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const linked = await prisma.caseLink.findMany({
    where: { entityType: CaseLinkEntityType.COMPLAINT, case: { type: CaseType.CUSTOMER_COMPLAINT } },
    select: { entityId: true },
  });
  const linkedComplaintIds = new Set(linked.map((item) => item.entityId));
  const complaints = await prisma.complaint.findMany({
    where: linkedComplaintIds.size ? { id: { notIn: [...linkedComplaintIds] } } : {},
    select: { id: true, branchId: true, ownerId: true, subject: true, descriptionEn: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  let created = 0;
  for (const complaint of complaints) {
    const made = await prisma.$transaction(async (client) => {
      const exists = await client.caseLink.findFirst({
        where: { entityType: CaseLinkEntityType.COMPLAINT, entityId: complaint.id, case: { type: CaseType.CUSTOMER_COMPLAINT } },
        select: { id: true },
      });
      if (exists) return false;
      const item = await client.case.create({
        data: {
          type: CaseType.CUSTOMER_COMPLAINT,
          status: complaint.status,
          lifecycleStatus: CaseLifecycleStatus.DRAFT,
          branchId: complaint.branchId,
          ownerId: complaint.ownerId,
          subject: complaint.subject,
          descriptionEn: complaint.descriptionEn,
          links: { create: [{ entityType: CaseLinkEntityType.COMPLAINT, entityId: complaint.id }] },
        },
        select: { id: true },
      });
      await client.caseLifecycleHistory.create({ data: { caseId: item.id, fromStatus: null, toStatus: CaseLifecycleStatus.DRAFT } });
      await client.auditLog.create({ data: { eventType: 'WORKFLOW', action: 'case_backfilled_from_complaint', branchId: complaint.branchId, targetType: 'case', targetId: item.id, metadata: { complaintId: complaint.id } } });
      return true;
    });
    if (made) created += 1;
  }
  console.log(`Complaint case backfill complete: ${created} created, ${complaints.length - created} skipped.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Complaint case backfill failed.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
