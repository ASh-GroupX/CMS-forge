import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BranchScoped, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import type { QuickAddTaskResponseDto } from './dto/create-task.dto.js';
import { parseQuickAddTaskBody, toQuickAddTaskInput } from './dto/create-task.dto.js';
import { parseRelatedRecordLookupQuery, type RelatedRecordLookupResponseDto } from './dto/related-record-lookup.dto.js';
import { parseTaskCommentBody, parseTaskNudgeBody } from './dto/task-collaboration.dto.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto, ManagerTaskDetailResponseDto, PromiseTrackerResponseDto } from './dto/task-response.dto.js';
import type { MoveTaskResponseDto, TaskBoardResponseDto } from './dto/board.dto.js';
import { parseMoveTaskBody } from './dto/move-task.dto.js';
import { TasksBoardService } from './tasks.board.service.js';
import { TasksService } from './tasks.service.js';
import { parseUpdateTaskBody } from './dto/update-task.dto.js';

@Controller('tasks')
export class TasksController {
  constructor(
    @Inject(TasksService) private readonly tasksService: TasksService,
    @Inject(TasksBoardService) private readonly boardService?: TasksBoardService,
  ) {}

  @Post('quick-add')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async quickAdd(@Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<QuickAddTaskResponseDto> {
    const principal = requirePrincipal(request);
    return {
      task: await this.tasksService.createForActor(
        toQuickAddTaskInput(parseQuickAddTaskBody(body), principal.userId),
        { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId },
        auditContext(request),
      ),
    };
  }

  @Get('today')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async today(@Req() request: AuthenticatedRequest): Promise<EmployeeTodayResponseDto> {
    return this.tasksService.employeeToday(principalUserId(request));
  }

  @Get('sent-by-me')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async sentByMe(@Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    return this.tasksService.sentByMe({ userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId });
  }

  @Get('manager-rollup')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async managerRollup(@Req() request: AuthenticatedRequest): Promise<ManagerControlRoomResponseDto> {
    const principal = requirePrincipal(request);
    return this.tasksService.managerControlRoom({ roleCode: principal.roleCode, branchId: principal.branchId });
  }

  @Get('promises')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async promises(@Req() request: AuthenticatedRequest): Promise<PromiseTrackerResponseDto> {
    const principal = requirePrincipal(request);
    return this.tasksService.promiseTracker({ userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId });
  }

  @Get('related-records')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  @BranchScoped()
  relatedRecords(@Query() query: Record<string, unknown>, @Req() request: AuthenticatedRequest): Promise<RelatedRecordLookupResponseDto> {
    const principal = requirePrincipal(request);
    return this.tasksService.relatedRecords(parseRelatedRecordLookupQuery(query), { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId });
  }

  @Get(':id/manager-detail')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async managerDetail(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<ManagerTaskDetailResponseDto> {
    return this.tasksService.managerTaskDetail(id, taskActor(requirePrincipal(request)));
  }

  @Get('board')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async board(@Req() request: AuthenticatedRequest): Promise<TaskBoardResponseDto> {
    return this.boardService!.board(taskActor(requirePrincipal(request)));
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async get(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    return { task: await this.tasksService.getForActor(id, { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId }) };
  }

  @Get(':id/comments')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async comments(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    return this.tasksService.listCommentsForActor(id, { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId }, auditContext(request));
  }

  @Post(':id/comments')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async createComment(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    return {
      comment: await this.tasksService.createCommentForActor(
        id,
        parseTaskCommentBody(body),
        taskActor(principal),
        auditContext(request),
      ),
    };
  }

  @Get(':id/communication-targets')
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async communicationTargets(@Param('id') id: string, @Query('q') query: string | undefined, @Req() request: AuthenticatedRequest) {
    return this.tasksService.communicationTargets(id, taskActor(requirePrincipal(request)), query ?? '');
  }

  @Post(':id/watchers')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async addWatcher(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const userId = watcherUserId(body);
    await this.tasksService.addWatcher(id, userId, taskActor(requirePrincipal(request)), auditContext(request));
    return { ok: true };
  }

  @Delete(':id/watchers/:userId')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async removeWatcher(@Param('id') id: string, @Param('userId') userId: string, @Req() request: AuthenticatedRequest) {
    await this.tasksService.removeWatcher(id, userId, taskActor(requirePrincipal(request)), auditContext(request));
    return { ok: true };
  }

  @Post(':id/nudge')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async nudge(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    await this.tasksService.nudgeForActor(id, parseTaskNudgeBody(body), { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId }, auditContext(request));
    return { ok: true };
  }

  @Post(':id/move')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async move(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest): Promise<MoveTaskResponseDto> {
    return this.boardService!.move(parseMoveTaskBody(id, body), taskActor(requirePrincipal(request)), auditContext(request));
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, PermissionGuard, CsrfGuard)
  @Permissions('COMPLAINT_COMMENT_INTERNAL')
  async update(@Param('id') id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const principal = requirePrincipal(request);
    return {
      task: await this.tasksService.updateForActor(
        parseUpdateTaskBody(id, body),
        { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId },
        auditContext(request),
      ),
    };
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

function taskActor(principal: StaffPrincipal) {
  return { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId, permissions: principal.permissions ?? [] };
}

function watcherUserId(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppException('VALIDATION_FAILED', 'Invalid watcher request', 400);
  const userId = (body as Record<string, unknown>).userId;
  if (typeof userId !== 'string' || !userId.trim()) throw new AppException('VALIDATION_FAILED', 'Invalid watcher request', 400);
  return userId.trim();
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
