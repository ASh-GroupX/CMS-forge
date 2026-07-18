'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { staffAssignmentText } from '../../i18n/staff-assignment';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffAssignmentOptions } from '../../lib/staff-assignment-options-api';

const NONE = '__none__';

export function AssignmentPicker({
  initialDepartmentId = '',
  initialUserId = '',
  locale,
  options,
  departmentName = 'assignedDepartmentId',
  userName = 'assignedUserId',
}: {
  initialDepartmentId?: string;
  initialUserId?: string;
  locale: Locale;
  options?: StaffAssignmentOptions | null | undefined;
  departmentName?: string;
  userName?: string;
}) {
  const t = staffAssignmentText[locale];
  const [userId, setUserId] = React.useState(initialUserId);
  const [departmentId, setDepartmentId] = React.useState(initialDepartmentId);
  if (options === undefined) return <PickerState message={t.loading} />;
  if (options === null) return <PickerState alert message={t.error} />;
  if (options.users.length === 0 && options.departments.length === 0) return <PickerState message={t.empty} />;

  return (
    <fieldset className="grid min-w-0 gap-3 rounded-md border border-border p-3 md:grid-cols-2">
      <legend className="px-1 text-xs font-semibold text-muted-foreground">{t.help}</legend>
      <AssignmentSelect label={t.user} onChange={setUserId} placeholder={t.userPlaceholder} value={userId}>
        {options.users.map((user) => <SelectItem key={user.id} value={user.id}>{locale === 'ar' ? user.nameAr : user.nameEn}</SelectItem>)}
      </AssignmentSelect>
      <AssignmentSelect label={t.department} onChange={setDepartmentId} placeholder={t.departmentPlaceholder} value={departmentId}>
        {options.departments.map((department) => <SelectItem key={department.id} value={department.id}>{locale === 'ar' ? department.nameAr : department.nameEn}</SelectItem>)}
      </AssignmentSelect>
      <input name={userName} type="hidden" value={userId} />
      <input name={departmentName} type="hidden" value={departmentId} />
    </fieldset>
  );
}

function AssignmentSelect({ children, label, onChange, placeholder, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  const id = React.useId();
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select onValueChange={(next) => onChange(next === NONE ? '' : next)} value={value || NONE}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

function PickerState({ alert = false, message }: { alert?: boolean; message: string }) {
  return <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role={alert ? 'alert' : 'status'}>{message}</p>;
}
