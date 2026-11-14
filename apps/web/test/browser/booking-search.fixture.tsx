'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ServiceBookingProvider, useServiceBooking } from '../../src/app/(staff)/service-booking/service-booking-context';
import { BookingSearch } from '../../src/app/(staff)/service-booking/booking-search';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';

const branches = [
  { id: 'center_main', code: 'MAIN_CENTER', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي' },
  { id: 'center_north', code: 'NORTH_CENTER', nameEn: 'North Service Center', nameAr: 'مركز الصيانة الشمالي' },
];
const appointments: ServiceAppointment[] = [
  { id: 'old', referenceNumber: 'BOOK-OLD', branchId: 'center_main', customerName: 'Alice Example', customerPhone: '+962 79 111 2233', carModelId: 'car', carModelName: 'Tiggo 8', maintenanceTypeId: 'type', maintenanceTypeName: 'Service', notes: '', date: '2026-10-15', startTime: '09:00', endTime: '09:15', durationMinutes: 15, status: 'BOOKED', createdAt: '2026-10-01T08:00:00Z', updatedAt: '2026-10-01T08:00:00Z' },
  { id: 'recent', referenceNumber: 'BOOK-RECENT', branchId: 'center_north', customerName: 'Alice Example', customerPhone: '+962 79 111 2233', carModelId: 'car', carModelName: 'Tiggo 8', maintenanceTypeId: 'type', maintenanceTypeName: 'Service', notes: '', date: '2026-11-05', startTime: '12:00', endTime: '12:15', durationMinutes: 15, status: 'CANCELLED', createdAt: '2026-11-01T08:00:00Z', updatedAt: '2026-11-01T08:00:00Z' },
  { id: 'arabic', referenceNumber: 'BOOK-AR', branchId: 'center_main', customerName: 'أحمد علي', customerPhone: '٠٧٩٨٨٨٤٤٤٤', carModelId: 'car', carModelName: 'Tiggo 8', maintenanceTypeId: 'type', maintenanceTypeName: 'Service', notes: '', date: '2026-11-07', startTime: '15:00', endTime: '15:15', durationMinutes: 15, status: 'CONFIRMED', createdAt: '2026-11-01T08:00:00Z', updatedAt: '2026-11-01T08:00:00Z' },
];

function SelectionProbe() {
  const { isDetailModalOpen, selectedAppointment, selectedBranchIds, selectedDate, view } = useServiceBooking();
  return <div data-branch={selectedBranchIds.join(',')} data-date={selectedDate} data-detail-open={isDetailModalOpen} data-selected-id={selectedAppointment?.id ?? ''} data-view={view} id="selection-probe" />;
}

export function BookingSearchFixture({ locale, loadError = false }: { locale: 'en' | 'ar'; loadError?: boolean }) {
  return <div className="min-h-screen bg-surface-canvas p-4 sm:p-8" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <ServiceBookingProvider initialAppointments={appointments} initialBranches={branches} initialCarModels={[]} initialDate="2026-11-11" initialMaintenanceTypes={[]} locale={locale}>
      <div className="mx-auto max-w-5xl"><BookingSearch loadError={loadError} /></div>
      <SelectionProbe />
    </ServiceBookingProvider>
  </div>;
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <BookingSearchFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} loadError={document.documentElement.dataset.loadError === '1'} />);
}
