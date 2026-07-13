import type { DmsLookupQuery, DmsLookupResult } from '../dms-provider.port.js';
import type { AuthenticatedRequest } from '../../../core/auth.guard.js';

export type DmsLookupQueryDto = Record<string, string | string[] | undefined>;

export type DmsLookupResponseDto = {
  lookup: DmsLookupResult;
};

export function toDmsLookupQuery(query: DmsLookupQueryDto, request: AuthenticatedRequest): DmsLookupQuery {
  return {
    phone: text(query.phone),
    customerNumber: text(query.customerNumber),
    vin: text(query.vin),
    name: text(query.name),
    correlationId: request.correlationId ?? text(request.headers['x-correlation-id']) ?? undefined,
  };
}

function text(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0]?.trim() || undefined : value?.trim() || undefined;
}
