import { Injectable } from '@nestjs/common';
import { InternalTicketStatus, RoleCode, type Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { SearchActor, SearchResult, SearchType } from './dto/search-response.dto.js';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  search(type: SearchType, q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    if (type === 'INTERNAL_TICKET') return this.internalTickets(q, limit, actor);
    if (type === 'COMPLAINT') return this.complaints(q, limit, actor);
    if (type === 'TASK') return this.tasks(q, limit, actor);
    if (type === 'CASE') return this.cases(q, limit, actor);
    if (type === 'DEAL') return this.deals(q, limit, actor);
    return this.customers(q, limit, actor);
  }

  private async complaints(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.complaint.findMany({ where: { ...branchScope(actor, 'COMPLAINT_VIEW_ALL'), OR: [{ referenceNumber: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }, { descriptionEn: { contains: q, mode: 'insensitive' } }, { descriptionAr: { contains: q, mode: 'insensitive' } }, { investigationNotes: { contains: q, mode: 'insensitive' } }, { comments: { some: { body: { contains: q, mode: 'insensitive' } } } }, { customer: { nameEn: { contains: q, mode: 'insensitive' } } }, { customer: { nameAr: { contains: q, mode: 'insensitive' } } }, ...phoneTerms(q).map((phone) => ({ customer: { phone: { contains: phone } } }))] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, referenceNumber: true, subject: true, customer: { select: { nameEn: true, nameAr: true } }, branch: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'COMPLAINT', id: row.id, label: `${row.referenceNumber} · ${row.customer.nameEn}`, labelAr: `${row.referenceNumber} · ${row.customer.nameAr}`, context: `${row.subject} · ${row.branch.nameEn}`, contextAr: `${row.subject} · ${row.branch.nameAr}`, href: `/complaints/${row.id}` }));
  }

  private async tasks(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.task.findMany({ where: { ...taskAccess(actor), AND: [{ OR: [{ title: { contains: q, mode: 'insensitive' } }, { nextActionWhat: { contains: q, mode: 'insensitive' } }, { comments: { some: { body: { contains: q, mode: 'insensitive' } } } }] }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, title: true, dueAt: true, assignee: { select: { nameEn: true, nameAr: true } }, assignedDepartment: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'TASK', id: row.id, label: row.title, labelAr: row.title, context: row.assignee?.nameEn ?? row.assignedDepartment?.nameEn ?? '', contextAr: row.assignee?.nameAr ?? row.assignedDepartment?.nameAr ?? '', href: `/tasks/${row.id}` }));
  }

  private async cases(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.case.findMany({ where: { subject: { contains: q, mode: 'insensitive' }, ...caseAccess(actor) }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, subject: true, descriptionAr: true, branch: { select: { nameEn: true, nameAr: true } }, owner: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'CASE', id: row.id, label: row.subject, labelAr: row.descriptionAr || row.subject, context: [row.owner?.nameEn, row.branch.nameEn].filter(Boolean).join(' · '), contextAr: [row.owner?.nameAr, row.branch.nameAr].filter(Boolean).join(' · '), href: `/cases/confidential/${row.id}` }));
  }

  private async deals(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.deal.findMany({ where: { ...branchScope(actor, 'DEAL_VIEW_ALL'), OR: [{ title: { contains: q, mode: 'insensitive' } }, { currentHolder: { nameEn: { contains: q, mode: 'insensitive' } } }, { currentHolder: { nameAr: { contains: q, mode: 'insensitive' } } }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, title: true, branch: { select: { nameEn: true, nameAr: true } }, currentHolder: { select: { nameEn: true, nameAr: true } } } });
    return rows.map((row) => ({ type: 'DEAL', id: row.id, label: row.title, labelAr: row.title, context: `${row.currentHolder?.nameEn ?? ''} · ${row.branch.nameEn}`, contextAr: `${row.currentHolder?.nameAr ?? ''} · ${row.branch.nameAr}`, href: '/deals/handoff' }));
  }

  private async customers(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const rows = await this.prisma.customer.findMany({ where: { ...customerAccess(actor), OR: [{ nameEn: { contains: q, mode: 'insensitive' } }, { nameAr: { contains: q, mode: 'insensitive' } }, ...phoneTerms(q).map((phone) => ({ phone: { contains: phone } })), { dmsCode: { contains: q, mode: 'insensitive' } }] }, orderBy: { updatedAt: 'desc' }, take: limit, select: { id: true, nameEn: true, nameAr: true, phone: true } });
    return rows.map((row) => ({ type: 'CUSTOMER', id: row.id, label: row.nameEn, labelAr: row.nameAr, context: row.phone, contextAr: row.phone, href: `/customers/${row.id}` }));
  }

  private async internalTickets(q: string, limit: number, actor: SearchActor): Promise<SearchResult[]> {
    const match: Prisma.InternalTicketWhereInput = { OR: [
      { referenceNumber: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { notes: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ...phoneTerms(q).map((phone) => ({ customerPhones: { some: { phone: { contains: phone } } } })),
    ] };
    const rows = await this.prisma.internalTicket.findMany({
      where: { AND: [internalTicketAccess(actor), match] },
      orderBy: { updatedAt: 'desc' }, take: limit,
      select: { id: true, referenceNumber: true, title: true, targetDepartment: { select: { nameEn: true, nameAr: true } } },
    });
    return rows.map((row) => ({ type: 'INTERNAL_TICKET', id: row.id,
      label: `${row.referenceNumber} · ${row.title}`, labelAr: `${row.referenceNumber} · ${row.title}`,
      context: row.targetDepartment.nameEn, contextAr: row.targetDepartment.nameAr,
      href: `/internal-tickets/${row.id}` }));
  }
}

function branchScope(actor: SearchActor, permission: string): { branchId?: string } { return actor.roleCode === RoleCode.ADMIN || actor.permissions?.includes(permission) ? {} : { branchId: actor.branchId ?? '' }; }
function participantAccess(actor: SearchActor): Prisma.TaskWhereInput[] { return [{ ownerId: actor.userId }, { assigneeId: actor.userId }, { nextActionWhoId: actor.userId }, { participants: { some: { userId: actor.userId } } }]; }
function taskAccess(actor: SearchActor): Prisma.TaskWhereInput {
  if (actor.permissions?.includes('TASK_MANAGE_ALL')) return {};
  const participant = participantAccess(actor);
  if (!actor.permissions?.includes('TASK_VIEW_BRANCH') || !actor.branchId) return { OR: participant };
  return { OR: [...participant, { confidentialityLevel: 'NORMAL', OR: [{ owner: { branchId: actor.branchId } }, { assignee: { branchId: actor.branchId } }, { nextActionWho: { branchId: actor.branchId } }] }] };
}
function caseAccess(actor: SearchActor): Prisma.CaseWhereInput {
  if (actor.permissions?.includes('CASE_VIEW_ALL')) return {};
  const own = [{ ownerId: actor.userId }, { participants: { some: { userId: actor.userId } } }];
  return actor.permissions?.includes('CASE_VIEW_BRANCH') && actor.branchId ? { OR: [...own, { branchId: actor.branchId, confidentialityLevel: 'NORMAL' }] } : { OR: own };
}
function customerAccess(actor: SearchActor): Prisma.CustomerWhereInput { return actor.roleCode === RoleCode.ADMIN ? {} : { complaints: { some: { branchId: actor.branchId ?? '' } } }; }

export function internalTicketAccess(actor: SearchActor): Prisma.InternalTicketWhereInput {
  if (actor.roleCode === RoleCode.ADMIN) return {};
  if (actor.roleCode === 'INTERNAL_OFFICER') return { OR: [
    { requestedById: actor.userId }, { assignedEmployeeId: actor.userId },
    ...(actor.departmentId ? [{ targetDepartmentId: actor.departmentId, assignedEmployeeId: null,
      status: { in: [InternalTicketStatus.ASSIGNED, InternalTicketStatus.IN_PROGRESS, InternalTicketStatus.WAITING, InternalTicketStatus.RESOLVED] } }] : []),
  ] };
  return { OR: [{ requestedById: actor.userId }, { assignedEmployeeId: actor.userId },
    ...(actor.departmentId ? [{ targetDepartmentId: actor.departmentId }, { requestedBy: { departmentId: actor.departmentId } }] : [])] };
}

function phoneTerms(value: string): string[] {
  const digits = value.replace(/[\s().-]/g, '');
  if (/^07\d{0,8}$/.test(digits)) return [value, `+962${digits.slice(1)}`];
  if (/^\+9627\d{0,8}$/.test(digits)) return [value, `0${digits.slice(4)}`];
  return [value];
}
