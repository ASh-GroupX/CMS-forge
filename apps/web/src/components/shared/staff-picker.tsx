'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';

export type StaffPickerText = {
  placeholder: string;
  prompt: string;
  selected: string;
  clear: string;
  loading: string;
  empty: string;
  error: string;
};

export function StaffPicker({
  initialUserId = '',
  label,
  labelName,
  locale,
  name,
  required = true,
  staff,
  t,
}: {
  initialUserId?: string;
  label: string;
  labelName?: string | undefined;
  locale: Locale;
  name: string;
  required?: boolean;
  staff?: AssignableStaff[] | null | undefined;
  t: StaffPickerText;
}) {
  const listId = React.useId();
  const options = staff?.map((person) => ({ id: person.userId, label: staffLabel(person, locale) })) ?? [];
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const initialLabel = options.find((option) => option.id === initialUserId)?.label ?? '';
  const [selectedLabel, setSelectedLabel] = React.useState(initialLabel);
  const selected = options.find((option) => option.label === selectedLabel);

  if (staff === undefined) return <PickerState label={label} message={t.loading} />;
  if (staff === null) return <PickerState alert label={label} message={t.error} />;
  if (staff.length === 0) return <PickerState label={label} message={t.empty} />;

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${listId}-input`}>{label}</Label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <select
          aria-describedby={`${listId}-selected`}
          className="flex h-9 min-w-0 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          id={`${listId}-input`}
          name={labelName}
          onChange={(event) => setSelectedLabel(event.currentTarget.value)}
          ref={selectRef}
          required={required}
          value={selectedLabel}
        >
          <option value="" disabled={required}>{t.placeholder}</option>
          {options.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
        </select>
        <Button aria-label={t.clear} onClick={() => { setSelectedLabel(''); if (selectRef.current) selectRef.current.value = ''; }} type="button" variant="outline">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <input name={name} type="hidden" value={selected?.id ?? ''} />
      <p className="break-words text-xs text-muted-foreground" id={`${listId}-selected`}>
        {selected ? t.selected.replace('{name}', selected.label) : t.prompt}
      </p>
    </div>
  );
}

function PickerState({ alert = false, label, message }: { alert?: boolean; label: string; message: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <p className={`rounded-sm border px-3 py-2 text-sm ${alert ? 'border-status-error bg-status-error/10 text-status-error' : 'border-border bg-background text-muted-foreground'}`} role={alert ? 'alert' : 'status'}>
        {message}
      </p>
    </div>
  );
}

function staffLabel(person: AssignableStaff, locale: Locale): string {
  const name = locale === 'ar' ? person.displayNameAr : person.displayName;
  const role = locale === 'ar' ? person.roleAr : person.role;
  const branch = locale === 'ar' ? person.branchLabelAr : person.branchLabel;
  return [name, role, branch].filter(Boolean).join(' - ');
}
