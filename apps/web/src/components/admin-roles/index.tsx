import React from 'react';
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

export function AdminRoles({ action, data, locale, state }: { action?: RoleAction; data?: AdminRolesData | null; locale: Locale; state?: RoleState | undefined }) {
  const t = adminRolesText[locale];
  return <Card aria-label={t.title} className="rounded-md shadow-sm" dir={staffShellText[locale].dir}>
    <CardHeader className="border-b p-4"><CardTitle className="text-lg tracking-normal">{t.title}</CardTitle><CardDescription>{t.subtitle}</CardDescription></CardHeader>
    <CardContent className="grid gap-5 p-4">
      {state ? <p className="rounded-sm border bg-muted/40 px-3 py-2 text-sm" role={state === 'success' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      {action && data ? <CreateRoleForm action={action} data={data} locale={locale} /> : null}
      <section aria-label={t.roleList}><h2 className="mb-3 text-sm font-semibold">{t.roleList}</h2><div className="grid gap-3 md:grid-cols-2">
        {(data?.roles ?? []).map((role) => <article className="rounded-md border bg-muted/20 p-3" key={role.id}>
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{role.nameEn}</h3><p className="text-xs text-muted-foreground">{role.code}</p></div><Badge variant={role.isSystem ? 'secondary' : 'outline'}>{role.isSystem ? t.system : t.custom}</Badge></div>
          <p className="mt-3 text-sm text-muted-foreground">{role.permissions.map(({ nameEn }) => nameEn).join(', ')}</p>
        </article>)}
      </div>{data && data.roles.length === 0 ? <p className="text-sm text-muted-foreground" role="status">{t.noRoles}</p> : null}</section>
    </CardContent>
  </Card>;
}

function CreateRoleForm({ action, data, locale }: { action: RoleAction; data: AdminRolesData; locale: Locale }) {
  const t = adminRolesText[locale];
  return <form action={action} className="grid gap-3 rounded-md border bg-muted/40 p-3 md:grid-cols-2">
    <input name="locale" type="hidden" value={locale} />
    <Field label={t.code} name="code" pattern="[A-Za-z][A-Za-z0-9_]{2,63}" />
    <Field label={t.nameEn} name="nameEn" />
    <Field label={t.nameAr} name="nameAr" />
    <div className="grid gap-1"><Label htmlFor="permissionCodes">{t.permissions}</Label><select aria-describedby="permission-help" className="min-h-40 rounded-md border border-input bg-background px-3 py-2" id="permissionCodes" multiple name="permissionCodes" required defaultValue={['STAFF_LOGIN']}>
      {data.permissions.filter(({ code }) => code !== 'PORTAL_SUBMIT').map((permission) => <option key={permission.id} value={permission.code}>{permission.nameEn} — {permission.code}</option>)}
    </select><p className="text-xs text-muted-foreground" id="permission-help">{t.selectHelp}</p></div>
    <Button className="md:col-span-2" type="submit">{t.create}</Button>
  </form>;
}

function Field({ label, name, pattern }: { label: string; name: string; pattern?: string }) {
  return <div className="grid gap-1"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} pattern={pattern} required /></div>;
}
