'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { serviceBookingText } from '../../../i18n/staff-service-booking';
import type { CarModel } from '../../../lib/staff-service-bookings-api';

export function CarModelSelector({ carModelId, carModels, isAr, noCarFoundText, onSelect, searchPlaceholder, selectPlaceholder }: {
  carModelId: string; carModels: CarModel[]; isAr: boolean; noCarFoundText: string;
  onSelect: (id: string) => void; searchPlaceholder: string; selectPlaceholder: string;
}) {
  const copy = serviceBookingText[isAr ? 'ar' : 'en'].modal;
  const active = useMemo(() => carModels.filter(car => car.isActive), [carModels]);
  const current = active.find(car => car.id === carModelId);
  const [chosenBrand, setChosenBrand] = useState(current?.brand ?? '');
  const [search, setSearch] = useState('');
  const brand = current?.brand ?? chosenBrand;
  const brands = [...new Set(active.map(car => car.brand))].sort((a, b) => a.localeCompare(b));
  const searchTerm = search.trim().toLocaleLowerCase();
  const models = active
    .filter(car => !brand || car.brand === brand)
    .filter(car => `${car.brand} ${car.nameEn} ${car.nameAr}`.toLocaleLowerCase().includes(searchTerm))
    .sort((left, right) => left.brand.localeCompare(right.brand) || left.nameEn.localeCompare(right.nameEn));

  useEffect(() => {
    if (current?.brand) setChosenBrand(current.brand);
  }, [current?.brand]);

  return <div className="space-y-3">
    <div className="space-y-1">
      <label className="text-xs font-semibold">{copy.brand}</label>
      <Select value={brand} onValueChange={value => {
        setChosenBrand(value);
        setSearch('');
        if (carModelId) queueMicrotask(() => onSelect(''));
      }}>
        <SelectTrigger aria-label={copy.brand}><SelectValue placeholder={copy.selectBrand} /></SelectTrigger>
        <SelectContent>{brands.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <label className="text-xs font-semibold">{copy.carModel}</label>
      <p className="text-[11px] leading-4 text-content-muted">{copy.modelSearchHint}</p>
      <Input aria-label={searchPlaceholder} placeholder={searchPlaceholder} disabled={!active.length} value={search} onChange={event => setSearch(event.target.value)} />
      <Select value={current?.id ?? ''} disabled={!active.length} onValueChange={id => {
        const selected = active.find(car => car.id === id);
        if (selected) setChosenBrand(selected.brand);
        setSearch('');
        onSelect(id);
      }}>
        <SelectTrigger aria-label={copy.carModel}><SelectValue placeholder={selectPlaceholder} /></SelectTrigger>
        <SelectContent>{models.map(car => <SelectItem key={car.id} value={car.id}>
          {brand ? (isAr ? car.nameAr : car.nameEn) : `${car.brand} · ${isAr ? car.nameAr : car.nameEn}`}
        </SelectItem>)}</SelectContent>
      </Select>
      {active.length > 0 && !models.length && <p role="status" className="text-xs text-muted-foreground">{noCarFoundText}</p>}
      {!active.length && <p role="status" className="text-xs text-muted-foreground">{copy.noBrands}</p>}
    </div>
  </div>;
}
