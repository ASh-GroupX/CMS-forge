'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { TicketRecordRow } from '../../lib/staff-reports-analytics-api';

interface DepartmentTaskTableProps {
  tasks: TicketRecordRow[];
  emptyText: string;
  isOutbound?: boolean;
  onInspect: (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => void;
  whoSentLabel: string;
  targetDeptLabel: string;
  assignedToLabel: string;
}

export function DepartmentTaskTable({
  tasks,
  emptyText,
  isOutbound = false,
  onInspect,
  whoSentLabel,
  targetDeptLabel,
  assignedToLabel,
}: DepartmentTaskTableProps) {
  return (
    <div className="relative w-full min-w-0 max-w-full overflow-x-auto rounded-xl border">
      <table className="w-full text-start text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 font-semibold text-muted-foreground">
            <th className="py-2.5 px-3 text-start">Ref #</th>
            <th className="py-2.5 px-3 text-start">Title</th>
            <th className="py-2.5 px-3 text-start">{whoSentLabel}</th>
            <th className="py-2.5 px-3 text-start">{isOutbound ? targetDeptLabel : assignedToLabel}</th>
            <th className="py-2.5 px-3 text-center">Status</th>
            <th className="py-2.5 px-3 text-end"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            tasks.map((tk) => (
              <tr
                key={tk.id}
                className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => onInspect({ id: tk.id, refNumber: tk.referenceNumber, title: tk.title, type: 'ticket' })}
              >
                <td className="py-2.5 px-3 font-mono text-xs font-bold text-primary">{tk.referenceNumber}</td>
                <td className="py-2.5 px-3 max-w-[220px] truncate font-medium text-foreground">{tk.title}</td>
                <td className="py-2.5 px-3 text-foreground font-semibold">
                  {tk.requestedByName} {isOutbound ? '' : `(${tk.creatingDepartmentName})`}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {isOutbound ? tk.targetDepartmentName : (tk.assignedEmployeeName || '—')}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <Badge variant="outline" className="text-3xs uppercase px-1.5 py-0 font-semibold">
                    {tk.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-end">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Inspect ${tk.referenceNumber}`}>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
