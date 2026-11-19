'use client';

import React, { useState } from 'react';
import { Building2, CalendarDays, Car, Clock, FileUp, Layers3, MessageSquareText, ShieldCheck, Wrench } from 'lucide-react';
import { BranchHoursTab } from './branch-hours-tab';
import { CarModelsTab } from './car-models-tab';
import { MaintenanceTypesTab } from './maintenance-types-tab';
import { ServiceCentersTab } from './service-centers-tab';
import { UserRulesTab } from './user-rules-tab';
import { SmsReminderTab } from './sms-reminder-tab';
import { BookingLanesTab } from './booking-lanes-tab';
import { AmmanNotesImportTab } from './amman-notes-import-tab';
import { BookingClosuresTab } from './booking-closures-tab';
import { bookingClosuresText } from '../../../../i18n/staff-booking-closures';
import { ammanNotesImportText } from '../../../../i18n/amman-notes-import';
import type { CarModel, DayRule, MaintenanceType, ServiceCenter } from '../../../../lib/staff-service-bookings-api';
import type { Locale } from '../../../../i18n/staff-shell';
import type { ServiceBookingCopy } from '../../../../i18n/staff-service-booking';

export function BookingSettingsView({
  centers,
  carModels,
  locale,
  maintenanceTypes,
  rulesByBranch,
  t,
}: {
  centers: ServiceCenter[];
  carModels: CarModel[];
  locale: Locale;
  maintenanceTypes: MaintenanceType[];
  rulesByBranch: Record<string, DayRule[]>;
  t: ServiceBookingCopy;
}) {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'hours' | 'closures' | 'lanes' | 'cars' | 'maintenance' | 'centers' | 'user-rules' | 'sms-reminder' | 'import-notes' | 'import-periodic' | 'import-irbid-periodic'>('hours');
  const [centersList, setCentersList] = useState(centers);
  const [carList, setCarList] = useState(carModels);
  const [typesList, setTypesList] = useState(maintenanceTypes);
  const [rules, setRules] = useState(rulesByBranch);

  React.useEffect(() => {
    setCentersList((prev) => {
      const map = new Map(centers.map((c) => [c.id, c]));
      for (const item of prev) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [centers]);

  React.useEffect(() => {
    setCarList((prev) => {
      const map = new Map(carModels.map((c) => [c.id, c]));
      for (const item of prev) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [carModels]);

  React.useEffect(() => {
    setTypesList((prev) => {
      const map = new Map(maintenanceTypes.map((m) => [m.id, m]));
      for (const item of prev) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
      return Array.from(map.values());
    });
  }, [maintenanceTypes]);

  React.useEffect(() => {
    setRules(rulesByBranch);
  }, [rulesByBranch]);

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
          <button className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'closures' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('closures')} type="button"><CalendarDays className="size-4" /><span>{bookingClosuresText[locale].tab}</span></button>
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'lanes' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('lanes')}
            type="button"
          >
            <Layers3 className="size-4" />
            <span>{t.adminSettings.tabLanes}</span>
          </button>

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
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'sms-reminder' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('sms-reminder')}
            type="button"
          >
            <MessageSquareText className="size-4" />
            <span>{t.adminSettings.tabSmsReminder}</span>
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
              activeTab === 'centers'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('centers')}
            type="button"
          >
            <Building2 className="size-4" />
            <span>{t.adminSettings.tabBranches}</span>
          </button>

          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'user-rules'
                ? 'bg-brand text-primary-foreground shadow-sm'
                : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setActiveTab('user-rules')}
            type="button"
          >
            <ShieldCheck className="size-4" />
            <span>{isAr ? 'صلاحيات وقواعد المستخدمين' : 'User Booking Rules'}</span>
          </button>
          <button className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'import-notes' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('import-notes')} type="button">
            <FileUp className="size-4" /><span>{ammanNotesImportText[locale].tab}</span>
          </button>
          <button className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'import-periodic' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('import-periodic')} type="button">
            <FileUp className="size-4" /><span>{ammanNotesImportText[locale].periodic.tab}</span>
          </button>
          <button className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'import-irbid-periodic' ? 'bg-brand text-primary-foreground shadow-sm' : 'border border-line-subtle bg-surface text-content-muted hover:text-content-strong'}`}
            onClick={() => setActiveTab('import-irbid-periodic')} type="button">
            <FileUp className="size-4" /><span>{ammanNotesImportText[locale].irbidPeriodic.tab}</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'closures' ? <BookingClosuresTab centers={centersList} locale={locale} /> : null}
        <div style={{ display: activeTab === 'hours' ? undefined : 'none' }}>
          <BranchHoursTab
            centers={centersList}
            initialRulesByBranch={rules}
            locale={locale}
            t={t}
          />
        </div>
        <div style={{ display: activeTab === 'cars' ? undefined : 'none' }}>
          <CarModelsTab
            initialCarModels={carList}
            locale={locale}
            onCarModelsChange={setCarList}
            t={t}
          />
        </div>
        <div style={{ display: activeTab === 'lanes' ? undefined : 'none' }}>
          <BookingLanesTab centers={centersList} locale={locale} t={t} />
        </div>
        <div style={{ display: activeTab === 'maintenance' ? undefined : 'none' }}>
          <MaintenanceTypesTab
            initialMaintenanceTypes={typesList}
            locale={locale}
            onMaintenanceTypesChange={setTypesList}
            t={t}
          />
        </div>
        <div style={{ display: activeTab === 'centers' ? undefined : 'none' }}>
          <ServiceCentersTab
            centers={centersList}
            initialCenters={centersList}
            locale={locale}
            onCentersChange={setCentersList}
          />
        </div>
        <div style={{ display: activeTab === 'user-rules' ? undefined : 'none' }}>
          <UserRulesTab locale={locale} />
        </div>
        <div style={{ display: activeTab === 'sms-reminder' ? undefined : 'none' }}>
          <SmsReminderTab locale={locale} t={t} />
        </div>
        {activeTab === 'import-notes' ? <AmmanNotesImportTab carModels={carList} maintenanceTypes={typesList} locale={locale} /> : null}
        {activeTab === 'import-periodic' ? <AmmanNotesImportTab carModels={carList} maintenanceTypes={typesList} locale={locale}
          mode="periodic" expectedCount={128} /> : null}
        {activeTab === 'import-irbid-periodic' ? <AmmanNotesImportTab carModels={carList} maintenanceTypes={typesList} locale={locale}
          mode="periodic" centerId="center_north" expectedCount={160} variant="irbid" /> : null}
      </div>
    </div>
  );
}
