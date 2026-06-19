import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { parseSurveySubmissionBody } from './dto/create-survey.dto.js';
import { SurveysService } from './surveys.service.js';

@Controller('portal/surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  async submit(@Body() body: unknown) {
    return this.surveysService.submitPortalSurvey(parseSurveySubmissionBody(body));
  }
}

@Controller('complaints/:complaintId/surveys')
export class ComplaintSurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly complaintsService: ComplaintsService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY)
  @BranchScoped()
  async list(
    @Param('complaintId') complaintId: string,
    @Query('branchId') branchId: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.complaintsService.getDetail(complaintId, { branchId: queueBranchId(branchId, request) });
    return { items: await this.surveysService.listSubmittedForComplaint(complaintId) };
  }
}

function queueBranchId(value: string | undefined, request: AuthenticatedRequest): string | null {
  if (value?.trim()) return value.trim();
  return request.principal?.roleCode === RoleCode.ADMIN ? null : request.principal?.branchId ?? null;
}
