import { Injectable } from '@nestjs/common';
import { RoleCode, type Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { SearchActor, SearchResult, SearchType } from './dto/search-response.dto.js';

const MANAGER_ROLES = new Set<string>([RoleCode.ADMIN, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.MGMT_READONLY]);

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  search(type: SearchType, q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    if (type === 'COMPLAINT') return this.complaints(q, limit, actor);
    if (type === 'TASK') return this.tasks(q, limit, actor);
    if (type === 'CASE') return this.cases(q, limit, actor);
    if (type === 'DEAL') return this.deals(q, limit, actor);
    return this.customers(q, limit, actor);
  }

  private async complaints(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.complaint.findMany({ where: { ...branchScope(actor), OR: [{ referenceNumber: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }, { customer: { nameEn: { contains: q, mode: 'insensitive' } } }, { customer: { nameAr: { contains: q, mode: 'insensitive' } } }, { customer: { phone: { contains: q } } }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, referenceNumber: true, subject: true, customer: { select: { nameEn: true, nameAr: true } }, branch: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'COMPLAINT', id: row.id, label: `${row.referenceNumber} · ${row.customer.nameEn}`, labelAr: `${row.referenceNumber} · ${row.customer.nameAr}`, context: `${row.subject} · ${row.branch.nameEn}`, contextAr: `${row.subject} · ${row.branch.nameAr}`, href: `/complaints/${row.id}` }));
  }

  private async tasks(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.task.findMany({ where: { title: { contains: q, mode: 'insensitive' }, ...taskAccess(actor) }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, title: true, dueAt: true, assignee: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'TASK', id: row.id, label: row.title, labelAr: row.title, context: row.assignee.nameEn, contextAr: row.assignee.nameAr, href: `/tasks/${row.id}` }));
  }

  private async cases(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.case.findMany({ where: { subject: { contains: q, mode: 'insensitive' }, ...caseAccess(actor) }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, subject: true, descriptionAr: true, branch: { select: { nameEn: true, nameAr: true } }, owner: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'CASE', id: row.id, label: row.subject, labelAr: row.descriptionAr || row.subject, context: [row.owner?.nameEn, row.branch.nameEn].filter(Boolean).join(' · '), contextAr: [row.owner?.nameAr, row.branch.nameAr].filter(Boolean).join(' · '), href: `/cases/confidential/${row.id}` }));
  }

  private async deals(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.deal.findMany({ where: { ...branchScope(actor), OR: [{ title: { contains: q, mode: 'insensitive' } }, { currentHolder: { nameEn: { contains: q, mode: 'insensitive' } } }, { currentHolder: { nameAr: { contains: q, mode: 'insensitive' } } }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, title: true, branch: { select: { nameEn: true, nameAr: true } }, currentHolder: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'DEAL', id: row.id, label: row.title, labelAr: row.title, context: `${row.currentHolder.nameEn} · ${row.branch.nameEn}`, contextAr: `${row.currentHolder.nameAr} · ${row.branch.nameAr}`, href: '/deals/handoff' }));
  }

  private async customers(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.customer.findMany({ where: { ...customerAccess(actor), OR: [{ nameEn: { contains: q, mode: 'insensitive' } }, { nameAr: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { dmsCode: { contains: q, mode: 'insensitive' } }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, nameEn: true, nameAr: true, phone: true } });
    return rows.map((row) => ({ type: 'CUSTOMER', id: row.id, label: row.nameEn, labelAr: row.nameAr, context: row.phone, contextAr: row.phone, href: `/complaints?customer=${encodeURIComponent(row.phone)}` }));
  }
}

function branchScope(actor: SearchActor): { branchId?: string } { return actor.roleCode === RoleCode.ADMIN ? {} : { branchId: actor.branchId ?? '' }; }
function participantAccess(actor: SearchActor): Prisma.TaskWhereInput[] { return [{ ownerId: actor.userId }, { assigneeId: actor.userId }, { nextActionWhoId: actor.userId }, { participants: { some: { userId: actor.userId } } }]; }
function taskAccess(actor: SearchActor): Prisma.TaskWhereInput {
  if (actor.roleCode === RoleCode.ADMIN) return {};
  const participant = participantAccess(actor);
  if (!MANAGER_ROLES.has(actor.roleCode) || !actor.branchId) return { OR: participant };
  return { OR: [...participant, { confidentialityLevel: 'NORMAL', OR: [{ owner: { branchId: actor.branchId } }, { assignee: { branchId: actor.branchId } }, { nextActionWho: { branchId: actor.branchId } }] }] };
}
function caseAccess(actor: SearchActor): Prisma.CaseWhereInput {
  if (actor.roleCode === RoleCode.ADMIN) return {};
  const own = [{ ownerId: actor.userId }, { participants: { some: { userId: actor.userId } } }];
  return MANAGER_ROLES.has(actor.roleCode) && actor.branchId ? { OR: [...own, { branchId: actor.branchId, confidentialityLevel: 'NORMAL' }] } : { OR: own };
}
function customerAccess(actor: SearchActor): Prisma.CustomerWhereInput { return actor.roleCode === RoleCode.ADMIN ? {} : { complaints: { some: { branchId: actor.branchId ?? '' } } }; }
