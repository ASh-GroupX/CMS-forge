'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';
import { DepartmentTicketCard } from './department-ticket-card';
import type { Locale } from '../../../i18n/staff-shell';

interface DepartmentKanbanColumnProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  count: number;
  subtitle?: string | undefined;
  tickets: any[];
  isDropTarget?: boolean | undefined;
  dropText?: string | undefined;
  emptyText: string;
  emptyHint?: string | undefined;
  locale: Locale;
  canDrag: boolean;
  draggedTicketId?: string | undefined;
  onDragOver?: ((e: React.DragEvent) => void) | undefined;
  onDragLeave?: ((e: React.DragEvent) => void) | undefined;
  onDrop?: ((e: React.DragEvent) => void) | undefined;
  onDragStart: (e: React.DragEvent, ticket: any) => void;
  onDragEnd: () => void;
  isInbox?: boolean | undefined;
}

export function DepartmentKanbanColumn({
  id,
  title,
  icon,
  count,
  subtitle,
  tickets,
  isDropTarget = false,
  dropText,
  emptyText,
  emptyHint,
  locale,
  canDrag,
  draggedTicketId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  isInbox = false,
}: DepartmentKanbanColumnProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex-shrink-0 w-80 flex flex-col gap-3 rounded-2xl border transition-all p-4 shadow-sm min-h-[22rem] ${
        isInbox
          ? 'border-brand/20 bg-brand/5'
          : isDropTarget
          ? 'border-brand ring-2 ring-brand/30 bg-brand/5 shadow-md'
          : 'border-line-subtle bg-surface'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-2 mb-1 ${isInbox ? 'border-brand/20' : 'border-line-subtle'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className={`font-bold text-sm truncate ${isInbox ? 'text-brand' : 'text-content-strong'}`} title={title}>
            {title}
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${isInbox ? 'bg-brand/10 text-brand' : 'bg-surface-raised text-content-strong'}`}>
          {count}
        </span>
      </div>

      {subtitle && (
        <p className="text-[11px] text-content-muted leading-tight">
          {subtitle}
        </p>
      )}

      {isDropTarget && dropText && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-brand bg-brand/10 text-brand text-xs font-bold animate-pulse">
          <ArrowDown className="size-4" />
          {dropText}
        </div>
      )}

      {tickets.length === 0 && !isDropTarget ? (
        <div className="p-5 text-center border-2 border-dashed border-line-subtle rounded-xl my-auto">
          <p className="text-xs text-content-muted">{emptyText}</p>
          {emptyHint && (
            <p className="text-[10px] text-brand font-medium mt-1">{emptyHint}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tickets.map((ticket: any) => (
            <DepartmentTicketCard
              key={ticket.id}
              ticket={ticket}
              locale={locale}
              isDraggable={canDrag}
              isDragging={draggedTicketId === ticket.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
