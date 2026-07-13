import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PermissionGuard, Permissions, SessionAuthGuard, type AuthenticatedRequest } from '../../core/auth.guard.js';
import type { SearchResponseDto } from './dto/search-response.dto.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Permissions('STAFF_LOGIN')
  search(@Query() query: Record<string, unknown>, @Req() request: AuthenticatedRequest): Promise<SearchResponseDto> {
    const principal = request.principal!;
    return this.searchService.search(query, { userId: principal.userId, roleCode: principal.roleCode, branchId: principal.branchId });
  }
}
