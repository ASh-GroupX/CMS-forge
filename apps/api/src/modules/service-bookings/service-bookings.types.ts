import type { Prisma } from '@prisma/client';

export const appointmentSelect = {
  id: true,
  referenceNumber: true,
  branchId: true,
  serviceCenterId: true,
  customerName: true,
  customerPhone: true,
  vin: true,
  carModelId: true,
  carModelName: true,
  maintenanceTypeId: true,
  maintenanceTypeName: true,
  notes: true,
  date: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  status: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, nameEn: true, nameAr: true, email: true },
  },
  serviceCenter: {
    select: { id: true, code: true, nameEn: true, nameAr: true },
  },
  branch: {
    select: { id: true, code: true, nameEn: true, nameAr: true },
  },
} satisfies Prisma.ServiceAppointmentSelect;

export type AppointmentRecord = Prisma.ServiceAppointmentGetPayload<{ select: typeof appointmentSelect }>;
export type ServiceBookingClient = Pick<
  Prisma.TransactionClient,
  'serviceAppointment' | 'serviceBookingRule' | 'serviceCarModel' | 'serviceMaintenanceType' | 'serviceCenter'
>;
