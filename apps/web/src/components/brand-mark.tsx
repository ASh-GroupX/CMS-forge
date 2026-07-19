import React from 'react';
import { cn } from '../lib/utils';

export function BrandMark({ className, compact = false, label = 'CMS-Auto', tagline }: { className?: string; compact?: boolean; label?: string; tagline?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand shadow-md shadow-brand/20">
        <span className="absolute inset-y-2 start-2.5 w-px bg-white/45" />
        <span className="absolute inset-y-2 end-2.5 w-px bg-white/45" />
        <span className="absolute start-2.5 top-1/2 h-px w-5 -translate-y-1/2 bg-white" />
        <span className="absolute end-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white" />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-[1.05rem] font-semibold tracking-[-0.025em]">{label}</span>
          {tagline ? <span className="mt-0.5 block truncate text-[0.625rem] font-medium tracking-[0.08em]">{tagline}</span> : null}
        </span>
      )}
    </span>
  );
}
