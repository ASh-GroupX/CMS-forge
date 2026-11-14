import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminUsersService } from '../admin/admin-users.service.js';
import { PortalIntakeRepository } from './portal-intake.repository.js';
import { PortalFormService } from './portal-form.service.js';
import { defaultPortalFields } from '@cms-auto/contracts';
export type PortalIntakeSettingsInput = { branchId: string; categoryId: string; redirectBranchId: string; redirectDepartmentId: string; phoneCountryCode: string; memberIds: string[]; expectedVersion: number | null };

@Injectable()
export class PortalIntakeService {
  constructor(private readonly repository: PortalIntakeRepository, private readonly admin: AdminUsersService, private readonly audit: AuditService, private readonly forms?: PortalFormService) {}
  form() { return this.forms?.get() ?? Promise.resolve({ version: null, fields: structuredClone(defaultPortalFields) }); }
  catalog() { return this.forms?.catalog() ?? Promise.resolve([]); }
  validateForm(input: Record<string, unknown>) { return this.forms!.validate(input); }
  assertVehicle(brand: string | null | undefined, model: string | null | undefined, required = false) { if (required && (!brand || !model)) throw new AppException('VALIDATION_FAILED', 'Choose a vehicle make and model.', HttpStatus.BAD_REQUEST, [{ field: !brand ? 'vehicleBrand' : 'vehicleModel', code: 'REQUIRED', message: 'Choose a vehicle.' }]); return this.forms!.assertVehicle(brand, model); }
  async get() { const record = await this.repository.get(); return record ? { branchId: record.branchId, categoryId: record.categoryId, redirectBranchId: record.redirectBranchId, redirectDepartmentId: record.redirectDepartmentId, phoneCountryCode: record.phoneCountryCode, version: record.version, memberIds: record.members.map((member) => member.userId) } : { branchId: '', categoryId: '', redirectBranchId: null, redirectDepartmentId: null, phoneCountryCode: '+962', version: null, memberIds: [] }; }
  async redirectDefaults() { const record = await this.repository.get(); return { branchId: record?.redirectBranchId ?? null, departmentId: record?.redirectDepartmentId ?? null }; }
  options() { return this.admin.intakeOptions(); }
  recipients() { return this.repository.recipients(); }
  async isMember(userId: string) { return (await this.recipients()).some((member) => member.userId === userId); }
  async publicDefaults() { const record = await this.repository.defaults(); return record && record.branch.isActive && record.category.isActive ? { phoneCountryCode: record.phoneCountryCode, branch: { timezone: record.branch.timezone } } : null; }
  async defaults() {
    const record = await this.repository.defaults();
    if (!record || !record.branch.isActive || !record.category.isActive || record.category.branchId && record.category.branchId !== record.branchId) return null;
    return { branchId: record.branchId, categoryId: record.categoryId, departmentId: null };
  }
  async save(input: PortalIntakeSettingsInput, actorId: string) {
    const memberIds = [...new Set(input.memberIds)];
    if (!input.branchId || !input.categoryId || !input.redirectBranchId || !input.redirectDepartmentId || !/^\+[1-9]\d{0,3}$/.test(input.phoneCountryCode) || memberIds.length < 1 || memberIds.length > 100 || input.expectedVersion !== null && (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1)) invalid();
    try {
      return await this.repository.transaction(async (tx) => {
        const options = await this.admin.intakeOptions(tx);
        if (!options.branches.some((branch) => branch.id === input.branchId) || !options.categories.some((category) => category.id === input.categoryId && (!category.branchId || category.branchId === input.branchId)) || !options.branches.some((branch) => branch.id === input.redirectBranchId) || !options.departments.some((department) => department.id === input.redirectDepartmentId && (!department.branchId || department.branchId === input.redirectBranchId)) || memberIds.some((id) => !options.members.some((member) => member.id === id && (member.roleCode === 'ADMIN' || member.branchId === input.branchId)))) invalid();
        const before = await this.repository.get(tx);
        if ((before?.version ?? null) !== input.expectedVersion) conflict();
        const updated = await this.repository.advance({ branchId: input.branchId, categoryId: input.categoryId, redirectBranchId: input.redirectBranchId, redirectDepartmentId: input.redirectDepartmentId, phoneCountryCode: input.phoneCountryCode }, input.expectedVersion, tx);
        if (!updated) conflict();
        const oldIds = new Set(before?.members.map((member) => member.userId) ?? []);
        for (const member of before?.members ?? []) if (!memberIds.includes(member.userId)) await this.repository.remove(member.id, tx);
        for (const id of memberIds) if (!oldIds.has(id)) await this.repository.add(id, tx);
        await this.audit.record({ eventType: 'CONFIG', action: 'portal_intake_settings_updated', actorId, branchId: input.branchId, targetType: 'portal_intake_settings', targetId: 'default', metadata: { version: updated.version, changedFields: ['branchId', 'categoryId', 'redirectBranchId', 'redirectDepartmentId', 'phoneCountryCode', 'memberIds'], addedMemberIds: memberIds.filter((id) => !oldIds.has(id)), removedMemberIds: [...oldIds].filter((id) => !memberIds.includes(id)) } }, tx);
        return { branchId: updated.branchId, categoryId: updated.categoryId, redirectBranchId: updated.redirectBranchId, redirectDepartmentId: updated.redirectDepartmentId, phoneCountryCode: updated.phoneCountryCode, version: updated.version, memberIds };
      });
    } catch (error) { if (error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code))) conflict(); throw error; }
  }
}
function invalid(): never { throw new AppException('VALIDATION_FAILED', 'Invalid intake settings', HttpStatus.BAD_REQUEST); }
function conflict(): never { throw new AppException('COMPLAINT_INVALID_TRANSITION', 'Settings changed. Reload and retry.', HttpStatus.CONFLICT); }
