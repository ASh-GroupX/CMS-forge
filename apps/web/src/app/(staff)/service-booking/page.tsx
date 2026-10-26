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

  // Parallel data fetching
  const [fetchedCenters, carModels, maintenanceTypes, appointments] = await Promise.all([
    fetchServiceCenters().catch(() => [] as ServiceCenter[]),
    fetchCarModels(false).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(false).catch(() => [] as MaintenanceType[]),
    fetchServiceAppointments({}).catch(() => [] as ServiceAppointment[]),
  ]);

  const branches =
    fetchedCenters.length > 0
      ? fetchedCenters.map((c) => ({
          id: c.id,
          code: c.code,
          nameEn: c.nameEn,
          nameAr: c.nameAr,
        }))
      : [
          { id: 'center_main', code: 'MAIN_CTR', nameEn: 'Main Service Center', nameAr: 'مركز خدمة الرئيسي' },
          { id: 'center_north', code: 'NORTH_CTR', nameEn: 'North Service Center', nameAr: 'مركز خدمة الشمال' },
        ];

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
