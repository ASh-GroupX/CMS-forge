import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../core/auth.guard.js';
import { AppException, AppExceptionFilter } from '../../core/http-kernel.js';
import { InternalTicketsController } from './internal-tickets.controller.js';
import { InternalTicketsService } from './internal-tickets.service.js';

test('phone duplicate HTTP endpoint enforces session auth, validates request and returns scoped ticket metadata', async () => {
  const principal = { userId: 'staff-1', departmentId: 'dept-1', roleCode: 'CR_OFFICER' };
  const ticket = { id: 'allowed', referenceNumber: 'TKT-1', title: 'Previous problem', status: 'NEW' };
  const service = new InternalTicketsService({ transaction: async (work: any) => work({
    departmentTicketCustomField: { findFirst: async ({ where }: any) => where.id === 'phone-field' && where.departmentId === 'dept-1' ? { id: 'phone-field' } : null },
    ticketCustomerPhone: { findMany: async ({ where }: any) => {
      assert.equal(where.ticket.OR[0].requestedById, 'staff-1');
      assert.equal(where.ticket.OR[2].targetDepartmentId, 'dept-1');
      return [{ ticket }];
    } },
  }) } as any, null as any);
  class PhoneTestModule {}
  Reflect.defineMetadata('design:paramtypes', [InternalTicketsService], InternalTicketsController);
  Module({ controllers: [InternalTicketsController], providers: [SessionAuthGuard,
    { provide: InternalTicketsService, useValue: service },
    { provide: SESSION_AUTH_SERVICE, useValue: { validateStaffSession: async (token: string) => {
      if (token !== 'test-session') throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
      return principal;
    } } },
  ] })(PhoneTestModule);
  const app = await NestFactory.create(PhoneTestModule, { logger: false });
  app.useGlobalFilters(new AppExceptionFilter());
  await app.listen(0, '127.0.0.1');
  const url = `http://127.0.0.1:${app.getHttpServer().address().port}/internal-tickets/phone-duplicates`;
  const input = { departmentId: 'dept-1', fieldId: 'phone-field', phone: '+962790000000', roleCode: 'ADMIN', userId: 'spoofed' };
  try {
    const denied = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(denied.status, 401);
    const request = (body: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=test-session' }, body: JSON.stringify(body) });
    const allowed = await request(input);
    assert.equal(allowed.status, 200);
    assert.deepEqual(await allowed.json(), { items: [ticket] });
    assert.equal((await request({ ...input, phone: '0790000000' })).status, 400);
    assert.equal((await request({ ...input, fieldId: 'other-field' })).status, 404);
  } finally { await app.close(); }
});
