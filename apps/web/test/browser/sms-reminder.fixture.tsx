import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Toaster } from '../../src/components/ui/sonner';
import { BookingSettingsView } from '../../src/app/(staff)/admin/booking-settings/booking-settings-view';
import { serviceBookingText } from '../../src/i18n/staff-service-booking';

export function SmsReminderFixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-4 p-6">
    <BookingSettingsView centers={[{ id: 'center-main', code: 'MAIN', nameEn: 'Main Service Center', nameAr: 'مركز الصيانة الرئيسي', isActive: true }]}
      carModels={[]} locale={locale} maintenanceTypes={[]} rulesByBranch={{}} t={serviceBookingText[locale]} />
    <Toaster />
  </main>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <SmsReminderFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
