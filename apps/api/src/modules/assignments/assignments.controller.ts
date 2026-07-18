import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import { SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import type { AssignmentOptionsResponseDto } from './dto/assignment-response.dto.js';
import { AssignmentsService } from './assignments.service.js';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('options')
  @UseGuards(SessionAuthGuard)
  options(@Req() request: AuthenticatedRequest): Promise<AssignmentOptionsResponseDto> {
    const principal = request.principal;
    if (!principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
    return this.assignmentsService.options({
      userId: principal.userId,
      roleCode: principal.roleCode,
      branchId: principal.branchId,
      ...(principal.departmentId !== undefined ? { departmentId: principal.departmentId } : {}),
    });
  }
}
