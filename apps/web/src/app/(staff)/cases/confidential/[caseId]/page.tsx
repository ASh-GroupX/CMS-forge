import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { confidentialCaseText } from '../../../../../i18n/staff-confidential-cases';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { getStaffConfidentialCaseTimeline } from '../../../../../lib/staff-confidential-cases-api';

type SearchParams = { locale?: string | string[] };

export default async function ConfidentialCasePage({
  cookieHeader,
  fetchImpl,
  params,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  params: Promise<{ caseId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(readParam(query?.locale));
  const t = confidentialCaseText[locale];
  const timeline = await getStaffConfidentialCaseTimeline({
    caseId: routeParams.caseId,
    ...(cookieHeader === undefined ? {} : { cookieHeader }),
    ...(fetchImpl === undefined ? {} : { fetchImpl }),
  });

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="border-b border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
          </div>
          <Badge variant="secondary">{t.privacyBadge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        {!timeline ? (
          <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">{t.states.error}</p>
        ) : (
          <>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections.summary}>
              <h3 className="text-sm font-semibold">{t.sections.summary}</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <Summary label={t.labels.caseId} value={timeline.case.id} />
                <Summary label={t.labels.type} value={timeline.case.type} />
                <Summary label={t.labels.status} value={timeline.case.lifecycleStatus} />
                <Summary label={t.labels.branch} value={timeline.case.branchId} />
                <Summary label={t.labels.owner} value={timeline.case.ownerName ?? '-'} />
                <Summary label={t.labels.updated} value={timeline.case.updatedAt} />
              </dl>
            </section>
            <section className="rounded-md border border-slate-200 bg-white p-3" aria-label={t.sections.notes}>
              <h3 className="text-sm font-semibold">{t.sections.notes}</h3>
              {timeline.restrictedNotes.length === 0 ? (
                <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">{t.states.empty}</p>
              ) : (
                <Table className="mt-3 min-w-[44rem]">
                  <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
                    <TableRow>
                      <TableHead className="text-start">{t.labels.author}</TableHead>
                      <TableHead className="text-start">{t.sections.notes}</TableHead>
                      <TableHead className="text-start">{t.labels.occurred}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeline.restrictedNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.authorId ?? '-'}</TableCell>
                        <TableCell className="font-semibold">{note.body}</TableCell>
                        <TableCell>{note.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
            <section className="rounded-md border border-slate-200 bg-white p-3" aria-label={t.sections.events}>
              <h3 className="text-sm font-semibold">{t.sections.events}</h3>
              <Table className="mt-3 min-w-[34rem]">
                <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
                  <TableRow>
                    <TableHead className="text-start">{t.labels.event}</TableHead>
                    <TableHead className="text-start">{t.labels.occurred}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.events.map((event) => (
                    <TableRow key={`${event.type}-${event.occurredAt}`}>
                      <TableCell className="font-semibold">{event.type}</TableCell>
                      <TableCell>{event.occurredAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
