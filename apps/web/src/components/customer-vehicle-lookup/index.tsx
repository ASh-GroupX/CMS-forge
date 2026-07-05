'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, StateBlock, StatusBadge } from '../shared/ui-primitives';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import {
  DMS_DOWN_STATUS,
  lookupStaffDmsCustomerVehicle,
  type DmsCustomerVehicleMatch,
  type DmsLookupResult,
  type StaffDmsLookupQuery,
} from '../../lib/staff-complaints-api';

export type LookupPreviewState = 'loading' | 'none' | 'error' | 'match' | 'multiple' | 'down' | 'disabled' | 'validation' | 'manual';
export type LookupSelection = { source: 'DMS'; match: DmsCustomerVehicleMatch } | { source: 'MANUAL'; match: null };

type ViewState =
  | { kind: 'idle' | 'loading' | 'validation' | 'none' | 'down' | 'disabled' | 'error' | 'denied' | 'manual'; matches: DmsCustomerVehicleMatch[] }
  | { kind: 'match' | 'multiple'; matches: DmsCustomerVehicleMatch[] }
  | { kind: 'selected'; matches: DmsCustomerVehicleMatch[]; selected: DmsCustomerVehicleMatch };

const fields = ['phone', 'customerNumber', 'name', 'vin'] as const;

