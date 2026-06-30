'use client';

import React, { useState } from 'react';
import { ComplaintCreateForm, type CreateFormPreviewState } from '../complaint-create-form';
import { CustomerVehicleLookup, type LookupPreviewState, type LookupSelection } from '../customer-vehicle-lookup';
import type { Locale } from '../../i18n/staff-shell';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';

export function ComplaintIntakeWorkspace({
  createState,
  locale,
  lookupState,
  options,
}: {
  createState?: CreateFormPreviewState | undefined;
  locale: Locale;
  lookupState?: LookupPreviewState | undefined;
  options?: ComplaintFormOptions | null | undefined;
}) {
  const [lookupSelection, setLookupSelection] = useState<LookupSelection | null>(null);

  return (
    <>
      <CustomerVehicleLookup locale={locale} onSelectionChange={setLookupSelection} state={lookupState} />
      <ComplaintCreateForm locale={locale} lookupSelection={lookupSelection} options={options} state={createState} />
    </>
  );
}
