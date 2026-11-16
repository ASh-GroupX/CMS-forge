'use client';

import React, { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { AppointmentDetailsEditForm } from '../../src/app/(staff)/service-booking/appointment-details-edit-form';
import { BookingLanesTab } from '../../src/app/(staff)/admin/booking-settings/booking-lanes-tab';
import { serviceBookingText } from '../../src/i18n/staff-service-booking';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';

const appointment: ServiceAppointment = {
  id: 'appointment-1', referenceNumber: 'REF-1', branchId: 'center_main', bookingLaneId: 'lane-notes',
  customerName: 'Maya', customerPhone: '0791234567', vin: null, carModelId: 'car-1', carModelName: 'BYD HAN',
  maintenanceTypeId: 'maint_oil_filter', maintenanceTypeName: 'Oil and Filter Change', notes: 'Check engine',
  date: '2026-11-20', startTime: '09:00', endTime: '09:30', durationMinutes: 30, status: 'BOOKED',
  createdAt: '2026-11-14T08:00:00.000Z', updatedAt: '2026-11-14T08:00:00.000Z',
};

export function BookingEditFixture({ locale }: { locale: 'en' | 'ar' }) {
  const [updated, setUpdated] = useState<ServiceAppointment | null>(null);
  const t = serviceBookingText[locale];
  return <main className="mx-auto max-w-3xl space-y-10 bg-surface p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <section aria-label={t.modal.editDetailsTab}>
      <h1 className="mb-4 text-xl font-bold">{t.modal.editDetailsTab}</h1>
      <AppointmentDetailsEditForm appointment={appointment} carModels={[{ id: 'car-1', brand: 'BYD', nameEn: 'HAN', nameAr: 'هان', isActive: true }]}
        maintenanceTypes={[
          { id: 'maint_periodic', nameEn: 'Periodic Maintenance', nameAr: 'صيانة دورية', estimatedDurationMinutes: 30, isActive: true },
          { id: 'maint_periodic_electrical_notes', nameEn: 'Periodic Maintenance with Electrical Notes', nameAr: 'صيانة دورية مع ملاحظات كهرباء', estimatedDurationMinutes: 30, isActive: true },
          { id: 'maint_periodic_mechanical_notes', nameEn: 'Periodic Maintenance with Mechanical Notes', nameAr: 'صيانة دورية مع ملاحظات ميكانيك', estimatedDurationMinutes: 30, isActive: true },
          { id: 'maint_mechanical_notes', nameEn: 'Mechanical Notes', nameAr: 'ملاحظات ميكانيك', estimatedDurationMinutes: 30, isActive: true },
          { id: 'maint_electrical_notes', nameEn: 'Electrical Notes', nameAr: 'ملاحظات كهرباء', estimatedDurationMinutes: 30, isActive: true },
          { id: 'maint_oil_filter', nameEn: 'Oil and Filter Change', nameAr: 'تغيير الزيت والفلتر', estimatedDurationMinutes: 30, isActive: false },
        ]}
        isAr={locale === 'ar'} onSuccess={setUpdated} t={t} />
      <output data-testid="updated">{updated?.maintenanceTypeId}</output>
    </section>
    <BookingLanesTab centers={[{ id: 'center_main', code: 'MAIN', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي', isActive: true }]}
      locale={locale} t={t} />
  </main>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <BookingEditFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
