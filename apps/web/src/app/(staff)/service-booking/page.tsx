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
    fetchCarModels(true).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(true).catch(() => [] as MaintenanceType[]),
    fetchServiceAppointments({}).catch(() => [] as ServiceAppointment[]),
  ]);

  const branches = fetchedCenters.map((c) => ({
    id: c.id,
    code: c.code,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
  }));

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
