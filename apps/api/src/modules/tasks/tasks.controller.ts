import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import type { QuickAddTaskResponseDto } from './dto/create-task.dto.js';
import { parseQuickAddTaskBody, toQuickAddTaskInput } from './dto/create-task.dto.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto } from './dto/task-response.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('quick-add')
  @UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  async quickAdd(@Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<QuickAddTaskResponseDto> {
    const ownerId = principalUserId(request);
    return {
      task: await this.tasksService.create(toQuickAddTaskInput(parseQuickAddTaskBody(body), ownerId), auditContext(request)),
    };
  }

  @Get('today')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  async today(@Req() request: AuthenticatedRequest): Promise<EmployeeTodayResponseDto> {
    return this.tasksService.employeeToday(principalUserId(request));
  }

  @Get('manager-rollup')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  @BranchScoped()
  async managerRollup(@Req() request: AuthenticatedRequest): Promise<ManagerControlRoomResponseDto> {
    const principal = requirePrincipal(request);
    return this.tasksService.managerControlRoom({ roleCode: principal.roleCode, branchId: principal.branchId });
  }
}

function principalUserId(request: AuthenticatedRequest): string {
  return requirePrincipal(request).userId;
}

function requirePrincipal(request: AuthenticatedRequest): StaffPrincipal {
  const userId = request.principal?.userId;
  if (!userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
  return request.principal!;
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
      ?? request.socket?.remoteAddress
      ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
