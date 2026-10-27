import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { serviceBookingText } from '../../../../i18n/staff-service-booking';
import {
  fetchBranchRules,
  fetchCarModels,
  fetchMaintenanceTypes,
  fetchServiceCenters,
  type CarModel,
  type DayRule,
  type MaintenanceType,
  type ServiceCenter,
} from '../../../../lib/staff-service-bookings-api';
import { BookingSettingsView } from './booking-settings-view';

type SearchParams = { locale?: string | string[] };

export default async function BookingSettingsAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(params?.locale || requestHeaders.get('x-cms-locale') || undefined);
  const t = serviceBookingText[locale] || serviceBookingText.en;

  const centers = await fetchServiceCenters(false).catch(() => [] as ServiceCenter[]);

  // Fetch data in parallel
  const [carModels, maintenanceTypes, ...rulesLists] = await Promise.all([
    fetchCarModels(false).catch(() => [] as CarModel[]),
    fetchMaintenanceTypes(false).catch(() => [] as MaintenanceType[]),
    ...centers.map((c) => fetchBranchRules(c.id).catch(() => [] as DayRule[])),
  ]);

  const rulesByBranch: Record<string, DayRule[]> = {};
  centers.forEach((c, idx) => {
    rulesByBranch[c.id] = rulesLists[idx] || [];
  });

  return (
    <section aria-label={t.adminSettings.title} className="w-full">
      <BookingSettingsView
        carModels={carModels}
        centers={centers}
        locale={locale}
        maintenanceTypes={maintenanceTypes}
        rulesByBranch={rulesByBranch}
        t={t}
      />
    </section>
  );
}
