import React from 'react';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { complaintTabsText } from '../../i18n/staff-complaint-tabs';
import { complaintRelationsText } from '../../i18n/staff-complaint-relations';
import { caseLifecycleStatusLabel, caseTypeLabel, complaintStatusLabel, severityLabel, slaStateLabel, complaintTypeLabel } from '../../i18n/domain-labels';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { formatDisplayDate, formatDisplayNumber, missingDisplay } from '../../lib/locale-format';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffAssignmentOptions } from '../../lib/staff-assignment-options-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { StaffComplaintRelationsView } from '../../lib/staff-complaint-relations-api';
import type { StaffComplaintComment } from '../../lib/staff-complaint-comments-api';
import type { StaffComplaintSurvey } from '../../lib/staff-complaint-surveys-api';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import { ComplaintAttachmentControls, type ComplaintAttachmentFixtureState } from '../complaint-attachment-controls';
import { ComplaintCommentsPanel, type ComplaintCommentsFixtureState } from '../complaint-comments-panel';
import { ComplaintWorkflowModal, type ComplaintWorkflowFixtureState } from '../complaint-workflow-modal';
import type { LookupFixtureState } from '../customer-vehicle-lookup';
import { PageHeader, StateBlock, StatusBadge, Timeline } from '../shared/ui-primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CaseCapaPanel } from './case-capa-panel';
import { CommunicationTimelinePanel } from './communication-timeline-panel';
import { ComplaintRelationsPanel } from './complaint-relations-panel';
import { ProvenanceCorrectionPanel } from './provenance-correction-panel';

export type ComplaintDetailFixtureState = 'loading' | 'empty' | 'error' | 'denied' | 'notFound';
export type { ComplaintAttachmentFixtureState };
export type { ComplaintCommentsFixtureState };
export type { ComplaintWorkflowFixtureState };

