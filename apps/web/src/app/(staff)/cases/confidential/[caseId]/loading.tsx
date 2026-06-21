import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { confidentialCaseText } from '../../../../../i18n/staff-confidential-cases';

export default function ConfidentialCaseLoading() {
  const t = confidentialCaseText.en;
  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4" role="status">
        <p className="text-sm text-slate-700">{t.states.loading}</p>
        <Skeleton className="h-24 rounded-sm" />
        <Skeleton className="h-32 rounded-sm" />
      </CardContent>
    </Card>
  );
}
