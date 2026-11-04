import React, { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { CarModelSelector } from '../../src/app/(staff)/service-booking/car-model-selector';
import { serviceBookingText } from '../../src/i18n/staff-service-booking';
import { CarModelsTab } from '../../src/app/(staff)/admin/booking-settings/car-models-tab';

export function BookingFixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const [id, setId] = useState('');
  const copy = serviceBookingText[locale].modal;
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-lg space-y-4 p-6">
    <h1>{copy.newTitle}</h1>
    <CarModelSelector carModelId={id} onSelect={setId} isAr={locale === 'ar'}
      searchPlaceholder={copy.searchCarModel} selectPlaceholder={copy.selectCarModel} noCarFoundText={copy.noCarFound}
      carModels={[
        { id: 'baic-1', brand: 'BAIC', nameEn: 'BJ30', nameAr: 'بي جي ٣٠', isActive: true },
        { id: 'baic-2', brand: 'BAIC', nameEn: 'BJ40', nameAr: 'بي جي ٤٠', isActive: true },
        { id: 'byd-1', brand: 'BYD', nameEn: 'HAN', nameAr: 'هان', isActive: true },
        { id: 'hidden', brand: 'Inactive', nameEn: 'Hidden', nameAr: 'مخفي', isActive: false },
      ]} />
    <output data-testid="selected">{id}</output>
    <CarModelsTab initialCarModels={[]} locale={locale} t={serviceBookingText[locale]} />
  </main>;
}
if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <BookingFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