export function ComplaintDetailWorkspace({
  assignmentOptions,
  attachmentState,
  comments,
  commentsState,
  commentVisibility,
  detail,
  locale,
  lookupState,
  initialTab = 'work',
  options,
  relations,
  staff,
  state,
  surveys,
  workflowState,
}: {
  assignmentOptions?: StaffAssignmentOptions | null | undefined;
  attachmentState?: ComplaintAttachmentFixtureState | undefined;
  comments?: StaffComplaintComment[] | null | undefined;
  commentsState?: ComplaintCommentsFixtureState | undefined;
  commentVisibility?: 'INTERNAL' | 'PUBLIC' | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  initialTab?: 'work' | 'communication' | 'details' | undefined;
  lookupState?: LookupFixtureState | undefined;
  options?: ComplaintFormOptions | null | undefined;
  relations?: StaffComplaintRelationsView | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state?: ComplaintDetailFixtureState | undefined;
  surveys?: StaffComplaintSurvey[] | null | undefined;
  workflowState?: ComplaintWorkflowFixtureState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = complaintDetailText[locale];
  const tabs = complaintTabsText[locale];
  const values = detail ? detailValues(detail, t.values, locale) : t.values;
  const caseTimeline = detail?.caseTimeline ?? [];
  const provenance = detail ? provenanceValues(detail, t) : null;
  const effectiveState = state ?? (!detail && !commentsState && !attachmentState && !workflowState ? 'empty' : undefined);

  return (
    <section aria-label={t.title} className="flex h-full flex-col overflow-hidden" dir={shell.dir}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line-subtle bg-surface px-4">
        <div className="flex items-center gap-4">
          <a href={`/complaints?locale=${locale}`} className="text-sm font-medium text-brand hover:underline">
            &larr; {t.values.backToBoard || 'Back to Board'}
          </a>
          <div className="h-4 w-px bg-line-subtle" />
          <h1 className="text-base font-bold text-content-strong">
            {detail?.subject ?? t.title}
          </h1>
          {detail && (
            <span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs font-medium text-content-muted">
              {values.reference}
            </span>
          )}
        </div>
      </header>

      {effectiveState ? (
        <div className="p-4">
          <StateBlock message={t.states[effectiveState]} tone={effectiveState === 'empty' || effectiveState === 'loading' ? 'neutral' : 'error'} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-e border-line-subtle bg-surface-raised p-4 xl:flex">
            {detail && <DetailSidebar deadlineLabel={tabs.deadlineState} detail={detail} locale={locale} text={t} values={values} />}
            <div className="mt-2">
              <ComplaintWorkflowModal allowedActions={detail?.allowedActions} assignmentOptions={assignmentOptions} complaintId={detail?.id} locale={locale} options={options} staff={staff} status={detail?.status} vehicleNeedsUnavailableReason={Boolean(detail?.vehicleRelated && !detail.vehicle && !detail.vehicleDataUnavailableReason)} workflowState={workflowState} />
            </div>
            {detail && (
              <DetailPanel title={t.sections.ownership} rows={[[t.labels.owner, values.owner], [t.labels.nextAction, detail.nextAction ? actionDisplay(detail.nextAction, t, locale) : t.workflow.states.empty]]} />
            )}
          </aside>

          <main className="flex-1 min-w-0 overflow-y-auto bg-surface p-4">
            <Tabs defaultValue={initialTab} dir={shell.dir}>
              <TabsList className="mb-4 grid h-auto w-full max-w-md grid-cols-3">
                <TabsTrigger value="work">{tabs.work}</TabsTrigger>
                <TabsTrigger value="communication">{tabs.communication}</TabsTrigger>
                <TabsTrigger value="details">{tabs.details}</TabsTrigger>
              </TabsList>
              <TabsContent className="grid gap-3" value="work">
                {/* Work specific summary for mobile or extra workspace */}
                <div className="xl:hidden mb-4">
                  <ComplaintWorkflowModal allowedActions={detail?.allowedActions} assignmentOptions={assignmentOptions} complaintId={detail?.id} locale={locale} options={options} staff={staff} status={detail?.status} vehicleNeedsUnavailableReason={Boolean(detail?.vehicleRelated && !detail.vehicle && !detail.vehicleDataUnavailableReason)} workflowState={workflowState} />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <DetailPanel title={t.sections.ownership} rows={[[t.labels.owner, values.owner], [tabs.deadlineState, values.sla]]} />
                </div>
              </TabsContent>
              <TabsContent className="grid gap-3 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" value="communication">
                {detail ? <CommunicationTimelinePanel detail={detail} locale={locale} text={t} /> : <DetailPanel title={t.sections.communicationTimeline}><StateBlock message={t.commentStates.empty} /></DetailPanel>}
                <ComplaintCommentsPanel comments={comments} commentsState={commentsState} complaintId={detail?.id} initialVisibility={commentVisibility} locale={locale} timeZone={detail?.displayTimeZone ?? 'UTC'} />
              </TabsContent>
              <TabsContent className="grid gap-3 2xl:grid-cols-2" value="details">
                <div className="grid min-w-0 content-start gap-3">
                  <DetailPanel title={t.sections.customer} rows={[[t.labels.customer, detail?.customer.name ?? t.values.customer], [t.labels.contact, detail?.customer.phone ?? t.values.contact], [t.labels.customerNumber, detail?.customer.identifier ?? t.values.none], [t.labels.customerSource, provenance?.customerSource ?? t.values.customerSource], [t.labels.manualCustomer, provenance?.manualCustomer ?? t.values.manualCustomer]]} />
                  <DetailPanel title={t.sections.vehicle} rows={vehicleRows(detail, t, provenance)} />
                  <DetailPanel title={locale === 'ar' ? 'بيانات CRM' : 'CRM Data'} rows={crmRows(detail, locale, t)} />
                  {detail && detail.templateData && Object.keys(detail.templateData).length > 0 && (
                    <DetailPanel 
                      title={locale === 'ar' ? 'بيانات إضافية' : 'Additional Information'} 
                      rows={Object.entries(detail.templateData).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)])} 
                    />
                  )}
                  {detail ? <ProvenanceCorrectionPanel detail={detail} locale={locale} lookupState={lookupState} text={{ ...t.correction, title: tabs.dms }} /> : null}
                  <ComplaintAttachmentControls attachmentState={attachmentState} complaintId={detail?.id} locale={locale} />
                </div>
                <aside className="grid min-w-0 content-start gap-3">
                  <DetailPanel title={t.sections.caseTimeline} rows={detail?.case ? [[t.labels.caseType, caseTypeLabel(locale, detail.case.type)], [t.labels.status, complaintStatusLabel(locale, detail.case.status)], [t.labels.caseLifecycle, caseLifecycleStatusLabel(locale, detail.case.lifecycleStatus)], [t.labels.caseBranch, detail.case.branchName], [t.labels.caseOwner, detail.case.ownerName ?? t.values.owner]] : [[t.labels.caseLifecycle, t.states.empty]]}>{caseTimeline.length ? <Timeline emptyText={t.states.empty} items={caseTimeline.map((item) => ({ meta: '', text: `${item.label} - ${formatDate(item.at, locale)}` }))} /> : null}</DetailPanel>
                  <CaseCapaPanel caseId={detail?.case?.id} caseOwnerId={detail?.case?.ownerId ?? undefined} items={detail?.capaActions ?? []} locale={locale} staff={staff} text={{ ...t.capa, title: tabs.capa }} />
                  <DetailPanel title={t.sections.survey} rows={surveyRows(surveys, t, locale)} />
                  <ComplaintRelationsPanel complaintId={detail?.id} locale={locale} relations={relations} text={complaintRelationsText[locale]} />
                </aside>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </section>
  );
}

