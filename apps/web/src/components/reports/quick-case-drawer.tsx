'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, X, Clock, User, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { RecordTableItem } from './detailed-records-table';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface QuickCaseDrawerProps {
  locale: Locale;
  record: RecordTableItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCaseDrawer({
  locale,
  record,
  isOpen,
  onClose,
}: QuickCaseDrawerProps) {
  if (!record) return null;
  const t = reportsAnalyticsI18n[locale];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-6 space-y-6 overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-primary">
              {record.referenceNumber}
            </span>
            {record.isOverdue ? (
              <Badge variant="destructive" className="gap-1 text-3xs">
                <AlertCircle className="h-3 w-3" />
                <span>{t.recordsTable.overdueBadge}</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-3xs text-foreground bg-muted">
                <CheckCircle className="h-3 w-3" />
                <span>{t.recordsTable.withinSlaBadge}</span>
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base font-bold text-foreground mt-2">
            {record.titleOrSubject}
          </SheetTitle>
        </SheetHeader>

        {/* Case Attributes */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <span className="text-muted-foreground block mb-0.5">{t.recordsTable.status}</span>
              <span className="font-semibold text-foreground">{record.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{t.recordsTable.severity}</span>
              <span className="font-semibold text-foreground">{record.severityOrPriority}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t.recordsTable.owner}:</span>
              <span className="font-medium ms-auto">{record.ownerName}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t.recordsTable.department}:</span>
              <span className="font-medium ms-auto">{record.departmentName}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t.recordsTable.customer}:</span>
              <span className="font-medium ms-auto">{record.customerOrRequester}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border p-3 space-y-2 bg-background">
            <div className="font-semibold text-foreground flex items-center gap-1.5 border-b pb-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t.drawer.timeline}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t.recordsTable.createdAt}:</span>
              <span className="font-mono text-foreground">{new Date(record.createdAt).toLocaleString()}</span>
            </div>
            {record.resolvedAt && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t.recordsTable.resolvedAt}:</span>
                <span className="font-mono text-primary font-medium">
                  {new Date(record.resolvedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t">
          <Link href={record.linkHref} className="w-full">
            <Button type="button" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>{t.drawer.openFullPage}</span>
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
