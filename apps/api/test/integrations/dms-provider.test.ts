import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { InMemoryDmsProvider, type DmsProviderPort } from '../../src/modules/integrations/dms-provider.port.ts';
import { IntegrationsController } from '../../src/modules/integrations/integrations.controller.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';

test('integrations dms lookup returns a safe single match with diagnostics', async () => {
  const service = serviceWith(
    new InMemoryDmsProvider({
      status: 'MATCH',
      matches: [
        {
          customerCode: 'DMS-100',
          customerName: 'Nadia Saleh',
          primaryPhone: '+201001112222',
          vin: 'abc123456789',
          plateNumber: 'EG-123',
          brand: 'Toyota',
          model: 'Corolla',
          modelYear: 2023,
          warrantyStatus: 'active',
          source: 'DMS',
        },
      ],
    }),
  );

  const result = await service.lookupDmsCustomerVehicle({ vin: 'abc123456789', correlationId: 'req_1' });

  assert.equal(result.result, 'MATCH');
  assert.equal(result.correlationId, 'req_1');
  assert.equal(result.action, 'customerVehicleLookup');
  assert.equal(result.manualFallbackAllowed, false);
  assert.equal(result.matches[0]?.source, 'DMS');
  assert.equal(result.matches[0]?.vin, 'ABC123456789');
});

test('integrations dms lookup preserves multiple selectable matches', async () => {
  const service = serviceWith(
    new InMemoryDmsProvider({
      status: 'MATCH',
      matches: [
        match('DMS-1', 'Mona Adel', '+201001112222', 'WBA12345678900001'),
        match('DMS-2', 'Mona Adel', '+201009998888', 'WBA12345678900002'),
      ],
    }),
  );

  const result = await service.lookupDmsCustomerVehicle({ name: 'Mona Adel', correlationId: 'req_2' });

  assert.equal(result.result, 'MULTIPLE_MATCHES');
  assert.equal(result.matches.length, 2);
  assert.deepEqual(
    result.matches.map((item) => [item.customerCode, item.primaryPhone, item.vin]),
    [
      ['DMS-1', '+201001112222', 'WBA12345678900001'],
      ['DMS-2', '+201009998888', 'WBA12345678900002'],
    ],
  );
});

test('integrations dms lookup allows manual fallback for not-found and disabled outcomes', async () => {
  const notFound = await serviceWith(new InMemoryDmsProvider({ status: 'NOT_FOUND' })).lookupDmsCustomerVehicle({
    phone: '+201001112222',
    correlationId: 'req_3',
  });
  const disabled = await serviceWith(new InMemoryDmsProvider()).lookupDmsCustomerVehicle({
    customerNumber: 'DMS-404',
    correlationId: 'req_4',
  });

  assert.equal(notFound.result, 'NOT_FOUND');
  assert.equal(notFound.manualFallbackAllowed, true);
  assert.equal(disabled.result, 'DISABLED');
  assert.equal(disabled.manualFallbackAllowed, true);
});

test('integrations dms lookup defaults to disabled manual pilot mode', async () => {
  const result = await new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, {} as never)
    .lookupDmsCustomerVehicle({ phone: '+201001112222', correlationId: 'req_manual_scope' });

  assert.equal(result.provider, 'in-memory');
  assert.equal(result.result, 'DISABLED');
  assert.equal(result.manualFallbackAllowed, true);
  assert.deepEqual(result.matches, []);
  assert.equal(result.correlationId, 'req_manual_scope');
});

