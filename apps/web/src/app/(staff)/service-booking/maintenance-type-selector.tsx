'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { MaintenanceType } from '../../../lib/staff-service-bookings-api';

export const PERIODIC_MILEAGES = [1000, 5000, ...Array.from({ length: 15 }, (_, index) => (index + 1) * 10000)];
export const isPeriodicMaintenanceType = (type: MaintenanceType) =>
  type.id.startsWith('maint_periodic') || /^Periodic Maintenance\b/i.test(type.nameEn) || /^صيانة دورية/.test(type.nameAr);

export function MaintenanceTypeSelector({
  isAr, maintenanceTypeId, maintenanceTypes, onSelect, periodicMileageKm, onMileageChange,
  maintenanceTypeLabel, selectTypeLabel, periodicLabel, mileageLabel, selectMileageLabel,
}: {
  isAr: boolean;
  maintenanceTypeId: string;
  maintenanceTypes: MaintenanceType[];
  onSelect: (id: string) => void;
  periodicMileageKm: number | null;
  onMileageChange: (value: number | null) => void;
  maintenanceTypeLabel: string;
  selectTypeLabel: string;
  periodicLabel: string;
  mileageLabel: string;
  selectMileageLabel: string;
}) {
  const selectedPeriodic = maintenanceTypes.some((type) => type.id === maintenanceTypeId && type.isActive && isPeriodicMaintenanceType(type));
  const choices = maintenanceTypes.filter((type) => type.isActive);
  return <div className="grid gap-3">
    <div>
      <label className="mb-1 block text-xs font-bold text-content-strong" htmlFor="booking-maintenance-type">{maintenanceTypeLabel} <span className="text-status-error">*</span></label>
      <Select onValueChange={(value) => { onSelect(value); onMileageChange(null); }} value={maintenanceTypeId}>
      <SelectTrigger aria-label={maintenanceTypeLabel} className="h-11 rounded-xl border-line-subtle bg-surface" id="booking-maintenance-type">
        <SelectValue placeholder={selectTypeLabel} />
      </SelectTrigger>
      <SelectContent>
        {choices.map((type) => <SelectItem key={type.id} value={type.id}>{(isAr ? type.nameAr : type.nameEn) || periodicLabel}</SelectItem>)}
      </SelectContent>
      </Select>
    </div>
    {selectedPeriodic && <div><label className="mb-1 block text-xs font-bold text-content-strong" htmlFor="booking-periodic-mileage">{mileageLabel} <span className="text-status-error">*</span></label><Select onValueChange={(value) => onMileageChange(Number(value))} value={periodicMileageKm == null ? '' : String(periodicMileageKm)}>
      <SelectTrigger aria-label={mileageLabel} className="h-11 rounded-xl border-line-subtle bg-surface" id="booking-periodic-mileage">
        <SelectValue placeholder={selectMileageLabel} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {PERIODIC_MILEAGES.map((value) => <SelectItem key={value} value={String(value)}>{value.toLocaleString(isAr ? 'ar-JO' : 'en-US')} {isAr ? 'كم' : 'km'}</SelectItem>)}
      </SelectContent>
    </Select></div>}
  </div>;
}
