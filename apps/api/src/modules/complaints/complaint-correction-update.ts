import type { Prisma } from '@prisma/client';
import type { ComplaintCorrectionData } from './complaint-correction.js';

export function correctionUpdateData(data: ComplaintCorrectionData): Prisma.ComplaintUncheckedUpdateManyInput {
  const update: Prisma.ComplaintUncheckedUpdateManyInput = { version: { increment: 1 } };
  if (has(data, 'customerId')) update.customerId = data.customerId;
  if (has(data, 'customerDataSource')) update.customerDataSource = data.customerDataSource;
  if (has(data, 'manualCustomerFlag')) update.manualCustomerFlag = data.manualCustomerFlag;
  if (has(data, 'vehicleId')) update.vehicleId = data.vehicleId;
  if (has(data, 'vehicleDataSource')) update.vehicleDataSource = data.vehicleDataSource;
  if (has(data, 'manualVehicleFlag')) update.manualVehicleFlag = data.manualVehicleFlag;
  if (has(data, 'vehicleRelated')) update.vehicleRelated = data.vehicleRelated;
  if (has(data, 'vehicleDataUnavailableReason')) update.vehicleDataUnavailableReason = data.vehicleDataUnavailableReason;
  return update;
}

function has<T extends object, K extends PropertyKey>(value: T, key: K): value is T & Record<K, never> {
  return Object.prototype.hasOwnProperty.call(value, key);
}
