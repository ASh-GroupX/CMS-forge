'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ServiceBookingProvider } from '../../src/app/(staff)/service-booking/service-booking-context';
import { TimelineSidebar } from '../../src/app/(staff)/service-booking/timeline-sidebar';
import { NewAppointmentModal } from '../../src/app/(staff)/service-booking/new-appointment-modal';
import { getTodayDateString } from '../../src/app/(staff)/service-booking/service-booking-utils';

export const proofDate = new Date(Date.parse(`${getTodayDateString()}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
export const proofBranch = { id: 'center_main', code: 'MAIN', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي' };

export function BookingSuggestionsFixture({ locale }: { locale: 'en' | 'ar' }) {
  return <main className="min-h-screen bg-surface-canvas p-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <ServiceBookingProvider initialAppointments={[]} initialBranches={[proofBranch]} initialCarModels={[
      { id: 'car-1', brand: 'BYD', nameEn: 'Song L', nameAr: 'سونغ إل', isActive: true },
    ]} initialDate={proofDate} initialMaintenanceTypes={[
      { id: 'maint_periodic_10k', nameEn: 'Periodic Maintenance 10,000 km', nameAr: 'صيانة دورية 10,000 كم', estimatedDurationMinutes: 30, isActive: true },
      { id: 'maint_periodic_20k', nameEn: 'Periodic Maintenance 20,000 km', nameAr: 'صيانة دورية 20,000 كم', estimatedDurationMinutes: 45, isActive: true },
      { id: 'maint_periodic_40k', nameEn: 'Periodic Maintenance 40,000 km', nameAr: 'صيانة دورية 40,000 كم', estimatedDurationMinutes: 60, isActive: true },
      { id: 'maint_oil_filter', nameEn: 'Oil and Filter Change', nameAr: 'تغيير زيت وفلتر', estimatedDurationMinutes: 30, isActive: true },
    ]} locale={locale}>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[18rem_1fr]">
        <TimelineSidebar />
        <div className="rounded-2xl border border-line-subtle bg-surface p-6 text-content-muted">Booking schedule</div>
      </div>
      <NewAppointmentModal />
    </ServiceBookingProvider>
  </main>;
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <BookingSuggestionsFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
}