export function CustomerVehicleLookup({
  locale,
  onSelectionChange,
  state,
  surface = 'card',
}: {
  locale: Locale;
  onSelectionChange?: ((selection: LookupSelection) => void) | undefined;
  state?: LookupPreviewState | undefined;
  surface?: 'card' | 'section';
}) {
  const shell = staffShellText[locale];
  const t = shell.lookup;
  const [view, setView] = useState<ViewState>(() => previewView(state));
  const lookupDisabled = view.kind === 'disabled';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lookupDisabled) return;
    const query = lookupQuery(new FormData(event.currentTarget));
    if (!hasLookupValue(query)) {
      setView({ kind: 'validation', matches: [] });
      return;
    }

    setView({ kind: 'loading', matches: [] });
    const result = await lookupStaffDmsCustomerVehicle(query);
    if (!result.ok) {
      if (result.error.status === 401 || result.error.status === 403) setView({ kind: 'denied', matches: [] });
      else if (result.error.code === 'VALIDATION_FAILED') setView({ kind: 'validation', matches: [] });
      else setView({ kind: 'error', matches: [] });
      return;
    }

    setView(viewFromLookup(result.data.lookup));
  }

  function selectMatch(match: DmsCustomerVehicleMatch) {
    setView({ kind: 'selected', matches: view.matches, selected: match });
    onSelectionChange?.({ source: 'DMS', match });
  }

  function selectManual() {
    setView({ kind: 'manual', matches: [] });
    onSelectionChange?.({ source: 'MANUAL', match: null });
  }

  const statusKind = view.kind === 'selected' ? 'selected' : view.kind;
  const statusText = statusKind === 'idle' ? t.states.idle : t.states[statusKind];
  const statusRole = ['error', 'validation', 'denied'].includes(statusKind) ? 'alert' : 'status';

  const body = (
    <>
      <div className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </div>
      <CardContent className="grid gap-4 p-4">
        <form className="grid gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto]" onSubmit={submit}>
          {fields.map((field) => (
            <Field id={`lookup-${field}`} key={field} label={t.fields[field]}>
              <Input disabled={lookupDisabled} id={`lookup-${field}`} name={field} />
            </Field>
          ))}
          <div className="flex items-end">
            <Button className="w-full" disabled={view.kind === 'loading' || lookupDisabled} type="submit">
              {lookupDisabled ? t.actions.disabled : view.kind === 'loading' ? t.states.loading : t.actions.search}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="success">{t.sources.local}</StatusBadge>
          <StatusBadge tone="info">{t.sources.dms}</StatusBadge>
          <StatusBadge>{t.sources.manual}</StatusBadge>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
          <section aria-label={t.resultTitle} className="rounded-md border border-line-subtle bg-surface-raised p-3">
            <h3 className="text-sm font-semibold">{t.resultTitle}</h3>
            <StateBlock className="mt-2" message={statusText} tone={statusRole === 'alert' ? 'error' : statusKind === 'selected' ? 'success' : 'neutral'} />
            {view.kind === 'match' || view.kind === 'multiple' || view.kind === 'selected' ? (
              <ul className="mt-3 grid gap-2">
                {view.matches.map((match) => (
                  <li className="rounded-sm border border-line-subtle bg-surface p-3 text-sm" key={`${match.customerCode ?? match.customerName}-${match.vin ?? match.primaryPhone}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-content-strong">{match.customerName}</p>
                        <p className="text-xs text-content-muted">{vehicleLabel(match) || t.resultFields.vehicle}</p>
                      </div>
                      <StatusBadge tone="info">{t.sources.dms}</StatusBadge>
                    </div>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {resultRows(match, t).map(([label, value]) => (
                        <div className="rounded-sm bg-surface-raised px-2 py-1" key={label}>
                          <dt className="text-xs text-content-muted">{label}</dt>
                          <dd className="break-words font-medium text-content-strong">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <Button className="mt-3" onClick={() => selectMatch(match)} size="sm" type="button" variant={view.kind === 'selected' && view.selected === match ? 'secondary' : 'outline'}>
                      {view.kind === 'selected' && view.selected === match ? t.states.selected : t.actions.useMatch}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section aria-label={t.manualTitle} className="rounded-md border border-line-subtle bg-surface-raised p-3">
            <h3 className="text-sm font-semibold">{t.manualTitle}</h3>
            <p className="mt-2 text-sm text-content-muted">{t.manualHelp}</p>
            <Button className="mt-3" onClick={selectManual} type="button" variant="outline">
              {t.manualAction}
            </Button>
          </section>
        </div>
      </CardContent>
    </>
  );

  if (surface === 'section') {
    return (
      <section aria-label={t.title} className="rounded-md border border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
        {body}
      </section>
    );
  }

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      {body}
    </Card>
  );
}

function lookupQuery(form: FormData): StaffDmsLookupQuery {
  return {
    phone: text(form, 'phone'),
    customerNumber: text(form, 'customerNumber'),
    name: text(form, 'name'),
    vin: text(form, 'vin'),
  };
}

function hasLookupValue(query: StaffDmsLookupQuery): boolean {
  return Boolean(query.phone || query.customerNumber || query.name || query.vin);
}

function text(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function viewFromLookup(lookup: DmsLookupResult): ViewState {
  if (lookup.result === 'MATCH') return { kind: 'match', matches: lookup.matches };
  if (lookup.result === 'MULTIPLE_MATCHES') return { kind: 'multiple', matches: lookup.matches };
  if (lookup.result === 'NOT_FOUND') return { kind: 'none', matches: [] };
  if (lookup.result === DMS_DOWN_STATUS) return { kind: 'down', matches: [] };
  return { kind: 'disabled', matches: [] };
}

function previewView(state: LookupPreviewState | undefined): ViewState {
  if (state === 'match') return { kind: 'match', matches: [sampleMatch('CUST-100', 'Nadia Saleh', 'WBA12345678900001')] };
  if (state === 'multiple') {
    return {
      kind: 'multiple',
      matches: [
        sampleMatch('CUST-100', 'Nadia Saleh', 'WBA12345678900001'),
        sampleMatch('CUST-101', 'Nadia Saleh', 'WBA12345678900002'),
      ],
    };
  }
  if (state === 'loading') return { kind: 'loading', matches: [] };
  if (state === 'none') return { kind: 'none', matches: [] };
  if (state === 'down') return { kind: 'down', matches: [] };
  if (state === 'disabled') return { kind: 'disabled', matches: [] };
  if (state === 'validation') return { kind: 'validation', matches: [] };
  if (state === 'manual') return { kind: 'manual', matches: [] };
  if (state === 'error') return { kind: 'error', matches: [] };
  return { kind: 'disabled', matches: [] };
}

function sampleMatch(customerCode: string, customerName: string, vin: string): DmsCustomerVehicleMatch {
  return {
    customerId: `cust_${customerCode.toLowerCase()}`,
    customerCode,
    customerName,
    primaryPhone: '+201001112222',
    vehicleId: `veh_${vin.toLowerCase()}`,
    vin,
    plateNumber: 'EG-123',
    brand: 'Toyota',
    model: 'Corolla',
    modelYear: 2023,
    warrantyStatus: 'Active',
    serviceBranch: 'Main Branch',
    source: 'DMS',
  };
}

function resultRows(match: DmsCustomerVehicleMatch, t: typeof staffShellText[Locale]['lookup']): Array<[string, string]> {
  return [
    [t.resultFields.customerId, match.customerId],
    [t.resultFields.customerNumber, match.customerCode],
    [t.resultFields.phone, match.primaryPhone],
    [t.resultFields.vehicleId, match.vehicleId],
    [t.resultFields.vin, match.vin],
    [t.resultFields.plate, match.plateNumber],
    [t.resultFields.modelYear, match.modelYear === undefined ? undefined : String(match.modelYear)],
    [t.resultFields.warranty, match.warrantyStatus],
    [t.resultFields.branch, match.serviceBranch ?? match.salesBranch],
    [t.resultFields.source, match.source],
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

function vehicleLabel(match: DmsCustomerVehicleMatch): string {
  return [match.brand, match.model].filter(Boolean).join(' ');
}