function surveyRows(surveys: StaffComplaintSurvey[] | null | undefined, t: typeof complaintDetailText.en, locale: Locale): readonly (readonly [string, string])[] {
  const latest = surveys?.[0];
  return [
    [t.labels.rating, latest ? `${latest.rating} / 5` : t.values.none],
    [t.labels.submitted, latest ? formatDate(latest.submittedAt, locale) : t.values.none],
  ];
}

function DetailSidebar({ deadlineLabel, detail, locale, text, values }: { deadlineLabel: string; detail: StaffComplaintDetailView; locale: Locale; text: typeof complaintDetailText.en; values: typeof complaintDetailText.en.values }) {
  return (
    <div className="grid gap-3" aria-label={text.sections.facts}>
      <SummaryItem label={text.labels.status} value={<StatusBadge tone="brand">{values.status}</StatusBadge>} />
      <SummaryItem label={text.labels.severity} value={<StatusBadge tone="danger">{values.severity}</StatusBadge>} />
      <SummaryItem label={deadlineLabel} value={values.sla} />
      <SummaryItem label={text.labels.category} value={<bdi>{values.category}</bdi>} />
      <SummaryItem label={text.labels.customer} value={detail.customer.name} />
      <SummaryItem label={text.labels.vehicle} value={detail.vehicle ? `${detail.vehicle.make} ${detail.vehicle.model}` : text.values.none} />
      
      {/* Tracking Info */}
      {detail.createdBy && (
        <SummaryItem 
          label={text.labels.createdBy || 'Created by'} 
          value={
            <div className="flex flex-col">
              <span>{locale === 'ar' ? detail.createdBy.nameAr : detail.createdBy.name}</span>
              {detail.createdBy.phone ? (
                <span className="text-xs text-content-muted font-mono">{detail.createdBy.phone}</span>
              ) : null}
            </div>
          } 
        />
      )}
      {detail.approvedBy && (
        <SummaryItem 
          label={text.labels.approvedBy || 'Approved by'} 
          value={
            <div className="flex flex-col">
              <span>{locale === 'ar' ? detail.approvedBy.nameAr : detail.approvedBy.name}</span>
              {detail.approvedBy.phone ? (
                <span className="text-xs text-content-muted font-mono">{detail.approvedBy.phone}</span>
              ) : null}
            </div>
          } 
        />
      )}
      {detail.assignedBy && (
        <SummaryItem 
          label={text.labels.assignedBy || 'Assigned by'} 
          value={
            <div className="flex flex-col">
              <span>{locale === 'ar' ? detail.assignedBy.nameAr : detail.assignedBy.name}</span>
              {(detail.assignedBy.departmentName || detail.assignedBy.departmentNameAr) && (
                <span className="text-xs text-content-muted">
                  {locale === 'ar' ? detail.assignedBy.departmentNameAr || detail.assignedBy.departmentName : detail.assignedBy.departmentName}
                </span>
              )}
              {detail.assignedBy.phone ? (
                <span className="text-xs text-content-muted font-mono">{detail.assignedBy.phone}</span>
              ) : null}
            </div>
          } 
        />
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-line-subtle bg-surface px-3 py-2 text-sm shadow-sm">
      <span className="text-xs text-content-muted">{label}</span>
      <span className="font-medium text-content-strong">{value}</span>
    </div>
  );
}

function vehicleRows(detail: StaffComplaintDetailView | undefined, t: typeof complaintDetailText.en, provenance: ReturnType<typeof provenanceValues> | null): readonly (readonly [string, string])[] {
  if (!detail) {
    return [
      [t.labels.vehicle, t.values.vehicle],
      [t.labels.vin, t.values.vin],
      [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
      [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
      [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
      [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
    ];
  }
  if (!detail.vehicle) {
    return [
      [t.labels.vehicle, detail.vehicleRelated ? detail.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason : t.values.none],
      [t.labels.vin, t.values.none],
      [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
      [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
      [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
      [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
    ];
  }
  return [
    [t.labels.vehicle, `${detail.vehicle.make} ${detail.vehicle.model} ${detail.vehicle.year}`],
    [t.labels.vin, detail.vehicle.vin],
    [t.labels.plate, detail.vehicle.plate],
    [t.labels.vehicleRelated, provenance?.vehicleRelated ?? t.values.vehicleRelated],
    [t.labels.vehicleSource, provenance?.vehicleSource ?? t.values.vehicleSource],
    [t.labels.manualVehicle, provenance?.manualVehicle ?? t.values.manualVehicle],
    [t.labels.vehicleDataUnavailableReason, provenance?.vehicleDataUnavailableReason ?? t.values.vehicleDataUnavailableReason],
  ];
}

function crmRows(detail: StaffComplaintDetailView | undefined, locale: Locale, t: typeof complaintDetailText.en): readonly (readonly [string, string])[] {
  if (!detail) return [];
  const yes = locale === 'ar' ? 'نعم' : 'Yes';
  const no = locale === 'ar' ? 'لا' : 'No';
  const rows: [string, string][] = [
    [locale === 'ar' ? 'نوع الطلب' : 'Request Type', detail.type ? complaintTypeLabel(locale, detail.type) : t.values.none],
    [locale === 'ar' ? 'القناة' : 'Channel', detail.channel || t.values.none],
    [locale === 'ar' ? 'نوع العميل' : 'Customer Type', detail.customerType || t.values.none],
    [locale === 'ar' ? 'اسم مستشار المبيعات' : 'Sales Advisor Name', detail.salesAdvisorName || t.values.none],
    [locale === 'ar' ? 'فئة السبب الجذري' : 'Root Cause Category', detail.rootCauseCategory || t.values.none],
    [locale === 'ar' ? 'تاريخ آخر خدمة' : 'Last Service Date', detail.lastServiceDate ? formatDate(detail.lastServiceDate, locale) : t.values.none],
    [locale === 'ar' ? 'قراءة العداد' : 'Odometer', detail.odometer !== null && detail.odometer !== undefined ? detail.odometer.toString() : t.values.none],
    [locale === 'ar' ? 'الضمان ساري' : 'Warranty Active', detail.warrantyActive ? yes : no],
    [locale === 'ar' ? 'عميل متكرر' : 'Repeat Customer', detail.repeatCustomer ? yes : no],
  ];
  if (detail.backupOfficerName) {
    rows.push([
      locale === 'ar' ? 'الموظف البديل' : 'Backup Officer',
      detail.backupOfficerPhone ? `${detail.backupOfficerName} (${detail.backupOfficerPhone})` : detail.backupOfficerName,
    ]);
  }
  if (detail.collaboratorName) {
    rows.push([
      locale === 'ar' ? 'الموظف المتعاون' : 'Collaborator Officer',
      detail.collaboratorPhone ? `${detail.collaboratorName} (${detail.collaboratorPhone})` : detail.collaboratorName,
    ]);
  }
  return rows;
}

function detailValues(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values, locale: Locale): typeof complaintDetailText.en.values {
  return {
    ...fallback,
    reference: detail.reference,
    status: complaintStatusLabel(locale, detail.status),
    severity: severityLabel(locale, detail.severity),
    category: locale === 'ar' ? detail.categoryNameAr || detail.categoryName : detail.categoryName || detail.categoryNameAr,
    owner: detail.ownerPhone ? `${detail.assignee ?? fallback.owner} (${detail.ownerPhone})` : (detail.assignee ?? fallback.owner),
    sla: slaLabel(detail, fallback, locale),
  };
}

function slaLabel(detail: StaffComplaintDetailView, fallback: typeof complaintDetailText.en.values, locale: Locale): string {
  const percent = detail.slaPercentElapsed === null || detail.slaPercentElapsed === undefined ? '' : ` ${formatDisplayNumber(detail.slaPercentElapsed, locale)}%`;
  const due = detail.slaDueAt ? ` - ${formatDisplayDate(detail.slaDueAt, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: detail.displayTimeZone })} (${detail.displayTimeZone})` : '';
  return `${slaStateLabel(locale, detail.slaState)}${percent}${due}` || fallback.sla;
}

function provenanceValues(detail: StaffComplaintDetailView, t: typeof complaintDetailText.en) {
  return {
    customerSource: t.correction.sourceLabels[detail.customerSource],
    manualCustomer: detail.manualCustomer ? t.values.yes : t.values.no,
    vehicleRelated: detail.vehicleRelated ? t.values.yes : t.values.no,
    vehicleSource: t.correction.sourceLabels[detail.vehicleSource ?? 'NONE'],
    manualVehicle: detail.manualVehicle ? t.values.yes : t.values.no,
    vehicleDataUnavailableReason: detail.vehicleDataUnavailableReason ?? t.values.none,
  };
}

function actionDisplay(action: string, text: typeof complaintDetailText.en, locale: Locale): string {
  const key = action.toUpperCase().replaceAll(' ', '_');
  const labels = text.workflow.actionLabels as Partial<Record<string, string>>;
  const label = labels[action] ?? labels[key];
  if (label) return label;
  return locale === 'ar' && /^[\x00-\x7F]+$/.test(action) ? missingDisplay(locale) : action;
}

function formatDate(value: string, locale: Locale, timeZone = 'UTC'): string {
  return `${formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone })} (${timeZone})`;
}

function DetailPanel({ children, rows, title }: { children?: React.ReactNode; rows?: readonly (readonly [string, string])[]; title: string }) {
  return (
    <section className="rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={title}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows ? <DetailRows rows={rows} /> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function DetailRows({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-3 grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div className="grid grid-cols-[minmax(4.5rem,0.7fr)_minmax(7rem,1.3fr)] gap-2 rounded-sm bg-surface px-3 py-2" key={label}>
          <dt className="text-content-muted">{label}</dt>
          <dd className="break-words font-medium text-content-strong">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
