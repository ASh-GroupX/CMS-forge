import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

export const DMS_PROVIDER = Symbol('DMS_PROVIDER');

export type DmsLookupQuery = {
  phone?: string | null | undefined;
  customerNumber?: string | null | undefined;
  vin?: string | null | undefined;
  name?: string | null | undefined;
  correlationId?: string | null | undefined;
};

export type DmsLookupStatus = 'MATCH' | 'MULTIPLE_MATCHES' | 'NOT_FOUND' | 'PROVIDER_DOWN' | 'DISABLED';

export type DmsCustomerVehicleMatch = {
  customerCode?: string | undefined;
  customerName: string;
  primaryPhone: string;
  secondaryPhone?: string | undefined;
  email?: string | undefined;
  vin?: string | undefined;
  plateNumber?: string | undefined;
  brand?: string | undefined;
  model?: string | undefined;
  modelYear?: number | undefined;
  saleDate?: string | undefined;
  warrantyStatus?: string | undefined;
  serviceBranch?: string | undefined;
  salesBranch?: string | undefined;
  source: 'DMS';
};

export type DmsProviderResponse = {
  status: DmsLookupStatus;
  matches?: DmsCustomerVehicleMatch[];
};

export type DmsLookupResult = {
  provider: 'in-memory';
  action: 'customerVehicleLookup';
  result: DmsLookupStatus;
  latencyMs: number;
  correlationId: string;
  manualFallbackAllowed: boolean;
  matches: DmsCustomerVehicleMatch[];
};

export interface DmsProviderPort {
  lookupCustomerVehicle(input: DmsLookupQuery): Promise<DmsProviderResponse>;
}

@Injectable()
export class InMemoryDmsProvider implements DmsProviderPort {
  readonly lookups: DmsLookupQuery[] = [];

  constructor(private readonly response: DmsProviderResponse = { status: 'DISABLED' }) {}

  async lookupCustomerVehicle(input: DmsLookupQuery): Promise<DmsProviderResponse> {
    this.lookups.push(input);
    return this.response;
  }
}

export function validateDmsLookupQuery(input: DmsLookupQuery): DmsLookupQuery {
  const query = {
    phone: optionalText(input.phone),
    customerNumber: optionalText(input.customerNumber),
    vin: optionalText(input.vin)?.toUpperCase(),
    name: optionalText(input.name),
    correlationId: optionalText(input.correlationId) ?? 'dms_lookup',
  };

  if (!query.phone && !query.customerNumber && !query.vin && !query.name) throw invalidDmsLookup('query');
  if (query.phone && !/^\+?[0-9][0-9\s-]{6,20}$/.test(query.phone)) throw invalidDmsLookup('phone');
  if (query.vin && !/^[A-HJ-NPR-Z0-9]{6,17}$/.test(query.vin)) throw invalidDmsLookup('vin');

  return query;
}

export function normalizeDmsLookupResult(
  response: DmsProviderResponse,
  query: DmsLookupQuery,
  latencyMs: number,
): DmsLookupResult {
  const matches = (response.matches ?? []).map(normalizeMatch);
  const result = normalizedStatus(response.status, matches.length);

  return {
    provider: 'in-memory',
    action: 'customerVehicleLookup',
    result,
    latencyMs: Math.max(0, Math.round(latencyMs)),
    correlationId: query.correlationId ?? 'dms_lookup',
    manualFallbackAllowed: result === 'NOT_FOUND' || result === 'PROVIDER_DOWN' || result === 'DISABLED',
    matches: result === 'MATCH' || result === 'MULTIPLE_MATCHES' ? matches : [],
  };
}

function normalizedStatus(status: DmsLookupStatus, matchCount: number): DmsLookupStatus {
  if (status === 'PROVIDER_DOWN' || status === 'DISABLED') return status;
  if (matchCount > 1) return 'MULTIPLE_MATCHES';
  if (matchCount === 1) return 'MATCH';
  return 'NOT_FOUND';
}

function normalizeMatch(match: DmsCustomerVehicleMatch): DmsCustomerVehicleMatch {
  return {
    ...match,
    customerCode: optionalText(match.customerCode),
    customerName: requiredText(match.customerName, 'customerName'),
    primaryPhone: requiredText(match.primaryPhone, 'primaryPhone'),
    secondaryPhone: optionalText(match.secondaryPhone),
    email: optionalText(match.email),
    vin: optionalText(match.vin)?.toUpperCase(),
    plateNumber: optionalText(match.plateNumber),
    brand: optionalText(match.brand),
    model: optionalText(match.model),
    saleDate: optionalText(match.saleDate),
    warrantyStatus: optionalText(match.warrantyStatus),
    serviceBranch: optionalText(match.serviceBranch),
    salesBranch: optionalText(match.salesBranch),
    source: 'DMS',
  };
}

function optionalText(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text || /[\r\n]/.test(text)) return undefined;
  return text;
}

function requiredText(value: unknown, field: string): string {
  const text = optionalText(value);
  if (text) return text;
  throw invalidDmsLookup(field);
}

function invalidDmsLookup(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid DMS lookup request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
