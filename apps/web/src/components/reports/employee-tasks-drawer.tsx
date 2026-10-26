'use client';

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import type { Locale } from '../../i18n/staff-shell';
import type { TicketRecordRow, ComplaintRecordRow } from '../../lib/staff-reports-analytics-api';

interface EmployeeTasksDrawerProps {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  employeeName: string | null;
  allTickets: TicketRecordRow[];
  allComplaints: ComplaintRecordRow[];
  onInspectTask: (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => void;
}

export function EmployeeTasksDrawer({
  locale,
  isOpen,
  onClose,
  employeeId,
  employeeName,
  allTickets,
  allComplaints,
  onInspectTask,
}: EmployeeTasksDrawerProps) {
  const isRtl = locale === 'ar';

  const employeeTickets = useMemo(() => {
    if (!employeeName) return [];
    return allTickets.filter(
      (tk) => tk.assignedEmployeeName === employeeName,
    );
  }, [allTickets, employeeName]);

  const employeeComplaints = useMemo(() => {
    if (!employeeName) return [];
    return allComplaints.filter((c) => c.ownerName === employeeName);
  }, [allComplaints, employeeName]);

  const totalAssigned = employeeTickets.length + employeeComplaints.length;
  const overdueCount =
    employeeTickets.filter((t) => t.isOverdue).length +
    employeeComplaints.filter((c) => c.isOverdue).length;

  if (!isOpen || !employeeName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="h-full w-full max-w-xl border-s bg-card p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">{employeeName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl ? 'المهام والقضايا المسندة للموظف' : 'Operational tasks assigned to this employee'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Vital Stats Bar */}
        <div className="grid grid-cols-3 gap-2.5 py-3 border-b text-center text-xs">
          <div className="p-2.5 rounded-xl bg-muted/40 border">
            <span className="text-3xs text-muted-foreground block font-bold uppercase">
              {isRtl ? 'إجمالي المهام' : 'Total Assigned'}
            </span>
            <span className="text-sm font-extrabold text-foreground tabular-nums">{totalAssigned}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border">
            <span className="text-3xs text-muted-foreground block font-bold uppercase">
              {isRtl ? 'تذاكر داخلية' : 'Internal Tickets'}
            </span>
            <span className="text-sm font-extrabold text-primary tabular-nums">{employeeTickets.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border">
            <span className="text-3xs text-muted-foreground block font-bold uppercase">
              {isRtl ? 'متأخرة' : 'Overdue'}
            </span>
            <span className={`text-sm font-extrabold tabular-nums ${overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {overdueCount}
            </span>
          </div>
        </div>

        {/* Task List Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {totalAssigned === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {isRtl ? 'لا توجد مهام مسندة لهذا الموظف حالياً.' : 'No active tasks assigned to this officer.'}
            </div>
          ) : (
            <>
              {/* Tickets Section */}
              {employeeTickets.map((tk) => (
                <Card
                  key={tk.id}
                  onClick={() => onInspectTask({ id: tk.id, refNumber: tk.referenceNumber, title: tk.title, type: 'ticket' })}
                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/40 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-3xs font-bold px-1.5 py-0 uppercase">TCK</Badge>
                      <span className="font-mono text-xs font-bold text-primary">{tk.referenceNumber}</span>
                    </div>
                    <Badge variant="outline" className="text-3xs font-semibold uppercase">
                      {tk.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-xs font-semibold text-foreground line-clamp-1">{tk.title}</p>

                  <div className="flex items-center justify-between text-3xs text-muted-foreground pt-1 border-t">
                    <span>{isRtl ? 'من:' : 'From:'} {tk.requestedByName}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {tk.dueAt ? tk.dueAt.split('T')[0] : tk.createdAt.split('T')[0]}
                    </span>
                  </div>
                </Card>
              ))}

              {/* Complaints Section */}
              {employeeComplaints.map((c) => (
                <Card
                  key={c.id}
                  onClick={() => onInspectTask({ id: c.id, refNumber: c.referenceNumber, title: c.subject, type: 'complaint' })}
                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/40 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-3xs font-bold px-1.5 py-0 uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">CMP</Badge>
                      <span className="font-mono text-xs font-bold text-primary">{c.referenceNumber}</span>
                    </div>
                    <Badge variant="outline" className="text-3xs font-semibold uppercase">
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-xs font-semibold text-foreground line-clamp-1">{c.subject}</p>

                  <div className="flex items-center justify-between text-3xs text-muted-foreground pt-1 border-t">
                    <span>{isRtl ? 'العميل:' : 'Customer:'} {c.customerName}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {c.createdAt.split('T')[0]}
                    </span>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            {isRtl ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
