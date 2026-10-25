'use client';

import React from 'react';
import { Phone, User } from 'lucide-react';
import { CarModelSelector } from './car-model-selector';
import type { CarModel } from '../../../lib/staff-service-bookings-api';
import type { ServiceBookingCopy } from '../../../i18n/staff-service-booking';

export function BookingCustomerFields({
  carModelId,
  carModels,
  customerName,
  customerPhone,
  isAr,
  onCarSelect,
  onNameChange,
  onPhoneChange,
  onVinChange,
  t,
  vin,
}: {
  carModelId: string;
  carModels: CarModel[];
  customerName: string;
  customerPhone: string;
  isAr: boolean;
  onCarSelect: (id: string) => void;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onVinChange: (val: string) => void;
  t: ServiceBookingCopy;
  vin: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.customerName} <span className="text-status-error">*</span>
          </label>
          <div className="relative">
            <User className="absolute start-3 top-2.5 size-4 text-content-muted" />
            <input
              className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 ps-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Ahmad Al-Mansoor"
              required
              type="text"
              value={customerName}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.customerPhone} <span className="text-status-error">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute start-3 top-2.5 size-4 text-content-muted" />
            <input
              className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 ps-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="05XXXXXXXX"
              required
              type="tel"
              value={customerPhone}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.carModel} <span className="text-status-error">*</span>
          </label>
          <CarModelSelector
            carModelId={carModelId}
            carModels={carModels}
            isAr={isAr}
            noCarFoundText={t.modal.noCarFound}
            onSelect={onCarSelect}
            searchPlaceholder={t.modal.searchCarModel}
            selectPlaceholder={t.modal.selectCarModel}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-content-strong mb-1">
            {t.modal.vin}
          </label>
          <input
            className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 uppercase"
            onChange={(e) => onVinChange(e.target.value)}
            placeholder={t.modal.vinPlaceholder}
            type="text"
            value={vin}
          />
        </div>
      </div>
    </>
  );
}
