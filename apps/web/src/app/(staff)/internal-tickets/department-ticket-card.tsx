'use client';

import React from 'react';
import Link from 'next/link';
import { GripVertical, Clock, AlertCircle } from 'lucide-react';
import { internalTicketStatusLabel } from '../../../i18n/domain-labels';
import type { Locale } from '../../../i18n/staff-shell';

interface DepartmentTicketCardProps {
  ticket: any;
  locale: Locale;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, ticket: any) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function DepartmentTicketCard({
  ticket,
  locale,
  isDraggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: DepartmentTicketCardProps) {
  const isAr = locale === 'ar';
  const reqName = isAr && ticket.requestedBy?.nameAr
    ? ticket.requestedBy.nameAr
    : ticket.requestedBy?.nameEn || (isAr ? 'غير معروف' : 'Unknown');

  const isUrgent = ticket.priority === 'URGENT' || ticket.priority === 'HIGH';

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, ticket)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border border-line-subtle bg-surface p-3.5 shadow-sm transition-all select-none ${
        isDragging
          ? 'opacity-40 scale-95 border-brand ring-2 ring-brand/30'
          : isDraggable
          ? 'hover:border-brand/40 hover:shadow-md cursor-grab active:cursor-grabbing'
          : 'hover:border-line-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDraggable && (
            <div
              className="text-content-muted group-hover:text-brand transition-colors shrink-0"
              title={isAr ? 'اسحب لإسناد المهمة' : 'Drag to assign task'}
            >
              <GripVertical className="size-4" />
            </div>
          )}
          <Link
            href={`/internal-tickets/${ticket.id}?locale=${locale}`}
            className="text-xs font-bold text-content-strong hover:text-brand transition-colors truncate"
            title={ticket.title}
            draggable={false}
          >
            {ticket.title}
          </Link>
        </div>

        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-raised text-content-muted">
          {internalTicketStatusLabel(locale, ticket.status)}
        </span>
      </div>

      {ticket.description && (
        <p className="text-[11px] text-content-muted line-clamp-2 mt-1.5 leading-snug">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-line-subtle text-[10px] text-content-subtle">
        <span className="truncate">
          <span className="font-semibold text-content-muted">{isAr ? 'من:' : 'From:'}</span> {reqName}
        </span>

        {isUrgent && (
          <span className="flex items-center gap-0.5 text-status-error font-bold shrink-0">
            <AlertCircle className="size-3" />
            {ticket.priority}
          </span>
        )}

        {ticket.dueAt && !isUrgent && (
          <span className="flex items-center gap-0.5 text-content-muted shrink-0">
            <Clock className="size-3" />
            {new Date(ticket.dueAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
