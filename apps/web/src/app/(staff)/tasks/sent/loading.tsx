import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sentTasksText } from '../../../../i18n/staff-sent-tasks';

export default function SentTasksLoading() {
  const t = sentTasksText.en;
  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div className="h-40 animate-pulse rounded-md border border-border bg-muted" key={index} />)}
      </CardContent>
    </Card>
  );
}
