'use client';
import React, { useMemo, useState } from 'react';
import type { BookingCarOption } from '../../../../../packages/contracts/src/portal-form';
import type { Locale } from '../../i18n/staff-shell';
import { complaintVehicleSelectText } from '../../i18n/complaint-vehicle-select';
import { FormSelect } from '../ui/form-select';
import { Label } from '../ui/label';
export function ComplaintVehicleSelect({ models, locale, defaultBrand = '', defaultModel = '', brandLabel, modelLabel, brandName = 'vehicleBrand', modelName = 'vehicleModel', requiredBrand = true, requiredModel = true, disabled = false }: { models: BookingCarOption[]; locale: Locale; defaultBrand?: string; defaultModel?: string; brandLabel?: string; modelLabel?: string; brandName?: string; modelName?: string; requiredBrand?: boolean; requiredModel?: boolean; disabled?: boolean }) {
  const t = complaintVehicleSelectText[locale];
  const brands = useMemo(() => [...new Set(models.map((item) => item.brand))].sort((a, b) => a.localeCompare(b)), [models]);
  const [brand, setBrand] = useState(() => brands.find((item) => item.toLowerCase() === defaultBrand.toLowerCase()) ?? '');
  const [model, setModel] = useState(() => models.find((item) => item.brand.toLowerCase() === defaultBrand.toLowerCase() && (item.nameEn === defaultModel || item.nameAr === defaultModel))?.nameEn ?? '');
  const selectedModels = useMemo(() => [...new Map(models.filter((item) => item.brand === brand).map((item) => [item.nameEn, item])).values()], [models, brand]);
  return <>
    <div className="grid gap-2"><Label htmlFor={brandName}>{brandLabel ?? t.brand}{requiredBrand ? ' *' : ''}</Label><FormSelect aria-label={brandLabel ?? t.brand} id={brandName} name={brandName} value={brand} disabled={disabled || !models.length} required={requiredBrand} placeholder={requiredBrand ? t.chooseBrand : t.none} onValueChange={(value) => { setBrand(value); setModel(''); }} options={brands.map((value) => ({ value, label: value }))} /></div>
    <div className="grid gap-2"><Label htmlFor={modelName}>{modelLabel ?? t.model}{requiredModel ? ' *' : ''}</Label><FormSelect aria-label={modelLabel ?? t.model} id={modelName} name={modelName} value={model} disabled={disabled || !brand} required={requiredModel} placeholder={requiredModel ? t.chooseModel : t.none} onValueChange={setModel} options={selectedModels.map((item) => ({ value: item.nameEn, label: locale === 'ar' ? item.nameAr : item.nameEn }))} /></div>
    {!models.length && <p role="status" className="text-sm text-content-muted md:col-span-2">{t.empty}</p>}
  </>;
}
