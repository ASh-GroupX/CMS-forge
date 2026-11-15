'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { AmmanNotesImportTab } from '../../src/app/(staff)/admin/booking-settings/amman-notes-import-tab';

export function AmmanNotesImportFixture({ locale }: { locale: 'en' | 'ar' }) {
  return <main className="mx-auto max-w-4xl bg-surface p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <AmmanNotesImportTab locale={locale} carModels={[
      { id: 'mage', brand: 'Dongfeng', nameEn: 'Dongfeng Mage ICE', nameAr: 'ماج', isActive: true },
      { id: 'nami', brand: 'Dongfeng', nameEn: 'Dongfeng Nammi-01 EV 430 KM Plus CCC', nameAr: 'نامي', isActive: true },
      { id: 'vigo', brand: 'Dongfeng', nameEn: 'Dongfeng Nammi-06 VIGO EV 410 KM E1 GCC', nameAr: 'فيجو', isActive: true },
      { id: 'friday', brand: 'Forthing', nameEn: 'Forthing Friday EV', nameAr: 'فرايدي', isActive: true },
    ]} maintenanceTypes={[{ id: 'notes-type', nameEn: 'Notes', nameAr: 'ملاحظات', estimatedDurationMinutes: 15, isActive: true }]} />
  </main>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!,
  <AmmanNotesImportFixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
