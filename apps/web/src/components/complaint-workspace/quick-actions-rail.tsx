'use client';

import React, { useState } from 'react';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffAssignmentOptions } from '../../lib/staff-assignment-options-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import { ComplaintWorkflowModal } from '../complaint-workflow-modal';
import { DeleteComplaintButton } from './delete-complaint-button';

import { Button } from '../ui/button';

export function QuickActionsRail({
  assignmentOptions,
  detail,
  locale,
  options,
  staff,
  t,
}: {
  assignmentOptions?: StaffAssignmentOptions | null | undefined;
  detail: StaffComplaintDetailView;
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  staff?: AssignableStaff[] | null | undefined;
  t: any;
}) {


  return (
    <div className="flex flex-col gap-4">
      {/* ── Quick Actions (Status/Routing) ── */}
      <ComplaintWorkflowModal
        allowedActions={detail.allowedActions}
        assignmentOptions={assignmentOptions}
        complaintId={detail.id}
        locale={locale}
        options={options}
        staff={staff}
        status={detail.status}
        vehicleNeedsUnavailableReason={Boolean(detail.vehicleRelated && !detail.vehicle && !detail.vehicleDataUnavailableReason)}
      />



      {/* ── Danger Zone ── */}
      {detail.canDelete ? (
        <section className="rounded-xl border border-danger-subtle bg-danger-sunken p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-danger">Danger Zone</h3>
          <DeleteComplaintButton complaintId={detail.id} locale={locale} />
        </section>
      ) : null}
    </div>
  );
}
