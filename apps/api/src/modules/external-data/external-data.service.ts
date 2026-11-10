import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { CustomersService } from '../customers/customers.service.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { ServiceBookingsExportService } from '../service-bookings/service-bookings.export.service.js';
import { InternalTicketsService } from '../internal-tickets/internal-tickets.service.js';
import type { IntegrationApiRequest } from '../integrations/integration-api-key.guard.js';

export type ExportResource = 'customers' | 'complaints' | 'tasks' | 'appointments' | 'tickets';

@Injectable()
export class ExternalDataService {
  constructor(
    private readonly customers: CustomersService,
    private readonly complaints: ComplaintsService,
    private readonly tasks: TasksService,
    private readonly bookings: ServiceBookingsExportService,
    private readonly tickets: InternalTicketsService,
    private readonly audit: AuditService,
  ) {}

  async page(resource: ExportResource, query: Record<string, unknown>, request: IntegrationApiRequest) {
    const key = request.integrationApiKey;
    if (!key) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Integration key required', HttpStatus.UNAUTHORIZED);
    if (!key.scopes.includes(`${resource}:read`)) {
      throw new AppException('RBAC_FORBIDDEN', 'Resource outside integration key scope', HttpStatus.FORBIDDEN);
    }
    const limit = pageLimit(query.limit);
    const cursor = query.cursor === undefined ? undefined : queryString(query.cursor, 'cursor');
    const requestedBranch = query.branchId === undefined ? undefined : queryString(query.branchId, 'branchId');
    if (requestedBranch && !key.allBranches && !key.branchIds.includes(requestedBranch)) {
      throw new AppException('RBAC_FORBIDDEN', 'Branch outside integration key scope', HttpStatus.FORBIDDEN);
    }
    const branchIds = requestedBranch ? [requestedBranch] : key.allBranches ? null : key.branchIds;
    const page = resource === 'customers' ? await this.customers.exportPage(branchIds, limit, cursor)
      : resource === 'complaints' ? await this.complaints.exportPage(branchIds, limit, cursor)
      : resource === 'tasks' ? await this.tasks.exportPage(branchIds, limit, cursor)
      : resource === 'appointments' ? await this.bookings.exportPage(branchIds, limit, cursor)
      : await this.tickets.exportPage(branchIds, limit, cursor);
    await this.audit.record({
      eventType: 'REPORT', action: 'integration_data_page_read', actorId: key.createdById,
      branchId: null, targetType: 'integration_api_key', targetId: key.keyId,
      correlationId: request.correlationId ?? null,
      metadata: { resource, branchIds: branchIds ?? 'ALL', rowCount: page.items.length, nextCursor: page.nextCursor },
    });
    return page;
  }

  async events(resource: 'complaints' | 'tickets', id: string, query: Record<string, unknown>, request: IntegrationApiRequest) {
    const key = request.integrationApiKey;
    if (!key) throw new AppException('AUTH_INVALID_CREDENTIALS', 'Integration key required', HttpStatus.UNAUTHORIZED);
    if (!key.scopes.includes(`${resource}:read`)) {
      throw new AppException('RBAC_FORBIDDEN', 'Resource outside integration key scope', HttpStatus.FORBIDDEN);
    }
    const limit = pageLimit(query.limit);
    const cursor = query.cursor === undefined ? undefined : queryString(query.cursor, 'cursor');
    const requestedBranch = query.branchId === undefined ? undefined : queryString(query.branchId, 'branchId');
    if (requestedBranch && !key.allBranches && !key.branchIds.includes(requestedBranch)) {
      throw new AppException('RBAC_FORBIDDEN', 'Branch outside integration key scope', HttpStatus.FORBIDDEN);
    }
    const branchIds = requestedBranch ? [requestedBranch] : key.allBranches ? null : key.branchIds;
    const page = resource === 'complaints'
      ? await this.complaints.exportEventsPage(id, branchIds, limit, cursor)
      : await this.tickets.exportEventsPage(id, branchIds, limit, cursor);
    await this.audit.record({
      eventType: 'REPORT', action: 'integration_data_page_read', actorId: key.createdById,
      branchId: null, targetType: 'integration_api_key', targetId: key.keyId,
      correlationId: request.correlationId ?? null,
      metadata: { resource: `${resource}_events`, branchIds: branchIds ?? 'ALL', rowCount: page.items.length,
        nextCursor: page.nextCursor, recordId: id },
    });
    return page;
  }
}

function pageLimit(value: unknown): number {
  if (value === undefined) return 100;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppException('VALIDATION_FAILED', 'limit must be between 1 and 100', HttpStatus.BAD_REQUEST);
  }
  return limit;
}

function queryString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    throw new AppException('VALIDATION_FAILED', `Invalid ${field}`, HttpStatus.BAD_REQUEST);
  }
  return value.trim();
}
