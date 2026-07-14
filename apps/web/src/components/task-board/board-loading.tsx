import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { taskBoardText } from '../../i18n/staff-task-board';

export function TaskBoardLoading({ locale }: { locale: Locale }) {
  const t = taskBoardText[locale];
  return (
    <section aria-busy="true" aria-label={t.states.loading} className="grid content-start gap-4" dir={staffShellText[locale].dir}>
      <header className="grid gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>
      <div className="flex gap-4 overflow-x-hidden pb-3">
        {[0, 1, 2, 3].map((column) => (
          <div className="grid w-72 shrink-0 content-start gap-2 rounded-xl border border-board-column-border bg-board-column p-2" key={column}>
            <Skeleton className="h-8 w-full rounded-lg" />
            {[0, 1, 2].map((card) => <Skeleton className="h-24 w-full rounded-lg" key={card} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
