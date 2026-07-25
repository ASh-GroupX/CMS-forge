import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FormSelect } from '../ui/form-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminUsersText } from '../../i18n/staff-admin-users';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminUsersData } from '../../lib/staff-admin-users-api';

export type AdminUsersFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';
type AdminAction = (formData: FormData) => void | Promise<void>;

export function AdminUsersRoles({
  createAction,
  data,
  locale,
  state,
  toggleAction,
  updateDepartmentAction,
}: {
  createAction?: AdminAction;
  data?: AdminUsersData | null;
  locale: Locale;
  state?: AdminUsersFixtureState | undefined;
  toggleAction?: AdminAction;
  updateDepartmentAction?: AdminAction;
}) {
  const shell = staffShellText[locale];
  const t = adminUsersText[locale];
  const users = data?.users ?? [];
  const roleNames = new Map((data?.roles ?? []).map((role) => [role.code, localizedName(role, locale)]));
  const branchNames = new Map((data?.branches ?? []).map((branch) => [branch.id, localizedName(branch, locale)]));

  return (
    <Card aria-label={t.title} className="min-w-0 rounded-md shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle className="text-lg tracking-normal">{t.title}</CardTitle><CardDescription className="mt-1 text-sm">{t.subtitle}</CardDescription></div>
          <Button asChild size="sm" variant="outline"><a href={`/admin/roles?locale=${locale}`}>{t.actions.manageRoles}</a></Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {state ? <StateMessage locale={locale} state={state} /> : null}
        {createAction && data ? <CreateUserForm action={createAction} data={data} locale={locale} /> : null}
        <div className="overflow-x-auto">
          <Table className="min-w-[50rem]">
            <TableHeader className="bg-muted/40 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold">{user.nameEn}<span className="block text-xs text-muted-foreground">{user.email}</span></TableCell>
                  <TableCell>{roleNames.get(user.roleCode) ?? user.roleName}</TableCell>
                  <TableCell>{user.branchId ? branchNames.get(user.branchId) ?? user.branchName ?? t.allBranches : t.allBranches}</TableCell>
                  <TableCell>{updateDepartmentAction ? <DepartmentForm action={updateDepartmentAction} data={data!} locale={locale} user={user} /> : user.departmentName}</TableCell>
                  <TableCell><Badge className="shadow-none" variant={user.isActive ? 'secondary' : 'outline'}>{user.isActive ? t.badges.active : t.badges.inactive}</Badge></TableCell>
                  <TableCell>{toggleAction ? <ToggleForm action={toggleAction} active={user.isActive} id={user.id} locale={locale} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {users.length === 0 ? <p className="mt-3 text-sm text-muted-foreground" role="status">{t.states.empty}</p> : null}
        <p className="mt-3 rounded-sm border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{t.resetMessage}</p>
      </CardContent>
    </Card>
  );
}

function CreateUserForm({ action, data, locale }: { action: AdminAction; data: AdminUsersData; locale: Locale }) {
  const t = adminUsersText[locale];
  return (
    <details className="mb-4 rounded-sm border border-line-subtle bg-surface-raised">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-content-strong">{t.actions.create}</summary>
      <form action={action} className="grid gap-3 border-t border-line-subtle p-3 md:grid-cols-3">
        <input name="locale" type="hidden" value={locale} />
        <Field label={t.fields.email} name="email" type="email" />
        <Field label={t.fields.nameEn} name="nameEn" />
        <Field label={t.fields.nameAr} name="nameAr" />
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.role}
          <FormSelect name="roleCode" options={data.roles.map((role) => ({ label: localizedName(role, locale), value: role.code }))} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.branch}
          <FormSelect name="branchId" options={data.branches.map((branch) => ({ label: localizedName(branch, locale), value: branch.id }))} placeholder={t.allBranches} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.department}
          <FormSelect name="departmentId" options={data.departments.map((department) => ({ label: localizedName(department, locale), value: department.id }))} required />
        </label>
        <Field label={t.fields.initialPassword} minLength={12} name="initialPassword" type="password" />
        <Button className="md:col-span-3" type="submit">{t.actions.create}</Button>
      </form>
    </details>
  );
}

function DepartmentForm({ action, data, locale, user }: { action: AdminAction; data: AdminUsersData; locale: Locale; user: AdminUsersData['users'][number] }) {
  const t = adminUsersText[locale];
  const eligible = data.departments.filter((department) => !department.branchId || department.branchId === user.branchId);
  return (
    <form action={action} className="flex min-w-56 items-center gap-2">
      <input name="id" type="hidden" value={user.id} />
      <input name="locale" type="hidden" value={locale} />
      <FormSelect defaultValue={user.departmentId ?? undefined} name="departmentId" options={eligible.map((department) => ({ label: localizedName(department, locale), value: department.id }))} required />
      <Button size="sm" type="submit" variant="outline">{t.actions.saveDepartment}</Button>
    </form>
  );
}

function localizedName(item: { nameAr?: string | null; nameEn: string }, locale: Locale): string {
  return locale === 'ar' && item.nameAr ? item.nameAr : item.nameEn;
}

function ToggleForm({ action, active, id, locale }: { action: AdminAction; active: boolean; id: string; locale: Locale }) {
  const t = adminUsersText[locale];
  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <input name="locale" type="hidden" value={locale} />
      <input name="action" type="hidden" value={active ? 'deactivate' : 'reactivate'} />
      <Button size="sm" type="submit" variant="outline">{active ? t.actions.deactivate : t.actions.reactivate}</Button>
    </form>
  );
}

function Field({ label, minLength, name, type = 'text' }: { label: string; minLength?: number; name: string; type?: string }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} minLength={minLength} name={name} required type={type} />
    </div>
  );
}

function StateMessage({ locale, state }: { locale: Locale; state: AdminUsersFixtureState }) {
  const t = adminUsersText[locale];
  return (
    <p className="mb-4 rounded-sm border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>
      {t.states[state]}
    </p>
  );
}
