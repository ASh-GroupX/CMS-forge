'use client';

import React, { useMemo, useState } from 'react';
import { Car, Check, Search } from 'lucide-react';
import type { CarModel } from '../../../lib/staff-service-bookings-api';

export function CarModelSelector({
  carModelId,
  carModels,
  isAr,
  noCarFoundText,
  onSelect,
  searchPlaceholder,
  selectPlaceholder,
}: {
  carModelId: string;
  carModels: CarModel[];
  isAr: boolean;
  noCarFoundText: string;
  onSelect: (id: string) => void;
  searchPlaceholder: string;
  selectPlaceholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCar = carModels.find((c) => c.id === carModelId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return carModels;
    return carModels.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q),
    );
  }, [carModels, search]);

  return (
    <div className="relative">
      <button
        className="flex w-full items-center justify-between rounded-xl border border-line-subtle bg-surface px-3 py-2 text-start text-sm shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex items-center gap-2 truncate">
          <Car className="size-4 text-brand shrink-0" />
          <span className={selectedCar ? 'font-medium text-content-strong' : 'text-content-muted'}>
            {selectedCar
              ? `${selectedCar.brand} - ${isAr ? selectedCar.nameAr : selectedCar.nameEn}`
              : selectPlaceholder}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-line-subtle bg-surface p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="absolute start-2.5 top-2 size-3.5 text-content-muted" />
            <input
              className="w-full rounded-lg border border-line-subtle bg-surface-canvas px-2 py-1.5 ps-8 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={search}
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-2 text-center text-xs text-content-muted">{noCarFoundText}</p>
          ) : (
            filtered.map((car) => (
              <button
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-start transition-colors ${
                  carModelId === car.id
                    ? 'bg-brand/10 font-bold text-brand'
                    : 'hover:bg-surface-canvas text-content-strong'
                }`}
                key={car.id}
                onClick={() => {
                  onSelect(car.id);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>{car.brand} - {isAr ? car.nameAr : car.nameEn}</span>
                {carModelId === car.id && <Check className="size-3.5 text-brand" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
