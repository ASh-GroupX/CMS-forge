'use client';

import { Filter, Plus, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import type { OperationsBoardCopy } from '../../i18n/staff-operations-board';

// ── Board controls ─────────────────────────────────────────────────────────
// Sticky control bar above the operations board with search, filter toggle,
// view toggle (stage vs department), and a create button.

export type BoardViewMode = 'stage' | 'department' | 'branch' | 'category';

export function OpsBoardControls({ createHref, locale, onSearchChange, onViewChange, search, t, view }: {
  createHref: string;
  locale: string;
  onSearchChange: (value: string) => void;
  onViewChange: (mode: BoardViewMode) => void;
  search: string;
  t: OperationsBoardCopy;
  view: BoardViewMode;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="sticky top-0 z-10 grid gap-3 rounded-xl border border-line-subtle bg-surface/95 p-3 shadow-sm backdrop-blur">
      {/* Row 1: Search + View toggle + Create */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: '12rem' }}>
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />
          <input
            aria-label={t.search}
            className="w-full rounded-lg border border-line-subtle bg-surface pe-3 ps-9 text-sm placeholder:text-content-subtle focus:border-brand focus:ring-1 focus:ring-brand"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.search}
            type="search"
            value={search}
          />
          {search && (
            <button
              aria-label={t.clearFilters}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-content-subtle hover:text-content-strong"
              onClick={() => onSearchChange('')}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-lg border border-line-subtle text-xs font-medium">
          <button
            className={`px-3 py-2 transition-colors ${view === 'stage' ? 'bg-brand text-white' : 'bg-surface text-content-muted hover:bg-surface-raised'}`}
            onClick={() => onViewChange('stage')}
            type="button"
          >
            {t.viewByStage}
          </button>
          <button
            className={`border-s border-line-subtle px-3 py-2 transition-colors ${view === 'department' ? 'bg-brand text-white' : 'bg-surface text-content-muted hover:bg-surface-raised'}`}
            onClick={() => onViewChange('department')}
            type="button"
          >
            {t.viewByDepartment}
          </button>
          <button
            className={`border-s border-line-subtle px-3 py-2 transition-colors ${view === 'branch' ? 'bg-brand text-white' : 'bg-surface text-content-muted hover:bg-surface-raised'}`}
            onClick={() => onViewChange('branch')}
            type="button"
          >
            {t.viewByBranch}
          </button>
        </div>



        {/* Create */}
        <Button asChild className="gap-1.5" size="sm">
          <a href={createHref}>
            <Plus aria-hidden="true" className="size-4" />
            {t.createComplaint}
          </a>
        </Button>
      </div>


    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button
      className="rounded-md border border-line-subtle bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-content-muted hover:border-brand hover:text-brand"
      type="button"
    >
      {label} ▾
    </button>
  );
}
