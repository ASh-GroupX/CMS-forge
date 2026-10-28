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

  return (
    <section aria-label="Service Center Booking" className="grid gap-4 w-full" dir={shell.dir}>
      <ServiceBookingProvider
        initialAppointments={appointments}
        initialBranches={branches}
        initialCarModels={carModels}
        initialDate={todayStr}
        initialMaintenanceTypes={maintenanceTypes}
        locale={locale}
      >
        <ServiceBookingView />
      </ServiceBookingProvider>
    </section>
  );
}
