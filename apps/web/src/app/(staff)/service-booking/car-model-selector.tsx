'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
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
  const [modelOpen, setModelOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
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
      <Popover open={modelOpen} onOpenChange={open => { setModelOpen(open); if (!open) setSearch(''); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={copy.carModel} aria-expanded={modelOpen} disabled={!active.length}
            className="w-full justify-between font-normal">
            <span className="truncate">{current ? `${current.brand} · ${isAr ? current.nameAr : current.nameEn}` : selectPlaceholder}</span>
            <span aria-hidden="true">⌄</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent portalled={false} align="start" dir={isAr ? 'rtl' : 'ltr'} className="w-[var(--radix-popover-trigger-width)] p-1"
          onOpenAutoFocus={event => { event.preventDefault(); searchRef.current?.focus(); }}>
          <Input ref={searchRef} aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={search}
            onChange={event => setSearch(event.target.value)} className="mb-1" />
          <div role="listbox" aria-label={copy.carModel} className="max-h-56 overflow-y-auto">
            {models.map(car => <Button key={car.id} variant="ghost" role="option" aria-selected={car.id === carModelId}
              className="h-auto min-h-9 w-full justify-start whitespace-normal text-start font-normal"
              onClick={() => { setChosenBrand(car.brand); onSelect(car.id); setModelOpen(false); setSearch(''); }}>
              {brand ? (isAr ? car.nameAr : car.nameEn) : `${car.brand} · ${isAr ? car.nameAr : car.nameEn}`}
            </Button>)}
            {!models.length && <p role="status" className="p-2 text-xs text-muted-foreground">{noCarFoundText}</p>}
          </div>
        </PopoverContent>
      </Popover>
      {!active.length && <p role="status" className="text-xs text-muted-foreground">{copy.noBrands}</p>}
    </div>
  </div>;
}
