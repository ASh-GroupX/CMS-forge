import { Body, Controller, Get, Inject, Put, Req, UseGuards } from '@nestjs/common';
import { RbacGuard, Roles, SessionAuthGuard, type AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { PortalIntakeService, type PortalIntakeSettingsInput } from './portal-intake.service.js';

@Controller('admin/portal-intake-settings')
@UseGuards(SessionAuthGuard, RbacGuard)
@Roles('ADMIN')
export class PortalIntakeController {
  constructor(@Inject(PortalIntakeService) private readonly settings: PortalIntakeService) {}

  @Get()
  get() { return this.settings.get(); }

  @Get('options')
  options() { return this.settings.options(); }

  @Put()
  @UseGuards(CsrfGuard)
  save(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.settings.save(parseSettings(body), request.principal!.userId);
  }
}

function parseSettings(body: unknown): PortalIntakeSettingsInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { branchId: '', categoryId: '', phoneCountryCode: '', memberIds: [], expectedVersion: null };
  const value = body as Record<string, unknown>;
  return {
    branchId: typeof value.branchId === 'string' ? value.branchId.trim() : '',
    categoryId: typeof value.categoryId === 'string' ? value.categoryId.trim() : '',
    phoneCountryCode: typeof value.phoneCountryCode === 'string' ? value.phoneCountryCode.trim() : '',
    memberIds: Array.isArray(value.memberIds) && value.memberIds.every((id) => typeof id === 'string') ? value.memberIds as string[] : [],
    expectedVersion: value.expectedVersion === null ? null : typeof value.expectedVersion === 'number' ? value.expectedVersion : 0,
  };
}
