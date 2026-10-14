import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FormSelect } from '../ui/form-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { severityLabel } from '../../i18n/domain-labels';
import { adminCategoriesSlaText } from '../../i18n/staff-admin-categories-sla';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminCategorySlaConfig, AdminSlaPolicy } from '../../lib/staff-admin-category-sla-api';
import { CategoryTable } from './category-table';
import { NumberField, TextField } from './text-field';

export type AdminConfigFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';
type AdminAction = (formData: FormData) => void | Promise<void>;

export function AdminCategoriesSla({
  categoryAction,
  config,
  deactivateCategoryAction,
  locale,
  seedAction,
  slaAction,
  state,
  viewMode = 'all',
}: {
  categoryAction?: AdminAction | undefined;
  config?: AdminCategorySlaConfig | null | undefined;
  deactivateCategoryAction?: AdminAction | undefined;
  locale: Locale;
  seedAction?: AdminAction | undefined;
  slaAction?: AdminAction | undefined;
  state?: AdminConfigFixtureState | undefined;
  viewMode?: 'all' | 'sla' | 'categories' | undefined;
}) {
  const shell = staffShellText[locale];
  const t = adminCategoriesSlaText[locale];
  const categories = config?.categories ?? [];
  const policies = config?.policies ?? [];
  const visibleState = state ?? (config && categories.length === 0 && policies.length === 0 ? 'empty' : undefined);

  const isSlaView = viewMode === 'sla';
  const pageTitle = isSlaView ? (locale === 'ar' ? 'سياسات اتفاقية مستوى الخدمة (SLA)' : 'SLA Policies') : t.title;
  const pageSubtitle = isSlaView
    ? (locale === 'ar' ? 'إدارة مُدد الاستجابة والحل لجميع مراحل الشكاوى ودرجات الخطورة ومستويات التصعيد.' : 'Configure stage resolution targets, warning thresholds, calendar modes, and escalation levels.')
    : t.subtitle;
  const returnTo = isSlaView ? '/admin/sla' : '/admin/categories';

  return (
    <Card aria-label={pageTitle} className="min-w-0 rounded-md border-border-subtle bg-surface-card shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border-subtle p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{pageTitle}</CardTitle>
            <CardDescription className="mt-1 text-sm text-content-muted">{pageSubtitle}</CardDescription>
          </div>
          {seedAction ? (
            <form action={seedAction}>
              <input name="locale" type="hidden" value={locale} />
              <input name="returnTo" type="hidden" value={returnTo} />
              <Button size="sm" type="submit" variant="outline">
                {locale === 'ar' ? 'تهيئة السياسات الافتراضية' : 'Initialize Default Policies'}
              </Button>
            </form>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        {visibleState ? <StateBlock message={t.states[visibleState]} tone={visibleState === 'success' ? 'success' : visibleState === 'error' || visibleState === 'validation' || visibleState === 'conflict' ? 'error' : 'neutral'} /> : null}
        <p className="rounded-sm border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-content-muted">{t.auditNote}</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {!isSlaView ? (
            <CategoryTable action={categoryAction} deactivateAction={deactivateCategoryAction} locale={locale} rows={categories} departments={config?.departments ?? []} branches={config?.branches ?? []} />
          ) : null}
          <SeverityTable locale={locale} policies={policies} />
          <SlaTable action={slaAction} locale={locale} policies={policies} returnTo={returnTo} seedAction={seedAction} />
          <p className="rounded-sm border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-content-muted xl:col-span-2">{t.slaNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityTable({ locale, policies }: { locale: Locale; policies: AdminSlaPolicy[] }) {
  const t = adminCategoriesSlaText[locale];
  const severities = Array.from(new Set(policies.map((policy) => policy.severity)));
  return (
    <section className="overflow-x-auto rounded-md border border-border-subtle bg-surface-muted" aria-label={t.sections.severities}>
      <h3 className="border-b border-border-subtle px-3 py-2 text-sm font-semibold">{t.sections.severities}</h3>
      <Table className="min-w-[30rem]">
        <TableHeader className="bg-surface-card text-xs font-semibold uppercase tracking-normal text-content-muted">
          <TableRow>{t.severityHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>{severities.length ? severities.map((severity) => <TableRow key={severity}><TableCell className="font-semibold" title={severity}>{severityLabel(locale, severity)}</TableCell><TableCell>{t.severitySource}</TableCell></TableRow>) : <TableRow><TableCell className="text-content-muted" colSpan={2}>{t.states.empty}</TableCell></TableRow>}</TableBody>
      </Table>
    </section>
  );
}

const STAGE_LABELS: Record<Locale, Record<string, string>> = {
  en: { INTAKE: 'Intake', MANAGER_REVIEW: 'Manager Review', BRANCH_REVIEW: 'Branch Review', INVESTIGATION: 'Investigation', RESOLUTION: 'Resolution', CLOSURE: 'Closure' },
  ar: { INTAKE: 'استلام الشكوى', MANAGER_REVIEW: 'مراجعة المدير', BRANCH_REVIEW: 'مراجعة الفرع', INVESTIGATION: 'التحقيق والفحص', RESOLUTION: 'الحل والمعالجة', CLOSURE: 'الإغلاق النهائي' },
};

function formatDurationMinutes(minutes: number, locale: Locale): string {
  if (minutes < 60) return locale === 'ar' ? `${minutes} د` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'ar' ? `${minutes} د (${hours} س)` : `${minutes}m (${hours}h)`;
  const days = Math.floor(hours / 24);
  return locale === 'ar' ? `${minutes} د (${days} ي)` : `${minutes}m (${days}d)`;
}

function SlaTable({ action, locale, policies, returnTo = '/admin/categories', seedAction }: { action: AdminAction | undefined; locale: Locale; policies: AdminSlaPolicy[]; returnTo?: string | undefined; seedAction?: AdminAction | undefined }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="overflow-x-auto rounded-md border border-border-subtle bg-surface-muted xl:col-span-2 min-w-[54rem]" aria-label={t.sections.sla}>
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <h3 className="text-sm font-semibold">{t.sections.sla} ({policies.length})</h3>
        {policies.length === 0 && seedAction ? (
          <form action={seedAction}>
            <input name="locale" type="hidden" value={locale} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <Button size="sm" type="submit" variant="default">
              {locale === 'ar' ? 'تهيئة سياسات SLA الافتراضية' : 'Initialize Default SLA Policies'}
            </Button>
          </form>
        ) : null}
      </div>
      <Table className="min-w-[64rem]">
        <TableHeader className="bg-surface-card text-xs font-semibold uppercase tracking-normal text-content-muted">
          <TableRow>{t.slaHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {policies.length ? policies.map((policy) => <SlaRow action={action} key={policy.id} locale={locale} policy={policy} returnTo={returnTo} />) : (
            <TableRow>
              <TableCell className="text-content-muted text-center py-6" colSpan={8}>
                <div className="flex flex-col items-center gap-2">
                  <span>{t.states.empty}</span>
                  {seedAction ? (
                    <form action={seedAction}>
                      <input name="locale" type="hidden" value={locale} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <Button size="sm" type="submit" variant="default">
                        {locale === 'ar' ? 'تهيئة سياسات SLA الافتراضية (24 سياسة)' : 'Initialize Default SLA Policies (24 Policies)'}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function SlaRow({ action, locale, policy, returnTo = '/admin/categories' }: { action: AdminAction | undefined; locale: Locale; policy: AdminSlaPolicy; returnTo?: string | undefined }) {
  const t = adminCategoriesSlaText[locale];
  const stageDisplay = STAGE_LABELS[locale][policy.stage] ?? policy.stage;
  const durationDisplay = formatDurationMinutes(policy.durationMinutes, locale);
  return (
    <TableRow className="border-b border-border-subtle">
      <TableCell className="font-semibold">{stageDisplay}</TableCell>
      <TableCell title={policy.severity}><StatusBadge>{severityLabel(locale, policy.severity)}</StatusBadge></TableCell>
      <TableCell className="whitespace-nowrap">{durationDisplay}</TableCell>
      <TableCell>{policy.warningPercent}%</TableCell>
      <TableCell className="text-xs">{policy.branchTimezone} / {policy.workingCalendarMode === 'ALWAYS_ON' ? t.modes.ALWAYS_ON : t.modes.CALENDAR_HOURS}</TableCell>
      <TableCell className="text-xs">{policy.escalationLevel1}{policy.escalationLevel2 ? ` -> ${policy.escalationLevel2}` : ''}{policy.escalationLevel3 ? ` -> ${policy.escalationLevel3}` : ''}</TableCell>
      <TableCell><StatusBadge>{policy.isActive ? t.badges.active : t.badges.inactive}</StatusBadge></TableCell>
      <TableCell>{action ? <SlaForm action={action} locale={locale} policy={policy} returnTo={returnTo} /> : null}</TableCell>
    </TableRow>
  );
}

function SlaForm({ action, locale, policy, returnTo = '/admin/categories' }: { action: AdminAction; locale: Locale; policy: AdminSlaPolicy; returnTo?: string | undefined }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <form action={action} className="grid min-w-[36rem] gap-2 md:grid-cols-5">
      <input name="id" type="hidden" value={policy.id} />
      <input name="locale" type="hidden" value={locale} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <NumberField label={t.fields.durationMinutes} name="durationMinutes" value={policy.durationMinutes} />
      <NumberField label={t.fields.warningPercent} name="warningPercent" value={policy.warningPercent} />
      <TextField label={t.fields.timezone} name="branchTimezone" value={policy.branchTimezone} />
      <label className="grid gap-1 text-sm font-medium">
        {t.fields.calendar}
        <FormSelect
          defaultValue={policy.workingCalendarMode}
          name="workingCalendarMode"
          options={[
            { label: t.modes.ALWAYS_ON, value: 'ALWAYS_ON' },
            { label: t.modes.CALENDAR_HOURS, value: 'CALENDAR_HOURS' },
          ]}
        />
      </label>
      <TextField label={t.fields.escalationLevel1} name="escalationLevel1" value={policy.escalationLevel1} />
      <TextField label={t.fields.escalationLevel2} name="escalationLevel2" value={policy.escalationLevel2 ?? ''} />
      <NumberField label={t.fields.escalationLevel2AfterBreachMinutes} name="escalationLevel2AfterBreachMinutes" value={policy.escalationLevel2AfterBreachMinutes ?? ''} />
      <TextField label={t.fields.escalationLevel3} name="escalationLevel3" value={policy.escalationLevel3 ?? ''} />
      <NumberField label={t.fields.escalationLevel3AfterBreachMinutes} name="escalationLevel3AfterBreachMinutes" value={policy.escalationLevel3AfterBreachMinutes ?? ''} />
      <Button className="self-end" size="sm" type="submit" variant="outline">{t.actions.edit}</Button>
    </form>
  );
}
