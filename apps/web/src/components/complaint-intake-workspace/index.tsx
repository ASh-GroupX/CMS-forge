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

  return (
    <section className="grid gap-4" aria-label={t.title}>
      <PageHeader description={t.description} eyebrow={t.eyebrow} title={t.title} />
      <CustomerVehicleLookup locale={locale} onSelectionChange={setLookupSelection} state={lookupState} />
      <ComplaintCreateForm locale={locale} lookupSelection={lookupSelection} options={options} state={createState} />
    </section>
  );
}