test('integrations dms lookup converts provider failure to safe provider-down result', async () => {
  const provider: DmsProviderPort = {
    async lookupCustomerVehicle() {
      throw new Error('dms-secret-value');
    },
  };

  const result = await serviceWith(provider).lookupDmsCustomerVehicle({ vin: 'WBA12345678900001', correlationId: 'req_5' });
  const response = JSON.stringify(result);

  assert.equal(result.result, 'PROVIDER_DOWN');
  assert.equal(result.manualFallbackAllowed, true);
  assert.equal(response.includes('dms-secret-value'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

test('integrations dms lookup validates input before provider access', async () => {
  const provider = new InMemoryDmsProvider({ status: 'MATCH', matches: [match('DMS-1', 'Nadia Saleh', '+201001112222')] });
  const service = serviceWith(provider);

  await assert.rejects(
    service.lookupDmsCustomerVehicle({ phone: 'bad\nphone' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.lookupDmsCustomerVehicle({}),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(provider.lookups.length, 0);
});

test('integrations dms lookup result exposes no provider credentials', async () => {
  process.env.DMS_PROVIDER_SECRET = 'do-not-return';
  const result = await serviceWith(new InMemoryDmsProvider({ status: 'MATCH', matches: [match('DMS-1', 'Nadia', '+201001112222')] }))
    .lookupDmsCustomerVehicle({ customerNumber: 'DMS-1', correlationId: 'req_6' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

test('staff dms lookup route delegates safe query fields and server correlation id', async () => {
  const provider = new InMemoryDmsProvider({ status: 'MATCH', matches: [match('DMS-1', 'Nadia', '+201001112222')] });
  const controller = new IntegrationsController(serviceWith(provider));

  const response = await controller.lookupDmsCustomerVehicle(
    { vin: 'abc123456789', phone: '+201001112222' },
    request(staff, '/integrations/dms/customer-vehicle?vin=abc123456789'),
  );

  assert.equal(response.lookup.result, 'MATCH');
  assert.equal(response.lookup.correlationId, 'req_dms');
  assert.equal(provider.lookups[0]?.vin, 'ABC123456789');
  assert.equal(provider.lookups[0]?.correlationId, 'req_dms');
  assert.equal(JSON.stringify(response).includes('credential'), false);
});

test('staff dms lookup route is session and permission guarded', () => {
  assert.deepEqual(guardNames('lookupDmsCustomerVehicle'), ['SessionAuthGuard', 'PermissionGuard']);
});

test('staff dms lookup permission allows intake staff and denies missing permission safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request(staff), IntegrationsController.prototype.lookupDmsCustomerVehicle)), true);
  await assert.rejects(
    guard.canActivate(context(request({ ...staff, permissions: [] }, '/integrations/dms/customer-vehicle?password=leaked'), IntegrationsController.prototype.lookupDmsCustomerVehicle)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['COMPLAINT_CREATE']);
  assert.equal(JSON.stringify(auditRecords).toLowerCase().includes('leaked'), false);
});

test('staff dms lookup session guard rejects missing staff session', async () => {
  const guard = new SessionAuthGuard({ validateStaffSession: async () => staff });

  await assert.rejects(
    guard.canActivate(context({ headers: {} } as AuthenticatedRequest, IntegrationsController.prototype.lookupDmsCustomerVehicle)),
    (error: unknown) => error instanceof AppException && error.code === 'AUTH_INVALID_CREDENTIALS',
  );
});

test('staff dms lookup OpenAPI documents safe read-only route', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));
  const operation = openapi.paths['/integrations/dms/customer-vehicle']?.get;

  assert.ok(operation);
  assert.equal(operation.operationId, 'integrationDmsCustomerVehicleLookup');
  assert.equal(JSON.stringify(operation).includes('DmsLookupResponse'), true);
  assert.equal(JSON.stringify(openapi.components.schemas.DmsCustomerVehicleMatch).includes('source'), true);
});

function serviceWith(provider: DmsProviderPort): IntegrationsService {
  return new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, {} as never, provider);
}

function match(customerCode: string, customerName: string, primaryPhone: string, vin?: string) {
  return {
    customerCode,
    customerName,
    primaryPhone,
    vin,
    brand: 'Toyota',
    model: 'Corolla',
    source: 'DMS' as const,
  };
}

const staff: StaffPrincipal = {
  sessionId: 'ses_dms',
  userId: 'usr_dms',
  email: 'staff@cms-auto.test',
  nameEn: 'Staff User',
  nameAr: 'Staff User',
  roleCode: 'CR_OFFICER',
  permissions: ['COMPLAINT_CREATE'],
  branchId: 'branch-a',
};

function request(principal: StaffPrincipal, url = '/integrations/dms/customer-vehicle'): AuthenticatedRequest {
  return {
    principal,
    method: 'GET',
    url,
    correlationId: 'req_dms',
    headers: { 'x-forwarded-for': '203.0.113.10', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.10' },
  };
}

function context(req: AuthenticatedRequest, handler: typeof IntegrationsController.prototype.lookupDmsCustomerVehicle): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => IntegrationsController,
  } as ExecutionContext;
}

function guardNames(handler: keyof IntegrationsController): string[] {
  return (Reflect.getMetadata(GUARDS_METADATA, IntegrationsController.prototype[handler]) as Array<{ name: string }>).map(({ name }) => name);
}
