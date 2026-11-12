import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard, type AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { ComplaintIntakeService } from './complaint-intake.service.js';
import { intakeBody, intakeVersion, parseIntakeCorrection } from './dto/complaint-intake.dto.js';
@Controller('complaints')
@UseGuards(SessionAuthGuard)
export class ComplaintIntakeController {
  constructor(@Inject(ComplaintIntakeService) private readonly intake: ComplaintIntakeService) {}
  @Get('intake-access') access(@Req() req: AuthenticatedRequest) { return this.intake.access(req.principal!).then(() => ({ allowed: true })); }
  @Get('redirect-queue') queue(@Query('filter') filter: string | undefined, @Query('page') page: string | undefined, @Req() req: AuthenticatedRequest) { return this.intake.queue(req.principal!, filter ?? 'all', page === undefined ? 1 : Number(page)); }
  @Get('intake-options') options(@Req() req: AuthenticatedRequest) { return this.intake.options(req.principal!); }
  @Get(':id/intake') detail(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.intake.detail(id, req.principal!); }
  @Post(':id/intake-claim') @UseGuards(CsrfGuard)
  claim(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) { return this.intake.claim(id, intakeVersion(intakeBody(body)), req.principal!); }
  @Delete(':id/intake-claim') @UseGuards(CsrfGuard)
  release(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) { return this.intake.claim(id, intakeVersion(intakeBody(body)), req.principal!, true); }
  @Patch(':id/intake') @UseGuards(CsrfGuard)
  correct(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) { const value = intakeBody(body); return this.intake.correct(id, intakeVersion(value), parseIntakeCorrection(value), req.principal!, false); }
  @Post(':id/intake-redirect') @UseGuards(CsrfGuard)
  redirect(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) { const value = intakeBody(body); return this.intake.correct(id, intakeVersion(value), parseIntakeCorrection(value), req.principal!, true); }
}
