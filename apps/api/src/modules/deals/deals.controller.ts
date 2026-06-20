import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import type { DealHandoffBoardResponseDto } from './dto/deal-response.dto.js';
import { DealsService } from './deals.service.js';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('handoff-board')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  @BranchScoped()
  async handoffBoard(@Req() request: AuthenticatedRequest): Promise<DealHandoffBoardResponseDto> {
    const principal = requirePrincipal(request);
    return this.dealsService.handoffBoard({ roleCode: principal.roleCode, branchId: principal.branchId });
  }
}

function requirePrincipal(request: AuthenticatedRequest): StaffPrincipal {
  const principal = request.principal;
  if (!principal?.userId) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
  return principal;
}
