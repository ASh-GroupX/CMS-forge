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
  const models = active.filter(car => car.brand === brand && `${car.nameEn} ${car.nameAr}`.toLowerCase().includes(search.trim().toLowerCase()));

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
      <Input aria-label={searchPlaceholder} placeholder={searchPlaceholder} disabled={!brand} value={search} onChange={event => setSearch(event.target.value)} />
      <Select value={current?.id ?? ''} disabled={!brand} onValueChange={onSelect}>
        <SelectTrigger aria-label={copy.carModel}><SelectValue placeholder={brand ? selectPlaceholder : copy.selectBrandFirst} /></SelectTrigger>
        <SelectContent>{models.map(car => <SelectItem key={car.id} value={car.id}>{isAr ? car.nameAr : car.nameEn}</SelectItem>)}</SelectContent>
      </Select>
      {brand && !models.length && <p role="status" className="text-xs text-muted-foreground">{noCarFoundText}</p>}
      {!active.length && <p role="status" className="text-xs text-muted-foreground">{copy.noBrands}</p>}
    </div>
  </div>;
}
