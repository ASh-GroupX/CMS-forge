import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, RoleCode, type Prisma } from '@prisma/client';
import { AuditService, type AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { SetAssignmentInput } from './dto/create-assignment.dto.js';
import type { AssignmentOptionsResponseDto, AssignmentResponseDto } from './dto/assignment-response.dto.js';
import type { AssignmentActor, AssignmentAuditContext } from './dto/update-assignment.dto.js';
import { AssignmentsRepository, type AssignmentClient, type AssignmentRecord } from './assignments.repository.js';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    private readonly assignmentsRepository: AssignmentsRepository,
    private readonly auditService: AuditService,
    private readonly notificationsService?: NotificationsService,
  ) {}

  set(input: SetAssignmentInput, actor: AssignmentActor, audit: AssignmentAuditContext = {}): Promise<AssignmentResponseDto> {
    return this.assignmentsRepository.transaction((client) => this.setInTransaction(input, actor, audit, client));
  }

  async setInTransaction(
    input: SetAssignmentInput,
    actor: AssignmentActor,
    audit: AssignmentAuditContext,
    client: Prisma.TransactionClient,
  ): Promise<AssignmentResponseDto> {
    const data = normalize(input);
    assertActorScope(actor, data.scopeBranchId);
    await this.assertTargets(data, actor, client);
    const current = await this.assignmentsRepository.findCurrent(data.entityType, data.entityId, client);
    if (sameTargets(current, data)) return response(current!);
    const action = current ? 'FORWARDED' : 'ASSIGNED';
    const assignment = await this.assignmentsRepository.write({
      ...data,
      assignedById: required(actor.userId, 'actor.userId'),
      action,
      correlationId: audit.correlationId ?? null,
    }, client);
    await this.auditService.record(auditInput(action, assignment, current, audit), client);
    return response(assignment);
  }

  async get(entityType: string, entityId: string): Promise<AssignmentResponseDto | null> {
    const assignment = await this.assignmentsRepository.findCurrent(entityCode(entityType), required(entityId, 'entityId'));
    return assignment ? response(assignment) : null;
  }

  async options(actor: AssignmentActor): Promise<AssignmentOptionsResponseDto> {
    const branchId = actor.roleCode === RoleCode.ADMIN ? null : requiredBranch(actor);
    const result = await this.assignmentsRepository.options(branchId);
    return {
      users: result.users.map((user) => ({
        id: user.id, nameEn: user.nameEn, nameAr: user.nameAr, branchId: user.branchId,
        departmentId: user.departmentId, roleCode: user.role.code,
      })),
      departments: result.departments.map((department) => ({
        id: department.id, nameEn: department.nameEn, nameAr: department.nameAr, branchId: department.branchId,
      })),
    };
  }

  async notifyAfterCommit(
    entityType: string,
    entityId: string,
    presentation: { href: string; title: string; complaintId?: string | null; excludeUserIds?: string[] },
  ): Promise<void> {
    if (!this.notificationsService) return;
    try {
      const assignment = await this.assignmentsRepository.findCurrent(entityCode(entityType), required(entityId, 'entityId'));
      if (!assignment) return;
      const excluded = new Set(presentation.excludeUserIds ?? []);
      const recipients = (await this.assignmentsRepository.recipientUsers(assignment.assignedUserId, assignment.assignedDepartmentId))
        .filter((recipient) => !excluded.has(recipient.id));
      await Promise.all(recipients.flatMap((recipient) => {
        const payload = assignmentNotificationPayload(presentation, recipient, assignment);
        const eventKey = `assignment:${assignment.entityType}:${assignment.entityId}:v${assignment.version}:${recipient.id}`;
        return [
          this.notificationsService!.queueInternal({
            complaintId: presentation.complaintId ?? null,
            recipientUserId: recipient.id,
            templateCode: 'assignment.updated',
            locale: 'ar',
            idempotencyKey: `${eventKey}:in-app`,
            payload,
          }),
          this.notificationsService!.queueInternal({
            complaintId: presentation.complaintId ?? null,
            recipientUserId: recipient.id,
            channel: NotificationChannel.EMAIL,
            templateCode: 'assignment.updated',
            locale: 'ar',
            idempotencyKey: `${eventKey}:email`,
            payload: { ...payload, to: recipient.email },
          }),
        ];
      }));
    } catch (error) {
      this.logger.error(`Post-commit assignment notification failed for ${entityType}:${entityId}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async assertTargets(
    input: ReturnType<typeof normalize>,
    actor: AssignmentActor,
    client: AssignmentClient,
  ): Promise<void> {
    const user = input.assignedUserId
      ? await this.assignmentsRepository.findActiveUser(input.assignedUserId, client)
      : null;
    const department = input.assignedDepartmentId
      ? await this.assignmentsRepository.findActiveDepartment(input.assignedDepartmentId, client)
      : null;
    if (input.assignedUserId && !user) throw invalidTarget('assignedUserId');
    if (input.assignedDepartmentId && !department) throw invalidTarget('assignedDepartmentId');
    if (actor.roleCode === RoleCode.ADMIN) return;
    const branchId = requiredBranch(actor);
    if ((user && user.branchId !== branchId) || (department?.branchId && department.branchId !== branchId)) {
      throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}

function assignmentNotificationPayload(
  presentation: { href: string; title: string },
  recipient: { nameEn: string; nameAr: string },
  assignment: AssignmentRecord,
) {
  const recipientName = recipient.nameAr || recipient.nameEn;
  const textBody = `لديك تعيين جديد: ${presentation.title}\nافتح النظام لعرض التفاصيل.\n\nYou have a new assignment: ${presentation.title}\nOpen the system to view details.`;
  return {
    href: presentation.href,
    title: presentation.title,
    subject: `تعيين جديد: ${presentation.title} | New assignment: ${presentation.title}`,
    recipientName,
    textBody,
    htmlBody: textBody.replace(/\n/g, '<br>'),
    entityType: assignment.entityType,
    entityId: assignment.entityId,
    assignmentVersion: assignment.version,
  };
}

function normalize(input: SetAssignmentInput) {
  const assignedUserId = optional(input.assignedUserId);
  const assignedDepartmentId = optional(input.assignedDepartmentId);
  if (!assignedUserId && !assignedDepartmentId) {
    throw new AppException('VALIDATION_FAILED', 'Invalid assignment request', HttpStatus.BAD_REQUEST, [
      { field: 'assignment', code: 'REQUIRED', message: 'A user or department assignment is required.' },
    ]);
  }
  return {
    entityType: entityCode(input.entityType),
    entityId: required(input.entityId, 'entityId'),
    assignedUserId,
    assignedDepartmentId,
    scopeBranchId: optional(input.scopeBranchId),
    reason: optional(input.reason),
  };
}

function entityCode(value: string): string {
  const code = required(value, 'entityType').toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{0,79}$/.test(code)) throw invalidTarget('entityType');
  return code;
}

function required(value: string | null | undefined, field: string): string {
  const text = value?.trim() ?? '';
  if (!text) throw invalidTarget(field);
  return text;
}

function optional(value: string | null | undefined): string | null {
  const text = value?.trim() ?? '';
  return text || null;
}

function requiredBranch(actor: AssignmentActor): string {
  if (!actor.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return actor.branchId;
}

function assertActorScope(actor: AssignmentActor, scopeBranchId: string | null): void {
  if (actor.roleCode === RoleCode.ADMIN) return;
  if (!scopeBranchId || scopeBranchId !== requiredBranch(actor)) {
    throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

function sameTargets(current: AssignmentRecord | null, input: ReturnType<typeof normalize>): boolean {
  return Boolean(current
    && current.assignedUserId === input.assignedUserId
    && current.assignedDepartmentId === input.assignedDepartmentId
    && current.scopeBranchId === input.scopeBranchId);
}

function response(item: AssignmentRecord): AssignmentResponseDto {
  return {
    id: item.id, entityType: item.entityType, entityId: item.entityId,
    assignedUserId: item.assignedUserId,
    assignedUserName: item.assignedUser?.nameEn ?? null,
    assignedUserNameAr: item.assignedUser?.nameAr ?? null,
    assignedDepartmentId: item.assignedDepartmentId,
    assignedDepartmentName: item.assignedDepartment?.nameEn ?? null,
    assignedDepartmentNameAr: item.assignedDepartment?.nameAr ?? null,
    scopeBranchId: item.scopeBranchId, assignedById: item.assignedById,
    version: item.version, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
  };
}

function invalidTarget(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid assignment request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

function auditInput(
  action: string,
  assignment: AssignmentRecord,
  previous: AssignmentRecord | null,
  audit: AssignmentAuditContext,
): AuditRecordInput {
  return {
    eventType: assignment.entityType === 'TASK' ? 'TASK' : 'WORKFLOW',
    action: action === 'ASSIGNED' ? 'assignment_created' : 'assignment_forwarded',
    actorId: assignment.assignedById,
    branchId: assignment.scopeBranchId,
    targetType: assignment.entityType.toLowerCase(),
    targetId: assignment.entityId,
    correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null,
    userAgent: audit.userAgent ?? null,
    metadata: {
      fromUserId: previous?.assignedUserId ?? null,
      toUserId: assignment.assignedUserId,
      fromDepartmentId: previous?.assignedDepartmentId ?? null,
      toDepartmentId: assignment.assignedDepartmentId,
      assignmentVersion: assignment.version,
    },
  };
}
