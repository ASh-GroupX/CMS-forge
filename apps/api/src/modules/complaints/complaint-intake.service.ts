import { PortalIntakeService } from '../portal-intake/portal-intake.service.js';
import { updatePortalAnswers } from '../portal-intake/portal-form-answers.js';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { AssignmentsService } from '../assignments/assignments.service.js';
import { CustomersService } from '../customers/customers.service.js';
import { SlaService } from '../sla/sla.service.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintIntakeRepository, type IntakeRecord } from './complaint-intake.repository.js';
import { invalidIntake, type IntakeCorrection } from './dto/complaint-intake.dto.js';
const claimType = 'COMPLAINT_INTAKE';
@Injectable()
export class ComplaintIntakeService {
  private readonly logger = new Logger(ComplaintIntakeService.name);
  constructor(private readonly repository: ComplaintIntakeRepository, private readonly audit: AuditService, private readonly assignments: AssignmentsService, private readonly customers: CustomersService, private readonly catalog: ComplaintFormOptionsService, private readonly sla: SlaService, private readonly configuration: PortalIntakeService) {}
  async access(actor: StaffPrincipal) {
    if (actor.roleCode === 'ADMIN') return true;
    if (!(actor.roleCode === 'CR_MANAGER' || actor.permissions?.includes('COMPLAINT_MANAGE')) || !await this.configuration.isMember(actor.userId)) {
      await this.audit.record({ eventType: 'SECURITY', action: 'intake_access_denied', actorId: actor.userId, targetType: 'portal_intake', targetId: null, branchId: actor.branchId });
      throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }
    return true;
  }
  async queue(actor: StaffPrincipal, filter: string, page = 1) {
    await this.access(actor);
    if (!['all', 'unclaimed', 'mine', 'claimed'].includes(filter)) invalidIntake('filter');
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) invalidIntake('page');
    const ids = filter === 'all' ? null : await this.assignments.claimedIds(claimType, filter === 'mine' ? actor.userId : undefined);
    const records = await this.repository.queue(actor.roleCode === 'ADMIN' ? null : actor.branchId ?? '__none__', ids, filter === 'unclaimed', page);
    const rows = await Promise.all(records.slice(0, 50).map(async (row) => ({ ...row, claim: await this.assignments.get(claimType, row.id) })));
    return { items: rows.map(present), page, hasMore: records.length > 50 };
  }
  async detail(id: string, actor: StaffPrincipal) {
    await this.access(actor);
    return this.repository.transaction(async (tx) => {
      const row = await this.subject(id, actor, tx);
      const claim = await this.assignments.getInTransaction(claimType, id, tx);
      return present({ ...row, claim });
    });
  }
  async options(actor: StaffPrincipal) {
    await this.access(actor);
    const options = await this.catalog.list(actor);
    const global = actor.roleCode === 'ADMIN';
    return { branches: options.branches.filter((item) => global || item.id === actor.branchId), categories: options.categories.filter((item) => global || !item.branchId || item.branchId === actor.branchId), departments: options.departments.filter((item) => global || !item.branchId || item.branchId === actor.branchId), severities: options.severities, users: options.users.filter((item) => global || item.branchId === actor.branchId).map(({ id, nameEn, nameAr, departmentId, branchId }) => ({ id, nameEn, nameAr, departmentId, branchId })), carModels: options.carModels ?? [] };
  }
  async claim(id: string, expectedVersion: string, actor: StaffPrincipal, release = false) {
    await this.access(actor);
    return this.repository.transaction(async (tx) => {
      const row = await this.subject(id, actor, tx); checkVersion(row, expectedVersion);
      const current = await this.assignments.getInTransaction(claimType, id, tx);
      if (release) await this.assignments.releaseInTransaction(claimType, id, actor, tx);
      else {
        if (current?.assignedUserId && current.assignedUserId !== actor.userId) conflict();
        if (current?.assignedUserId === actor.userId) return this.result(row, current);
        await this.assignments.setInTransaction({ entityType: claimType, entityId: id, assignedUserId: actor.userId, scopeBranchId: row.branchId }, actor, {}, tx);
      }
      const updated = await this.repository.bump(row, {}, tx);
      return this.result(updated, await this.assignments.getInTransaction(claimType, id, tx));
    });
  }
  async correct(id: string, expectedVersion: string, changes: IntakeCorrection, actor: StaffPrincipal, redirect: boolean) {
    await this.access(actor);
    await this.configuration.assertVehicle?.(changes.vehicleMake, changes.vehicleModel, true);
    const options = await this.catalog.list(actor);
    const branch = options.branches.find((item) => item.id === changes.branchId);
    const category = options.categories.find((item) => item.id === changes.categoryId && (!item.branchId || item.branchId === changes.branchId));
    const department = options.departments.find((item) => item.id === changes.departmentId && (!item.branchId || item.branchId === changes.branchId));
    if (!branch || !category || (changes.departmentId && !department) || redirect && !department || category?.departmentId && changes.departmentId && category.departmentId !== changes.departmentId) invalidIntake('routing');
    if (actor.roleCode !== 'ADMIN' && changes.branchId !== actor.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    if (changes.ownerId && !options.users.some((user) => user.id === changes.ownerId && user.departmentId === changes.departmentId && user.branchId === changes.branchId)) invalidIntake('ownerId');
    const result = await this.repository.transaction(async (tx) => {
      const row = await this.subject(id, actor, tx); checkVersion(row, expectedVersion);
      const claim = await this.assignments.getInTransaction(claimType, id, tx);
      if (claim?.assignedUserId !== actor.userId) conflict();
      const customer = await this.customers.resolveIntake(changes.customerName, changes.customerPhone, tx);
      const portalData = updatePortalAnswers(row.portalData, { customerName: changes.customerName, customerPhone: changes.customerPhone, vehicleBrand: changes.vehicleMake, vehicleModel: changes.vehicleModel, vehicleVin: changes.vehicleVin, odometer: changes.odometer, incidentAt: changes.incidentAt.toISOString(), description: changes.description }, changes.customFields);
      const data = { customerId: customer.id, customerNameSnapshot: changes.customerName, vehicleId: null, vehicleVinSnapshot: changes.vehicleVin, vehicleMakeSnapshot: changes.vehicleMake, vehicleModelSnapshot: changes.vehicleModel, vehicleDataUnavailableReason: changes.vehicleVin ? 'Vehicle identity requires staff verification' : 'VIN not provided at intake', subject: `${changes.vehicleMake} ${changes.vehicleModel}`, descriptionEn: changes.description, incidentAt: changes.incidentAt, odometer: changes.odometer, branchId: changes.branchId, categoryId: changes.categoryId, departmentId: changes.departmentId, severity: changes.severity, ownerId: changes.ownerId, ...(portalData ? { portalData } : {}) };
      let updated = await this.repository.bump(row, data, tx);
      await this.audit.record({ eventType: 'COMPLAINT', action: 'intake_corrected', actorId: actor.userId, branchId: changes.branchId, targetType: 'complaint', targetId: id, metadata: { changedFields: Object.keys(data), reasonCode: 'INTAKE_CORRECTION' } }, tx);
      if (redirect) {
        for (const step of [{ from: 'SUBMITTED', to: 'MANAGER_REVIEW', action: 'ACCEPT_INTAKE' }, { from: 'MANAGER_REVIEW', to: changes.ownerId ? 'IN_PROGRESS' : 'BRANCH_REVIEW', action: 'APPROVE_AND_ROUTE' }] as const) {
          await this.repository.history({ complaintId: id, fromStatus: step.from, toStatus: step.to, action: step.action, actorId: actor.userId, actorRole: actor.roleCode, requestSource: 'STAFF_API', reason: changes.reason }, tx);
          await this.audit.record({ eventType: 'WORKFLOW', action: step.action, actorId: actor.userId, branchId: changes.branchId, targetType: 'complaint', targetId: id, metadata: { fromStatus: step.from, toStatus: step.to, reasonCode: 'INTAKE_REDIRECT' } }, tx);
        }
        updated = await this.repository.bump(updated, { status: changes.ownerId ? 'IN_PROGRESS' : 'BRANCH_REVIEW' }, tx);
        await this.assignments.setInTransaction({ entityType: 'COMPLAINT', entityId: id, assignedUserId: changes.ownerId, assignedDepartmentId: changes.departmentId, scopeBranchId: changes.branchId }, actor, {}, tx);
        await this.assignments.releaseInTransaction(claimType, id, actor, tx);
      }
      return this.result(updated, redirect ? null : claim);
    });
    if (redirect) {
      await this.assignments.notifyAfterCommit('COMPLAINT', id, { href: `/complaints/${id}`, title: result.referenceNumber, complaintId: id });
      await this.sla.recordDeadlineEvent({ complaintId: id, branchId: changes.branchId, departmentId: changes.departmentId, categoryId: changes.categoryId, severity: changes.severity, stage: changes.ownerId ? 'INVESTIGATION' : 'BRANCH_REVIEW', enteredAt: new Date() }).catch(() => this.logger.warn('Intake redirect SLA scheduling failed after commit'));
    }
    return result;
  }
  private result(row: IntakeRecord, claim: { assignedUserId: string | null } | null) { return present({ ...row, claim }); }
  private async subject(id: string, actor: StaffPrincipal, tx: Prisma.TransactionClient) {
    const row = await this.repository.find(id, tx);
    if (!row || actor.roleCode !== 'ADMIN' && row.branchId !== actor.branchId) throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', HttpStatus.NOT_FOUND);
    if (row.status !== 'SUBMITTED') conflict();
    return row;
  }
}
function checkVersion(row: IntakeRecord, version: string) { if (row.updatedAt.toISOString() !== version) conflict(); }
function conflict(): never { throw new AppException('COMPLAINT_INVALID_TRANSITION', 'Complaint changed. Reload and retry.', HttpStatus.CONFLICT); }
function present(row: IntakeRecord & { claim: { assignedUserId: string | null; assignedUser?: { nameEn: string; nameAr: string } | null } | null }) {
  const { customer, vehicle, customerNameSnapshot, vehicleVinSnapshot, vehicleMakeSnapshot, vehicleModelSnapshot, updatedAt, ...rest } = row;
  return { ...rest, claim: row.claim ? { assignedUserId: row.claim.assignedUserId, assignedUser: row.claim.assignedUser ?? null } : null, expectedVersion: updatedAt.toISOString(), customerName: customerNameSnapshot ?? customer.nameEn, customerPhone: customer.phone.startsWith('DMS-PORTAL-') ? '' : customer.phone, vehicleVin: vehicleVinSnapshot ?? vehicle?.vin ?? null, vehicleMake: vehicleMakeSnapshot ?? vehicle?.makeEn ?? '', vehicleModel: vehicleModelSnapshot ?? vehicle?.modelEn ?? '' };
}
