import { HttpStatus, Injectable } from '@nestjs/common';
import { CommunicationGroupVisibility, CollaborationMentionSource, RoleCode } from '@prisma/client';
import { AuditService, type AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { CommunicationGroupDto, CommunicationGroupsResponseDto } from './dto/communication-group-response.dto.js';
import type { CommunicationGroupWriteDto } from './dto/create-communication-group.dto.js';
import { CommunicationGroupsRepository, type CommunicationGroupRecord, type CommunicationStaffRecord } from './communication-groups.repository.js';

export type CommunicationActor = { userId: string; roleCode: string; branchId: string | null; permissions: string[] };
export type MentionTarget = { type: 'USER' | 'SYSTEM_ROLE' | 'SYSTEM_DEPARTMENT' | 'CUSTOM_GROUP'; id: string };
export type ResolvedMention = { userId: string; email: string; nameEn: string; nameAr: string; source: CollaborationMentionSource; sourceId: string | null; sourceLabel: string };
export type CommunicationTargetDto = { id: string; type: MentionTarget['type']; label: string; labelAr: string; recipientCount: number };
export type CommunicationTargetsResponse = { targets: CommunicationTargetDto[]; recipientLimit: number; confirmationRequiredAbove: number };
type AuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

const MAX_RECIPIENTS = 100;
const CONFIRM_ABOVE = 25;

@Injectable()
export class CommunicationGroupsService {
  constructor(private readonly repository: CommunicationGroupsRepository, private readonly audit: AuditService) {}

  async list(actor: CommunicationActor): Promise<CommunicationGroupsResponseDto> {
    const canManageShared = actor.permissions.includes('COMMUNICATION_GROUPS_MANAGE');
    const [groups, staff] = await Promise.all([this.repository.listVisible(actor.userId), this.repository.listStaffForBranch(canManageShared ? null : actor.branchId)]);
    return {
      items: groups.map(groupDto),
      eligibleMembers: staff.map((person) => ({ userId: person.id, displayName: person.nameEn, displayNameAr: person.nameAr })),
      canManageShared,
    };
  }

  async create(actor: CommunicationActor, input: CommunicationGroupWriteDto, audit: AuditContext = {}): Promise<CommunicationGroupDto> {
    this.assertVisibility(actor, input.visibility);
    await this.assertMemberScope(actor, input.memberUserIds, input.visibility === CommunicationGroupVisibility.SHARED ? null : actor.branchId);
    return this.repository.transaction(async (client) => {
      const group = await this.repository.create({ ...input, ownerId: actor.userId }, client);
      await this.audit.record(groupAudit('communication_group_created', group, audit), client);
      return groupDto(group);
    });
  }

  async update(id: string, actor: CommunicationActor, input: CommunicationGroupWriteDto, audit: AuditContext = {}): Promise<CommunicationGroupDto> {
    const current = await this.requiredGroup(id);
    this.assertGroupManager(current, actor);
    if (input.visibility !== current.visibility) throw validation('visibility');
    await this.assertMemberScope(actor, input.memberUserIds, current.visibility === CommunicationGroupVisibility.SHARED ? null : actor.branchId);
    return this.repository.transaction(async (client) => {
      const group = await this.repository.replace(current.id, input, client);
      await this.audit.record(groupAudit('communication_group_updated', group, audit), client);
      return groupDto(group);
    });
  }

  async deactivate(id: string, actor: CommunicationActor, audit: AuditContext = {}): Promise<void> {
    const current = await this.requiredGroup(id);
    this.assertGroupManager(current, actor);
    await this.repository.transaction(async (client) => {
      const group = await this.repository.deactivate(current.id, client);
      await this.audit.record(groupAudit('communication_group_deactivated', group, audit), client);
    });
  }

  async targets(actor: CommunicationActor, branchId: string, query = ''): Promise<CommunicationTargetsResponse> {
    const [staff, groups] = await Promise.all([this.eligibleStaff(branchId), this.repository.listVisible(actor.userId)]);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const eligibleIds = new Set(staff.map((person) => person.id));
    const direct = staff.map((person) => target(person.id, 'USER', person.nameEn, person.nameAr, 1));
    const roles = uniqueGroups(staff, (person) => person.role.id).map((people) => target(people[0]!.role.id, 'SYSTEM_ROLE', people[0]!.role.nameEn, people[0]!.role.nameAr, people.length));
    const departments = uniqueGroups(staff.filter((person) => person.department), (person) => person.departmentId!).map((people) => target(people[0]!.departmentId!, 'SYSTEM_DEPARTMENT', people[0]!.department!.nameEn, people[0]!.department!.nameAr, people.length));
    const custom = groups.map((group) => target(group.id, 'CUSTOM_GROUP', group.name, group.name, group.members.filter(({ user }) => eligibleIds.has(user.id)).length)).filter((item) => item.recipientCount > 0);
    const groupsOnly = [...roles, ...departments, ...custom];
    const candidates = normalizedQuery.length >= 2 ? [...groupsOnly, ...direct] : groupsOnly;
    const items = candidates
      .filter((item) => !normalizedQuery || `${item.label} ${item.labelAr}`.toLocaleLowerCase().includes(normalizedQuery))
      .sort((left, right) => left.label.localeCompare(right.label))
      .slice(0, 20);
    return { targets: items, recipientLimit: MAX_RECIPIENTS, confirmationRequiredAbove: CONFIRM_ABOVE };
  }

  async resolveMentions(actor: CommunicationActor, branchId: string, targets: MentionTarget[], confirmedRecipientCount?: number): Promise<ResolvedMention[]> {
    if (targets.length > 20) throw validation('mentionTargets');
    const [staff, groups] = await Promise.all([this.eligibleStaff(branchId), this.repository.listVisible(actor.userId)]);
    const staffById = new Map(staff.map((person) => [person.id, person]));
    const groupsById = new Map(groups.map((group) => [group.id, group]));
    const recipients = new Map<string, ResolvedMention>();
    for (const targetInput of targets) {
      for (const resolved of resolveTarget(targetInput, staff, staffById, groupsById)) {
        if (resolved.id !== actor.userId && !recipients.has(resolved.id)) recipients.set(resolved.id, mention(resolved.person, resolved.source, resolved.sourceId, resolved.sourceLabel));
      }
    }
    if (recipients.size > MAX_RECIPIENTS) throw new AppException('COLLABORATION_RECIPIENT_LIMIT_EXCEEDED', 'Too many collaboration recipients', HttpStatus.CONFLICT);
    return [...recipients.values()];
  }

  async assertRecipient(actor: CommunicationActor, branchId: string, userId: string): Promise<void> {
    const recipients = await this.resolveMentions(actor, branchId, [{ type: 'USER', id: userId }]);
    if (!recipients.some((item) => item.userId === userId)) throw new AppException('COLLABORATION_TARGET_FORBIDDEN', 'Collaboration target is not available', HttpStatus.FORBIDDEN);
  }

  assertAudience(count: number, confirmedRecipientCount?: number): void {
    if (count > MAX_RECIPIENTS) throw new AppException('COLLABORATION_RECIPIENT_LIMIT_EXCEEDED', 'Too many collaboration recipients', HttpStatus.CONFLICT);
    if (count > CONFIRM_ABOVE && confirmedRecipientCount !== count) throw new AppException('COLLABORATION_AUDIENCE_CONFIRMATION_REQUIRED', 'Confirm the recipient audience before sending', HttpStatus.CONFLICT, [], count);
  }

  private async requiredGroup(id: string): Promise<CommunicationGroupRecord> {
    const group = await this.repository.find(requiredText(id, 'id'));
    if (!group || !group.isActive) throw new AppException('VALIDATION_FAILED', 'Communication group was not found', HttpStatus.NOT_FOUND);
    return group;
  }

  private async assertMemberScope(actor: CommunicationActor, userIds: string[], branchId: string | null): Promise<void> {
    const allowed = new Set((await this.repository.listStaffForBranch(branchId)).map((person) => person.id));
    if (userIds.some((userId) => !allowed.has(userId))) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }

  private assertVisibility(actor: CommunicationActor, visibility: CommunicationGroupVisibility): void {
    if (visibility === CommunicationGroupVisibility.SHARED && !actor.permissions.includes('COMMUNICATION_GROUPS_MANAGE')) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }

  private assertGroupManager(group: CommunicationGroupRecord, actor: CommunicationActor): void {
    if (group.visibility === CommunicationGroupVisibility.SHARED) return this.assertVisibility(actor, group.visibility);
    if (group.ownerId !== actor.userId) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }

  private async eligibleStaff(branchId: string): Promise<CommunicationStaffRecord[]> {
    return (await this.repository.listStaffForBranch(branchId)).filter((person) => person.role.code === RoleCode.ADMIN || person.branchId === branchId);
  }
}

function resolveTarget(input: MentionTarget, staff: CommunicationStaffRecord[], staffById: Map<string, CommunicationStaffRecord>, groups: Map<string, CommunicationGroupRecord>) {
  if (input.type === 'USER') {
    const person = staffById.get(input.id);
    if (!person) throw new AppException('COLLABORATION_TARGET_FORBIDDEN', 'Collaboration target is not available', HttpStatus.FORBIDDEN);
    return [{ id: person.id, person, source: CollaborationMentionSource.USER, sourceId: person.id, sourceLabel: person.nameEn }];
  }
  if (input.type === 'SYSTEM_ROLE') {
    const people = staff.filter((person) => person.role.id === input.id);
    if (!people.length) throw validation('mentionTargets');
    return people.map((person) => ({ id: person.id, person, source: CollaborationMentionSource.SYSTEM_ROLE, sourceId: input.id, sourceLabel: person.role.nameEn }));
  }
  if (input.type === 'SYSTEM_DEPARTMENT') {
    const people = staff.filter((person) => person.departmentId === input.id);
    if (!people.length) throw validation('mentionTargets');
    return people.map((person) => ({ id: person.id, person, source: CollaborationMentionSource.SYSTEM_DEPARTMENT, sourceId: input.id, sourceLabel: person.department?.nameEn ?? 'Department' }));
  }
  const group = groups.get(input.id);
  if (!group) throw new AppException('COLLABORATION_TARGET_FORBIDDEN', 'Collaboration target is not available', HttpStatus.FORBIDDEN);
  return group.members.flatMap(({ user }) => staffById.has(user.id) ? [{ id: user.id, person: user, source: CollaborationMentionSource.CUSTOM_GROUP, sourceId: group.id, sourceLabel: group.name }] : []);
}

function uniqueGroups(staff: CommunicationStaffRecord[], key: (person: CommunicationStaffRecord) => string): CommunicationStaffRecord[][] {
  const groups = new Map<string, CommunicationStaffRecord[]>();
  for (const person of staff) groups.set(key(person), [...(groups.get(key(person)) ?? []), person]);
  return [...groups.values()];
}

function mention(person: CommunicationStaffRecord, source: CollaborationMentionSource, sourceId: string | null, sourceLabel: string): ResolvedMention {
  return { userId: person.id, email: person.email, nameEn: person.nameEn, nameAr: person.nameAr, source, sourceId, sourceLabel };
}

function target(id: string, type: MentionTarget['type'], label: string, labelAr: string, recipientCount: number): CommunicationTargetDto {
  return { id, type, label, labelAr, recipientCount };
}

function groupDto(group: CommunicationGroupRecord): CommunicationGroupDto {
  return { id: group.id, name: group.name, visibility: group.visibility, ownerId: group.ownerId, members: group.members.map(({ user }) => ({ userId: user.id, displayName: user.nameEn, displayNameAr: user.nameAr })), createdAt: group.createdAt.toISOString(), updatedAt: group.updatedAt.toISOString() };
}

function groupAudit(action: string, group: CommunicationGroupRecord, context: AuditContext): AuditRecordInput {
  return { eventType: 'CONFIG', action, actorId: context.actorId ?? null, branchId: null, targetType: 'communication_group', targetId: group.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata: { visibility: group.visibility, memberCount: group.members.length } };
}

function requiredText(value: string, field: string): string {
  if (!value.trim()) throw validation(field);
  return value.trim();
}

function validation(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid collaboration request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required or invalid.` }]);
}
