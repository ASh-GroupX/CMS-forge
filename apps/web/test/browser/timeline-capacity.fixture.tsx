'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ServiceBookingProvider } from '../../src/app/(staff)/service-booking/service-booking-context';
import { TimelineDayView } from '../../src/app/(staff)/service-booking/timeline-day-view';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';
import { getTodayDateString } from '../../src/app/(staff)/service-booking/service-booking-utils';

const date = new Date(Date.parse(`${getTodayDateString()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const branch = { id: 'center_main', code: 'MAIN', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي' };
const north = { id: 'center_north', code: 'NORTH', nameEn: 'North Service Center', nameAr: 'مركز الصيانة الشمالي' };
const appointments: ServiceAppointment[] = ['Customer One', 'Customer Two'].map((customerName, index) => ({
  id: `appointment-${index + 1}`, referenceNumber: `REF-${index + 1}`, branchId: branch.id,
  customerName, customerPhone: '+962790000001', carModelId: 'model-1', carModelName: 'Tiggo 8',
  maintenanceTypeId: 'service-1', maintenanceTypeName: 'A/C System Service', notes: '', date,
  startTime: '12:00', endTime: '12:15', durationMinutes: 15, status: 'BOOKED',
  createdAt: `${date}T08:00:00.000Z`, updatedAt: `${date}T08:00:00.000Z`,
}));

export function TimelineCapacityFixture({ locale }: { locale: 'en' | 'ar' }) {
  return (
    <div className="min-h-screen bg-surface-canvas p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <ServiceBookingProvider initialAppointments={appointments} initialBranches={[branch, north]} initialCarModels={[]}
        initialDate={date} initialMaintenanceTypes={[]} locale={locale}>
        <TimelineDayView />
      </ServiceBookingProvider>
    </div>
  );
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <TimelineCapacityFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
}
