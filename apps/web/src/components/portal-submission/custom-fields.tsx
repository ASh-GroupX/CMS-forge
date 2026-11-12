'use client';
import React from 'react';
import type { PortalField } from '../../../../../packages/contracts/src/portal-form';
import type { PortalLocale } from '../../i18n/portal-submission';
import { FormSelect } from '../ui/form-select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

export function PortalCustomFields({ fields, locale, error, values = {} }: { fields: PortalField[]; locale: PortalLocale; error: (key: string) => string | undefined; values?: Record<string, string | number | boolean | null> }) {
  return <>{fields.filter((field) => field.enabled && field.key.startsWith('custom_')).map((field) => {
    const label = locale === 'ar' ? field.labelAr : field.labelEn;
    const name = `customFields.${field.key}`;
    const message = error(name);
    return <div className="grid gap-1" key={field.key}>
      <Label htmlFor={name}>{label}{field.required ? ' *' : ''}</Label>
      {field.type === 'textarea' ? <Textarea id={name} name={name} required={field.required} aria-invalid={Boolean(message)} defaultValue={String(values[field.key] ?? '')} />
        : field.type === 'select' ? <FormSelect id={name} name={name} defaultValue={String(values[field.key] ?? '')} required={field.required} placeholder={field.required ? locale === 'ar' ? 'اختر' : 'Choose' : locale === 'ar' ? 'غير محدد' : 'Not provided'} options={(field.options ?? []).map((choice) => ({ value: choice.value, label: locale === 'ar' ? choice.labelAr : choice.labelEn }))} />
          : field.type === 'checkbox' ? <><input type="hidden" name={name} value="false" /><Checkbox id={name} name={name} value="true" defaultChecked={values[field.key] === true} required={field.required} /></>
            : <Input id={name} name={name} type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} defaultValue={String(values[field.key] ?? '')} required={field.required} aria-invalid={Boolean(message)} />}
      {message && <span role="alert" className="text-xs text-status-error">{message}</span>}
    </div>;
  })}</>;
}

export function customValues(data: FormData, fields: PortalField[]): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const field of fields.filter((item) => item.enabled && item.key.startsWith('custom_'))) {
    const submitted = data.getAll(`customFields.${field.key}`);
    const raw = submitted.at(-1);
    if (typeof raw !== 'string') continue;
    result[field.key] = !raw.trim() ? '' : field.type === 'number' ? Number(raw) : field.type === 'checkbox' ? raw === 'true' : raw;
  }
  return result;
}
