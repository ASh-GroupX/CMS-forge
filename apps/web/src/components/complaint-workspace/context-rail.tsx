import { Building2, Car, Clock, ShieldAlert, User } from 'lucide-react';
import React from 'react';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';

export function ContextRail({ detail, locale, t }: { detail: StaffComplaintDetailView; locale: Locale; t: any }) {
  const isArabic = locale === 'ar';
  
  return (
    <div className="flex flex-col gap-4">
      {/* SLA & Status block */}
      <section className="rounded-xl border border-line-subtle bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-muted">
          {t.sections?.ownership || 'Core Details'}
        </h3>
        <dl className="grid gap-3 text-sm">
          <div className="grid gap-1">
            <dt className="flex items-center gap-2 text-content-muted">
              <ShieldAlert className="size-3.5" />
              {t.labels?.status || 'Status'}
            </dt>
            <dd className="font-semibold text-content-strong">
              <span className="rounded bg-brand/10 px-2 py-0.5 text-brand">{detail.status.replace('_', ' ')}</span>
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="flex items-center gap-2 text-content-muted">
              <User className="size-3.5" />
              {t.labels?.owner || 'Assignee'}
            </dt>
            <dd className="font-semibold text-content-strong">
              {detail.assignee || (t.values?.unassigned ?? 'Unassigned')}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="flex items-center gap-2 text-content-muted">
              <Building2 className="size-3.5" />
              {t.labels?.branch || 'Branch'}
            </dt>
            <dd className="font-semibold text-content-strong">
              {detail.branch || (t.values?.unassigned ?? 'Unassigned')}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="flex items-center gap-2 text-content-muted">
              <Clock className="size-3.5" />
              {t.labels?.sla || 'SLA Status'}
            </dt>
            <dd className="font-semibold text-content-strong">
              <SlaBadge state={detail.slaState} />
            </dd>
          </div>
          
          {(detail.createdBy || detail.approvedBy || detail.assignedBy) && (
            <div className="mt-2 grid gap-3 border-t border-line-subtle pt-4">
              {detail.createdBy && (
                <div className="grid gap-1">
                  <dt className="text-xs text-content-muted">{t.labels?.createdBy || 'Created by'}</dt>
                  <dd className="font-semibold text-content-strong">
                    {isArabic ? (detail.createdBy.nameAr || detail.createdBy.name) : detail.createdBy.name}
                  </dd>
                </div>
              )}
              {detail.approvedBy && (
                <div className="grid gap-1">
                  <dt className="text-xs text-content-muted">{t.labels?.approvedBy || 'Approved by'}</dt>
                  <dd className="font-semibold text-content-strong">
                    {isArabic ? (detail.approvedBy.nameAr || detail.approvedBy.name) : detail.approvedBy.name}
                  </dd>
                </div>
              )}
              {detail.assignedBy && (
                <div className="grid gap-1">
                  <dt className="text-xs text-content-muted">{t.labels?.assignedBy || 'Assigned by'}</dt>
                  <dd className="flex flex-col font-semibold text-content-strong">
                    <span>{isArabic ? (detail.assignedBy.nameAr || detail.assignedBy.name) : detail.assignedBy.name}</span>
                    {(detail.assignedBy.departmentName || detail.assignedBy.departmentNameAr) && (
                      <span className="text-xs font-normal text-content-muted">
                        {isArabic ? (detail.assignedBy.departmentNameAr || detail.assignedBy.departmentName) : detail.assignedBy.departmentName}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </div>
          )}
        </dl>
      </section>

      {/* Customer block */}
      <section className="rounded-xl border border-line-subtle bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-muted">
          {t.sections?.customer || 'Customer'}
        </h3>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-content-muted">{t.labels?.customer || 'Name'}</dt>
            <dd className="font-semibold text-content-strong">{detail.customer?.name || (t.values?.none ?? 'None')}</dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">{t.labels?.contact || 'Phone'}</dt>
            <dd className="font-semibold text-content-strong" dir="ltr">
              {detail.customer?.phone || (t.values?.none ?? 'None')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-content-muted">{t.labels?.customerSource || 'Source'}</dt>
            <dd className="font-semibold text-content-strong">{detail.customerSource}</dd>
          </div>
        </dl>
      </section>

      {/* Vehicle block */}
      <section className="rounded-xl border border-line-subtle bg-surface p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-muted">
          {t.sections?.vehicle || 'Vehicle'}
        </h3>
        {detail.vehicle ? (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-xs text-content-muted">{t.labels?.make || 'Make & Model'}</dt>
              <dd className="font-semibold text-content-strong">
                {detail.vehicle.year} {detail.vehicle.make} {detail.vehicle.model}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">{t.labels?.vin || 'VIN'}</dt>
              <dd className="font-mono text-xs font-semibold text-content-strong">{detail.vehicle.vin}</dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">{t.labels?.plate || 'Plate'}</dt>
              <dd className="font-semibold text-content-strong">{detail.vehicle.plate}</dd>
            </div>
          </dl>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-content-muted">
            <Car className="size-6 opacity-50" />
            <p className="text-sm text-center">
              {detail.vehicleRelated ? (detail.vehicleDataUnavailableReason || 'No vehicle data') : 'Not vehicle related'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SlaBadge({ state }: { state: string }) {
  if (state === 'WARNING') return <span className="text-amber-500">Approaching SLA</span>;
  if (state === 'BREACHED') return <span className="text-red-500">SLA Breached</span>;
  return <span className="text-emerald-500">On Track</span>;
}
