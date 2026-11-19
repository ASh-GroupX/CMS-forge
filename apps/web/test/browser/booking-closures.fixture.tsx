import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BookingClosuresTab } from '../../src/app/(staff)/admin/booking-settings/booking-closures-tab';

export function BookingClosuresFixture({ locale }: { locale: 'en' | 'ar' }) {
  return <main className="mx-auto max-w-5xl p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <BookingClosuresTab centers={[{ id: 'center_main', code: 'MAIN', nameEn: 'Amman Service Center', nameAr: 'مركز صيانة عمان', isActive: true }]} locale={locale} />
  </main>;
}

if (typeof document !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <BookingClosuresFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
}
