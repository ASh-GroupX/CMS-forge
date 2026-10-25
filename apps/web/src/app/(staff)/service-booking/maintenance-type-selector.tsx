'use client';

import React from 'react';
import type { MaintenanceType } from '../../../lib/staff-service-bookings-api';

export function MaintenanceTypeSelector({
  durationUnit,
  isAr,
  maintenanceTypeId,
  maintenanceTypes,
  onSelect,
}: {
  durationUnit: string;
  isAr: boolean;
  maintenanceTypeId: string;
  maintenanceTypes: MaintenanceType[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {maintenanceTypes.map((m) => {
        const isSelected = maintenanceTypeId === m.id;
        return (
          <button
            className={`flex flex-col items-start rounded-xl border p-2.5 text-start transition-all ${
              isSelected
                ? 'border-brand bg-brand/10 text-brand shadow-xs ring-1 ring-brand'
                : 'border-line-subtle bg-surface hover:border-brand/40 text-content-strong'
            }`}
            key={m.id}
            onClick={() => onSelect(m.id)}
            type="button"
          >
            <span className="font-semibold text-xs truncate w-full">
              {isAr ? m.nameAr : m.nameEn}
            </span>
            <span className="mt-1 text-[10px] text-content-muted">
              {m.estimatedDurationMinutes} {durationUnit}
            </span>
          </button>
        );
      })}
    </div>
  );
}
