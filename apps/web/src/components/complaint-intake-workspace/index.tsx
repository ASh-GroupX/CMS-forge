'use client';

import React, { useState } from 'react';
import { ComplaintCreateForm, type CreateFormFixtureState } from '../complaint-create-form';
import { CustomerVehicleLookup, type LookupFixtureState, type LookupSelection } from '../customer-vehicle-lookup';
import { PageHeader } from '../shared/ui-primitives';
import { complaintCreateText } from '../../i18n/staff-complaint-create';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';

export function ComplaintIntakeWorkspace({
  createState,
  locale,
  lookupState,
  options,
}: {
  createState?: CreateFormFixtureState | undefined;
  locale: Locale;
  lookupState?: LookupFixtureState | undefined;
  options?: ComplaintFormOptions | null | undefined;
}) {
  const [lookupSelection, setLookupSelection] = useState<LookupSelection | null>(null);
  const t = complaintCreateText[locale].intake;
  const steps = [t.steps.lookup, t.steps.facts, t.steps.attachments, t.steps.submit];

  return (
    <section className="grid gap-4" aria-label={t.title}>
      <PageHeader description={t.description} eyebrow={t.eyebrow} title={t.title} />
      <ol className="grid gap-2 rounded-md border border-line-subtle bg-surface p-3 text-sm md:grid-cols-4">
        {steps.map((step, index) => (
          <li className="flex items-center gap-2 rounded-sm bg-surface-raised px-3 py-2 text-content-muted" key={step}>
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-brand text-xs font-semibold text-brand-foreground">
              {index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </li>
        ))}
      </ol>
      <CustomerVehicleLookup locale={locale} onSelectionChange={setLookupSelection} state={lookupState} />
      <ComplaintCreateForm locale={locale} lookupSelection={lookupSelection} options={options} state={createState} />
    </section>
  );
}
