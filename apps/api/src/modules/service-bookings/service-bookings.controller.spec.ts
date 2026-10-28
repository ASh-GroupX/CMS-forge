import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';

test('service-bookings controller can be constructed', () => {
  assert.ok(new ServiceBookingsController(new ServiceBookingsService(new ServiceBookingsRepository(null as any))));
});

test('service-bookings controller delegates listCarModels to service without guard block', async () => {
  let calledAll = false;
  const mockService = {
    getCarModels: async (activeOnly: boolean) => {
      calledAll = !activeOnly;
      return [{ id: 'car_1', nameEn: 'Altima', nameAr: 'التيما', brand: 'Nissan', isActive: true }];
    },
  } as unknown as ServiceBookingsService;

  const controller = new ServiceBookingsController(mockService);
  const result = await controller.listCarModels('true');
  assert.equal(calledAll, true);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 'car_1');
});

test('service-bookings controller delegates listMaintenanceTypes to service without guard block', async () => {
  let calledAll = false;
  const mockService = {
    getMaintenanceTypes: async (activeOnly: boolean) => {
      calledAll = !activeOnly;
      return [{ id: 'maint_1', nameEn: 'Periodic', nameAr: 'دورية', estimatedDurationMinutes: 30, isActive: true }];
    },
  } as unknown as ServiceBookingsService;

  const controller = new ServiceBookingsController(mockService);
  const result = await controller.listMaintenanceTypes('true');
  assert.equal(calledAll, true);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 'maint_1');
});

test('service-bookings controller delegates listServiceCenters to service without guard block', async () => {
  let calledAll = false;
  const mockService = {
    getServiceCenters: async (activeOnly: boolean) => {
      calledAll = !activeOnly;
      return [{ id: 'center_1', code: 'MAIN', nameEn: 'Amman', nameAr: 'عمان', isActive: true }];
    },
  } as unknown as ServiceBookingsService;

  const controller = new ServiceBookingsController(mockService);
  const result = await controller.listServiceCenters('true');
  assert.equal(calledAll, true);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 'center_1');
});
