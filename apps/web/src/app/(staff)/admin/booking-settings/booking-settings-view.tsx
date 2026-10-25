'use client';

import React, { useState } from 'react';
import { Building2, Calendar, Car, Clock, Wrench } from 'lucide-react';
import { BranchHoursTab } from './branch-hours-tab';
import { CarModelsTab } from './car-models-tab';
import { MaintenanceTypesTab } from './maintenance-types-tab';
import { BranchNamesTab } from './branch-names-tab';
import type { CarModel, DayRule, MaintenanceType } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function BookingSettingsView({
  branches,
  carModels,
  locale,
  maintenanceTypes,
  rulesByBranch,
  t,
}: {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  carModels: CarModel[];
  locale: Locale;
  maintenanceTypes: MaintenanceType[];
  rulesByBranch: Record<string, DayRule[]>;
  t: ServiceBookingCopy;
}) {
  const [activeTab, setActiveTab] = useState<'hours' | 'cars' | 'maintenance' | 'branches'>('hours');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-line-subtle bg-surface/80 p-6 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight text-content-strong">
          {t.adminSettings.title}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          {t.adminSettings.subtitle}
        </p>

        {/* Tab Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line-subtle/80 pt-4">
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'hours'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('hours')}
            type="button"
          >
            <Clock className="size-4" />
            <span>{t.adminSettings.tabHours}</span>
          </button>

          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'cars'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('cars')}
            type="button"
          >
            <Car className="size-4" />
            <span>{t.adminSettings.tabCarModels}</span>
          </button>

          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'maintenance'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('maintenance')}
            type="button"
          >
            <Wrench className="size-4" />
            <span>{t.adminSettings.tabMaintenance}</span>
          </button>

          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'branches'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('branches')}
            type="button"
          >
            <Building2 className="size-4" />
            <span>{t.adminSettings.tabBranches}</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'hours' && (
          <BranchHoursTab
            branches={branches}
            initialRulesByBranch={rulesByBranch}
            locale={locale}
            t={t}
          />
        )}
        {activeTab === 'cars' && (
          <CarModelsTab
            initialCarModels={carModels}
            locale={locale}
            t={t}
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTypesTab
            initialMaintenanceTypes={maintenanceTypes}
            locale={locale}
            t={t}
          />
        )}
        {activeTab === 'branches' && (
          <BranchNamesTab
            branches={branches}
            locale={locale}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
