"use client";

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { adminRolesText } from '../../i18n/staff-admin-roles';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminRolesData } from '../../lib/staff-admin-roles-api';

type RoleAction = (formData: FormData) => void | Promise<void>;
type RoleState = 'success' | 'validation' | 'error';

export function AdminRoles({ createAction, data, locale, state, updateAction }: { createAction?: RoleAction; data?: AdminRolesData | null; locale: Locale; state?: RoleState | undefined; updateAction?: RoleAction }) {
  const t = adminRolesText[locale];
  return <Card aria-label={t.title} className="rounded-md shadow-sm" dir={staffShellText[locale].dir}>
    <CardHeader className="border-b p-4"><CardTitle className="text-lg tracking-normal">{t.title}</CardTitle><CardDescription>{t.subtitle}</CardDescription></CardHeader>
    <CardContent className="grid gap-5 p-4">
      {state ? <p className="rounded-sm border bg-muted/40 px-3 py-2 text-sm" role={state === 'success' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      {createAction && data ? <CreateRoleForm action={createAction} data={data} locale={locale} /> : null}
      <section aria-label={t.roleList}><h2 className="mb-3 text-sm font-semibold">{t.roleList}</h2><div className="grid gap-3 md:grid-cols-2">
        {(data?.roles ?? []).map((role) => <article className="rounded-md border bg-muted/20 p-3" key={role.id}>
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{role.nameEn}</h3><p className="text-xs text-muted-foreground">{role.code}</p></div><Badge variant={role.isSystem ? 'secondary' : 'outline'}>{role.isSystem ? t.system : t.custom}</Badge></div>
          <p className="mt-3 text-sm text-muted-foreground">{role.permissions.map(({ nameEn }) => nameEn).join(', ')}</p>
          {updateAction && data && role.code !== 'CUSTOMER_PORTAL' ? <EditPermissionsForm action={updateAction} data={data} locale={locale} role={role} /> : role.code === 'CUSTOMER_PORTAL' ? <p className="mt-3 text-xs text-muted-foreground">{t.systemLocked}</p> : null}
        </article>)}
      </div>{data && data.roles.length === 0 ? <p className="text-sm text-muted-foreground" role="status">{t.noRoles}</p> : null}</section>
    </CardContent>
  </Card>;
}

function EditPermissionsForm({ action, data, locale, role }: { action: RoleAction; data: AdminRolesData; locale: Locale; role: AdminRolesData['roles'][number] }) {
  const t = adminRolesText[locale];
  return <details className="mt-3 rounded-sm border bg-background p-2"><summary className="cursor-pointer text-sm font-semibold">{t.editPermissions}</summary>
    <form action={action} className="mt-3 grid gap-2"><input name="id" type="hidden" value={role.id} /><input name="locale" type="hidden" value={locale} />
      <PermissionChecklist copyEnabled data={data} initialCodes={role.permissions.map(({ code }) => code)} locale={locale} role={role} />
      <Button size="sm" type="submit">{t.savePermissions}</Button>
    </form>
  </details>;
}

function CreateRoleForm({ action, data, locale }: { action: RoleAction; data: AdminRolesData; locale: Locale }) {
  const t = adminRolesText[locale];
  return <form action={action} className="grid gap-3 rounded-md border bg-muted/40 p-3 md:grid-cols-2">
    <input name="locale" type="hidden" value={locale} />
    <Field label={t.code} name="code" pattern="[A-Za-z][A-Za-z0-9_]{2,63}" />
    <Field label={t.nameEn} name="nameEn" />
    <Field label={t.nameAr} name="nameAr" />
    <div className="grid gap-1 md:col-span-2"><Label>{t.permissions}</Label><PermissionChecklist copyEnabled data={data} initialCodes={['STAFF_LOGIN']} locale={locale} /><p className="text-xs text-muted-foreground">{t.selectHelp}</p></div>
    <Button className="md:col-span-2" type="submit">{t.create}</Button>
  </form>;
}

function Field({ label, name, pattern }: { label: string; name: string; pattern?: string }) {
  return <div className="grid gap-1"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} pattern={pattern} required /></div>;
}

function PermissionChecklist({ copyEnabled, data, initialCodes, locale, role }: { copyEnabled?: boolean; data: AdminRolesData; initialCodes: string[]; locale: Locale; role?: AdminRolesData['roles'][number] }) {
  const t = adminRolesText[locale];
  const [selected, setSelected] = useState(initialCodes);
  const permissions = data.permissions.filter(({ code }) => code !== 'PORTAL_SUBMIT');
  const copyFrom = (roleId: string) => {
    const source = data.roles.find(({ id }) => id === roleId);
    if (source) setSelected(source.permissions.map(({ code }) => code));
  };
  return <div className="grid gap-3 rounded-md border border-input bg-background p-3">
    {copyEnabled ? <label className="grid gap-1 text-sm font-medium">{t.copyPermissions}<select className="rounded-md border border-input bg-background px-3 py-2" defaultValue="" onChange={(event) => copyFrom(event.target.value)}><option value="">{t.selectRole}</option>{data.roles.filter(({ id, code }) => id !== role?.id && code !== 'CUSTOMER_PORTAL').map((source) => <option key={source.id} value={source.id}>{source.nameEn}</option>)}</select></label> : null}
    {Object.entries(permissionGroups(t)).map(([group, codes]) => {
      const groupPermissions = permissions.filter(({ code }) => codes(code));
      return groupPermissions.length ? <fieldset className="grid gap-2" key={group}><legend className="text-sm font-semibold">{group}</legend><div className="grid gap-2 sm:grid-cols-2">
        {groupPermissions.map((permission) => <label className="flex items-start gap-2 rounded-sm border border-border p-2 text-sm" key={permission.id}><input checked={selected.includes(permission.code)} className="mt-1 size-4 accent-primary" name="permissionCodes" onChange={(event) => setSelected((current) => event.target.checked ? [...current, permission.code] : current.filter((code) => code !== permission.code))} type="checkbox" value={permission.code} /><span><span className="block font-medium">{permission.nameEn}</span><span className="block text-xs text-muted-foreground">{permission.code}</span></span></label>)}
      </div></fieldset> : null;
    })}
  </div>;
}

function permissionGroups(t: (typeof adminRolesText)[Locale]) {
  return {
    [t.permissionGroups.complaints]: (code: string) => code === 'STAFF_LOGIN' || code.startsWith('COMPLAINT_'),
    [t.permissionGroups.operations]: (code: string) => code.startsWith('ATTACHMENT_') || code.startsWith('COMPENSATION_'),
    [t.permissionGroups.administration]: (code: string) => /^(USERS|ROLES|MASTER_DATA|SLA|NOTIFICATIONS|INTEGRATIONS)_/.test(code),
    [t.permissionGroups.reporting]: (code: string) => code.startsWith('REPORT_') || code.startsWith('AUDIT_'),
  };
}
