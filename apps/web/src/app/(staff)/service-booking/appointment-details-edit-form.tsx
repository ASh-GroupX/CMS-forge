'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import type { ServiceBookingCopy } from '../../../i18n/staff-service-booking';
import type { CarModel, MaintenanceType, ServiceAppointment } from '../../../lib/staff-service-bookings-api';
import { updateAppointmentAction } from './actions';
import { CarModelSelector } from './car-model-selector';
import { MaintenanceTypeSelector, isPeriodicMaintenanceType } from './maintenance-type-selector';

export function AppointmentDetailsEditForm({ appointment, carModels, maintenanceTypes, isAr, onSuccess, t }: {
  appointment: ServiceAppointment; carModels: CarModel[]; maintenanceTypes: MaintenanceType[]; isAr: boolean;
  onSuccess: (updated: ServiceAppointment) => void; t: ServiceBookingCopy;
}) {
  const [name, setName] = useState(appointment.customerName);
  const [phone, setPhone] = useState(appointment.customerPhone);
  const [vin, setVin] = useState(appointment.vin ?? '');
  const [carModelId, setCarModelId] = useState(appointment.carModelId);
  const [maintenanceTypeId, setMaintenanceTypeId] = useState(appointment.maintenanceTypeId);
  const [mileage, setMileage] = useState<number | null>(appointment.periodicMileageKm ?? null);
  const [notes, setNotes] = useState(appointment.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const periodic = maintenanceTypes.find((type) => type.id === maintenanceTypeId);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!carModelId || !maintenanceTypeId || periodic && isPeriodicMaintenanceType(periodic) && mileage == null) {
      setError(t.modal.mileageRequired); return;
    }
    setSaving(true); setError(null);
    const result = await updateAppointmentAction(appointment.id, {
      customerName: name.trim(), customerPhone: phone.trim(), vin: vin.trim() || null,
      notes: notes.trim(),
      ...(carModelId !== appointment.carModelId ? { carModelId } : {}),
      ...(maintenanceTypeId !== appointment.maintenanceTypeId ? { maintenanceTypeId, periodicMileageKm: mileage } :
        mileage !== (appointment.periodicMileageKm ?? null) ? { periodicMileageKm: mileage } : {}),
    });
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    onSuccess(result.appointment as ServiceAppointment);
  };

  return <form className="max-h-[55vh] space-y-3 overflow-y-auto pe-1" onSubmit={save}>
    {error && <p role="alert" className="text-sm text-status-error">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t.modal.customerName}><Input aria-label={t.modal.customerName} required value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label={t.modal.customerPhone}><Input aria-label={t.modal.customerPhone} required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
    </div>
    <CarModelSelector carModelId={carModelId} carModels={carModels} isAr={isAr} noCarFoundText={t.modal.noCarFound}
      onSelect={setCarModelId} searchPlaceholder={t.modal.searchCarModel} selectPlaceholder={t.modal.selectCarModel} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t.modal.vin}><Input aria-label={t.modal.vin} value={vin} onChange={(event) => setVin(event.target.value)} /></Field>
      <MaintenanceTypeSelector isAr={isAr} maintenanceTypeId={maintenanceTypeId} maintenanceTypes={maintenanceTypes}
        onSelect={setMaintenanceTypeId} periodicMileageKm={mileage} onMileageChange={setMileage}
        maintenanceTypeLabel={t.modal.maintenanceType} selectTypeLabel={t.modal.selectMaintenanceType}
        periodicLabel={t.modal.periodicMaintenance} mileageLabel={t.modal.periodicMileage} selectMileageLabel={t.modal.selectMileage} />
    </div>
    <Field label={t.modal.notes}><Textarea aria-label={t.modal.notes} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
    <Button className="w-full" disabled={saving} type="submit">{saving ? t.modal.saving : t.modal.saveDetails}</Button>
  </form>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="space-y-1"><label className="text-xs font-semibold text-content-strong">{label}</label>{children}</div>;
}
