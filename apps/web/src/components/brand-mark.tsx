import React from 'react';
import { cn } from '../lib/utils';

export function BrandMark({ className, compact = false, label = 'CMS-Auto', tagline }: { className?: string; compact?: boolean; label?: string; tagline?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand via-brand to-indigo-600 shadow-lg shadow-brand/25">
        <span className="absolute inset-y-2 start-2.5 w-px bg-surface/60" />
        <span className="absolute inset-y-2 end-2.5 w-px bg-surface/60" />
        <span className="absolute start-2.5 top-1/2 h-px w-5 -translate-y-1/2 bg-surface" />
        <span className="absolute end-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-surface shadow-[0_0_8px_rgba(250,250,250,0.8)]" />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-lg font-bold tracking-tight bg-gradient-to-br from-content-strong to-content-muted bg-clip-text text-transparent">{label}</span>
          {tagline ? <span className="block truncate text-[0.65rem] font-semibold tracking-widest text-brand/80 uppercase">{tagline}</span> : null}
        </span>
      )}
    </span>
  );
}
