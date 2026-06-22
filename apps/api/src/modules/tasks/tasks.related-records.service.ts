import { Injectable } from '@nestjs/common';
import { CaseType, ComplaintStatus, DealStage, Prisma, RoleCode, TaskLinkEntityType } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { RelatedRecordDto, RelatedRecordType } from './dto/related-record-lookup.dto.js';

type RelatedRecordActor = { roleCode: string; branchId: string | null };
type Scope = { branchId: string | null; isAdmin: boolean };

@Injectable()
export class TasksRelatedRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type: RelatedRecordType, actor: RelatedRecordActor, q?: string): Promise<RelatedRecordDto[]> {
    const scope = scopeFrom(actor);
    if (!scope.isAdmin && !scope.branchId) return [];
    if (type === TaskLinkEntityType.CUSTOMER) return this.customers(scope, q);
    if (type === TaskLinkEntityType.COMPLAINT) return this.complaints(scope, q);
    if (type === TaskLinkEntityType.CASE) return this.cases(scope, q);
    return this.deals(scope, q);
  }

  async exists(type: TaskLinkEntityType, recordId: string, actor: RelatedRecordActor): Promise<boolean> {
    const scope = scopeFrom(actor);
    if (!scope.isAdmin && !scope.branchId) return false;
    if (type === TaskLinkEntityType.CUSTOMER) return (await this.prisma.customer.count({ where: { id: recordId, ...customerScope(scope) } })) > 0;
    if (type === TaskLinkEntityType.COMPLAINT) return (await this.prisma.complaint.count({ where: { id: recordId, ...branchScope(scope) } })) > 0;
    if (type === TaskLinkEntityType.CASE) return (await this.prisma.case.count({ where: { id: recordId, ...caseScope(scope) } })) > 0;
    if (type === TaskLinkEntityType.DEAL) return (await this.prisma.deal.count({ where: { id: recordId, ...branchScope(scope) } })) > 0;
    return false;
  }

  private async customers(scope: Scope, q?: string): Promise<RelatedRecordDto[]> {
    const rows = await this.prisma.customer.findMany({
      where: { ...customerScope(scope), ...customerSearch(q) },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true, nameEn: true, nameAr: true, phone: true,
        complaints: { where: branchScope(scope), take: 1, select: { branch: { select: { nameEn: true, nameAr: true } } } },
      },
    });
    return rows.map((row) => ({
      recordType: TaskLinkEntityType.CUSTOMER,
      recordId: row.id,
      label: row.nameEn,
      labelAr: row.nameAr,
      context: [row.phone, row.complaints[0]?.branch.nameEn].filter(Boolean).join(' - ') || null,
      contextAr: [row.phone, row.complaints[0]?.branch.nameAr].filter(Boolean).join(' - ') || null,
    }));
  }

  private async complaints(scope: Scope, q?: string): Promise<RelatedRecordDto[]> {
    const rows = await this.prisma.complaint.findMany({
      where: { ...branchScope(scope), ...complaintSearch(q) },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true, referenceNumber: true, status: true, subject: true,
        customer: { select: { nameEn: true, nameAr: true, phone: true } },
        branch: { select: { nameEn: true, nameAr: true } },
      },
    });
    return rows.map((row) => ({
      recordType: TaskLinkEntityType.COMPLAINT,
      recordId: row.id,
      label: `${row.referenceNumber} - ${row.customer.nameEn}`,
      labelAr: `${row.referenceNumber} - ${row.customer.nameAr}`,
      context: [row.status, row.subject, row.customer.phone, row.branch.nameEn].filter(Boolean).join(' - '),
      contextAr: [row.status, row.subject, row.customer.phone, row.branch.nameAr].filter(Boolean).join(' - '),
    }));
  }

  private async cases(scope: Scope, q?: string): Promise<RelatedRecordDto[]> {
    const rows = await this.prisma.case.findMany({
      where: { ...caseScope(scope), ...caseSearch(q) },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true, type: true, status: true, subject: true,
        branch: { select: { nameEn: true, nameAr: true } },
        owner: { select: { nameEn: true, nameAr: true } },
      },
    });
    return rows.map((row) => ({
      recordType: TaskLinkEntityType.CASE,
      recordId: row.id,
      label: `${row.subject} - ${row.type}`,
      labelAr: `${row.subject} - ${row.type}`,
      context: [row.status, row.owner?.nameEn, row.branch.nameEn].filter(Boolean).join(' - '),
      contextAr: [row.status, row.owner?.nameAr, row.branch.nameAr].filter(Boolean).join(' - '),
    }));
  }

  private async deals(scope: Scope, q?: string): Promise<RelatedRecordDto[]> {
    const rows = await this.prisma.deal.findMany({
      where: { ...branchScope(scope), ...dealSearch(q) },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true, title: true, stage: true,
        branch: { select: { nameEn: true, nameAr: true } },
        currentHolder: { select: { nameEn: true, nameAr: true } },
      },
    });
    return rows.map((row) => ({
      recordType: TaskLinkEntityType.DEAL,
      recordId: row.id,
      label: row.title,
      labelAr: row.title,
      context: [row.stage, row.currentHolder.nameEn, row.branch.nameEn].filter(Boolean).join(' - '),
      contextAr: [row.stage, row.currentHolder.nameAr, row.branch.nameAr].filter(Boolean).join(' - '),
    }));
  }
}

function scopeFrom(actor: RelatedRecordActor): Scope {
  return { branchId: actor.branchId, isAdmin: actor.roleCode === RoleCode.ADMIN };
}

function branchScope(scope: Scope): { branchId?: string } {
  return scope.isAdmin || !scope.branchId ? {} : { branchId: scope.branchId };
}

function caseScope(scope: Scope): Prisma.CaseWhereInput {
  return { ...branchScope(scope), confidentialityLevel: 'NORMAL' };
}

function customerScope(scope: Scope): Prisma.CustomerWhereInput {
  return scope.isAdmin ? {} : { complaints: { some: { branchId: scope.branchId ?? '' } } };
}

function customerSearch(q?: string): Prisma.CustomerWhereInput {
  return q ? { OR: [{ nameEn: { contains: q } }, { nameAr: { contains: q } }, { phone: { contains: q } }, { id: { contains: q } }] } : {};
}

function complaintSearch(q?: string): Prisma.ComplaintWhereInput {
  return q ? { OR: [{ referenceNumber: { contains: q } }, { subject: { contains: q } }, { customer: { nameEn: { contains: q } } }, { customer: { nameAr: { contains: q } } }, { customer: { phone: { contains: q } } }] } : {};
}

function caseSearch(q?: string): Prisma.CaseWhereInput {
  if (!q) return {};
  return { OR: [{ subject: { contains: q } }, ...(isCaseType(q) ? [{ type: q }] : []), ...(isComplaintStatus(q) ? [{ status: q }] : []), { owner: { nameEn: { contains: q } } }, { owner: { nameAr: { contains: q } } }] };
}

function dealSearch(q?: string): Prisma.DealWhereInput {
  if (!q) return {};
  return { OR: [{ title: { contains: q } }, ...(isDealStage(q) ? [{ stage: q }] : []), { currentHolder: { nameEn: { contains: q } } }, { currentHolder: { nameAr: { contains: q } } }] };
}

function isCaseType(value: string): value is CaseType {
  return Object.values(CaseType).includes(value as CaseType);
}

function isComplaintStatus(value: string): value is ComplaintStatus {
  return Object.values(ComplaintStatus).includes(value as ComplaintStatus);
}

function isDealStage(value: string): value is DealStage {
  return Object.values(DealStage).includes(value as DealStage);
}
