export interface ServiceAppointmentDto {
  id: string;
  referenceNumber: string;
  branchId: string;
  branchNameEn?: string | undefined;
  branchNameAr?: string | undefined;
  serviceCenterId?: string | undefined;
  serviceCenterNameEn?: string | undefined;
  serviceCenterNameAr?: string | undefined;
  customerName: string;
  customerPhone: string;
  vin: string | null;
  carModelId: string | null;
  carModelName: string;
  maintenanceTypeId: string | null;
  maintenanceTypeName: string;
  notes: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  history?: ServiceAppointmentHistoryDto[];
}

export interface ServiceAppointmentHistoryDto {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
  metadata?: any;
}

export interface ServiceCenterDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface SlotAvailabilityDto {
  slot: string; // e.g. "09:15"
  hour: string; // e.g. "09:00"
  bookedCount: number;
  hourBookedCount: number;
  maxPerSlot: number;
  maxPerHour: number;
  status: 'AVAILABLE' | 'PARTIAL' | 'FULL' | 'CLOSED';
  remainingInHour: number;
  remainingInSlot: number;
}

export interface DayAvailabilityDto {
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  branchId: string;
  branchNameEn?: string;
  branchNameAr?: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxDailyAppointments: number;
  bookedDailyCount: number;
  slots: SlotAvailabilityDto[];
}

export interface CarModelDto {
  id: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  isActive: boolean;
}

export interface MaintenanceTypeDto {
  id: string;
  nameEn: string;
  nameAr: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
}

export interface BookingRuleDto {
  id: string;
  branchId: string;
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxDailyAppointments: number;
  maxPerHour: number;
  maxPerSlot: number;
  slotDurationMinutes: number;
}
