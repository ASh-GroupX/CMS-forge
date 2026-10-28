import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale, staffShellText } from '../../../i18n/staff-shell';
import {
  fetchCarModels,
  fetchMaintenanceTypes,
  fetchServiceAppointments,
  fetchServiceCenters,
  type CarModel,
  type MaintenanceType,
  type ServiceAppointment,
  type ServiceCenter,
} from '../../../lib/staff-service-bookings-api';
import { ServiceBookingProvider } from './service-booking-context';
import { ServiceBookingView } from './service-booking-view';

type SearchParams = {
  locale?: string | string[];
  date?: string;
};

export default async function ServiceBookingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || requestHeaders.get('x-cms-locale') || undefined);
  const shell = staffShellText[locale];

  const todayStr = params?.date || new Date().toISOString().slice(0, 10);
  const cookieHeader = requestHeaders.get('cookie') ?? '';

  // Parallel data fetching with forwarded cookie header
  const [fetchedCenters, carModels, maintenanceTypes, appointments] = await Promise.all([
    fetchServiceCenters(true, cookieHeader).catch(() => [] as ServiceCenter[]),
    fetchCarModels(true, cookieHeader).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(true, cookieHeader).catch(() => [] as MaintenanceType[]),
    fetchServiceAppointments({}, cookieHeader).catch(() => [] as ServiceAppointment[]),
  ]);

  let branches = fetchedCenters.map((c) => ({
    id: c.id,
    code: c.code,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
  }));

  if (branches.length === 0) {
    branches = [
      { id: 'center_main', code: 'MAIN_CENTER', nameEn: 'AMMAN Service Center', nameAr: 'مركز صيانة عمان' },
      { id: 'center_north', code: 'NORTH_CENTER', nameEn: 'North Service Center', nameAr: 'مركز صيانة الشمال' },
    ];
  }

  const effectiveCarModels: CarModel[] = carModels.length > 0 ? carModels : [
    { id: 'car_tiggo8_pro', nameEn: 'Chery Tiggo 8 Pro', nameAr: 'شيري تيجو 8 برو', brand: 'Chery', isActive: true },
    { id: 'car_tiggo7_pro', nameEn: 'Chery Tiggo 7 Pro', nameAr: 'شيري تيجو 7 برو', brand: 'Chery', isActive: true },
    { id: 'car_tiggo4_pro', nameEn: 'Chery Tiggo 4 Pro', nameAr: 'شيري تيجو 4 برو', brand: 'Chery', isActive: true },
    { id: 'car_arrizo6_pro', nameEn: 'Chery Arrizo 6 Pro', nameAr: 'شيري أريزو 6 برو', brand: 'Chery', isActive: true },
    { id: 'car_model_patrol', nameEn: 'Nissan Patrol', nameAr: 'نيسان باترول', brand: 'Nissan', isActive: true },
    { id: 'car_model_sunny', nameEn: 'Nissan Sunny', nameAr: 'نيسان صني', brand: 'Nissan', isActive: true },
  ];

  const effectiveMaintenanceTypes: MaintenanceType[] = maintenanceTypes.length > 0 ? maintenanceTypes : [
    { id: 'maint_periodic_10k', nameEn: 'Periodic Maintenance 10,000 km', nameAr: 'صيانة دورية 10,000 كم', estimatedDurationMinutes: 30, isActive: true },
    { id: 'maint_periodic_20k', nameEn: 'Periodic Maintenance 20,000 km', nameAr: 'صيانة دورية 20,000 كم', estimatedDurationMinutes: 45, isActive: true },
    { id: 'maint_periodic_40k', nameEn: 'Periodic Maintenance 40,000 km', nameAr: 'صيانة دورية 40,000 كم', estimatedDurationMinutes: 60, isActive: true },
    { id: 'maint_oil_filter', nameEn: 'Oil and Filter Change', nameAr: 'تغيير زيت وفلتر', estimatedDurationMinutes: 30, isActive: true },
    { id: 'maint_brake_pads', nameEn: 'Brake Pads & Discs Service', nameAr: 'فحص واستبدال فحمات وفرامل', estimatedDurationMinutes: 45, isActive: true },
    { id: 'maint_general_check', nameEn: 'Comprehensive Inspection', nameAr: 'فحص شامل وفحص كمبيوتر', estimatedDurationMinutes: 60, isActive: true },
  ];

  return (
    <section aria-label="Service Center Booking" className="grid gap-4 w-full" dir={shell.dir}>
      <ServiceBookingProvider
        initialAppointments={appointments}
        initialBranches={branches}
        initialCarModels={effectiveCarModels}
        initialDate={todayStr}
        initialMaintenanceTypes={effectiveMaintenanceTypes}
        locale={locale}
      >
        <ServiceBookingView />
      </ServiceBookingProvider>
    </section>
  );
}
