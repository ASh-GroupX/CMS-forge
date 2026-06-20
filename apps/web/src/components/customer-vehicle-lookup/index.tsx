import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type LookupPreviewState = 'loading' | 'none' | 'error';

const fields = ['phone', 'customerCode', 'name', 'vin', 'plate'] as const;

export function CustomerVehicleLookup({
  locale,
  state,
}: {
  locale: Locale;
  state?: LookupPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = shell.lookup;

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2 md:grid-cols-5">
          {fields.map((field) => (
            <div className="grid gap-1" key={field}>
              <Label htmlFor={`lookup-${field}`}>{t.fields[field]}</Label>
              <Input id={`lookup-${field}`} name={`lookup-${field}`} />
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <section aria-label={t.resultTitle} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold">{t.resultTitle}</h3>
            {state ? (
              <p
                className="mt-2 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                role={state === 'error' ? 'alert' : 'status'}
              >
                {t.states[state]}
              </p>
            ) : (
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-status-success text-white">{t.sources.local}</Badge>
                  <Badge className="bg-status-info text-white">{t.sources.dms}</Badge>
                </div>
                <p>{t.safeCustomer}</p>
                <p>{t.safeVehicle}</p>
              </div>
            )}
          </section>

          <section aria-label={t.manualTitle} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold">{t.manualTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.manualHelp}</p>
            <Button className="mt-3" type="button" variant="outline">
              {t.manualAction}
            </Button>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
