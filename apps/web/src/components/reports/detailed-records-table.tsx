'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Eye, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface RecordTableItem {
  id: string;
  referenceNumber: string;
  titleOrSubject: string;
  status: string;
  severityOrPriority: string;
  customerOrRequester: string;
  ownerName: string;
  departmentName: string;
  createdAt: string;
  resolvedAt: string | null;
  isOverdue: boolean;
  linkHref: string;
}

interface DetailedRecordsTableProps {
  locale: Locale;
  records: RecordTableItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onQuickInspect: (record: RecordTableItem) => void;
  isLoading?: boolean;
}

export function DetailedRecordsTable({
  locale,
  records,
  total,
  page,
  pageSize,
  onPageChange,
  onQuickInspect,
  isLoading,
}: DetailedRecordsTableProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const totalPages = Math.ceil(total / pageSize) || 1;

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <Card className="p-4 shadow-sm w-full min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{t.recordsTable.title}</h3>
          <p className="text-xs text-muted-foreground">{t.recordsTable.subtitle}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {t.recordsTable.showingRecords} <span className="font-semibold text-foreground">{records.length}</span> / {total}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/50 border-b text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.refNumber}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.subject}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.status}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.severity}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.owner}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.department}</th>
              <th className="py-2.5 px-3 text-start font-medium">{t.recordsTable.createdAt}</th>
              <th className="py-2.5 px-3 text-center font-medium">SLA</th>
              <th className="py-2.5 px-3 text-center font-medium">{t.recordsTable.quickInspect}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  {t.recordsTable.empty}
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const createdDate = new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                    {/* Ref Number with link */}
                    <td className="py-2.5 px-3 font-mono font-medium text-primary">
                      <Link href={r.linkHref} className="hover:underline flex items-center gap-1">
                        <span>{r.referenceNumber}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                    </td>

                    {/* Subject / Title */}
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-foreground font-medium" title={r.titleOrSubject}>
                      {r.titleOrSubject}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-3xs px-1.5 py-0 font-normal">
                        {r.status}
                      </Badge>
                    </td>

                    {/* Severity / Priority */}
                    <td className="py-2.5 px-3">
                      <span className="text-muted-foreground">{r.severityOrPriority}</span>
                    </td>

                    {/* Owner */}
                    <td className="py-2.5 px-3 text-muted-foreground">{r.ownerName}</td>

                    {/* Department */}
                    <td className="py-2.5 px-3 text-muted-foreground">{r.departmentName}</td>

                    {/* Created Date */}
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{createdDate}</td>

                    {/* SLA Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {r.isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-3xs font-semibold text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          <span>{t.recordsTable.overdueBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-3xs font-medium text-foreground">
                          <CheckCircle className="h-3 w-3" />
                          <span>{t.recordsTable.withinSlaBadge}</span>
                        </span>
                      )}
                    </td>

                    {/* Quick Inspect Button */}
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuickInspect(r)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title={t.recordsTable.quickInspect}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-3 mt-3 text-xs">
          <div className="text-muted-foreground">
            {locale === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <PrevIcon className="h-3.5 w-3.5" />
              <span>{locale === 'ar' ? 'السابق' : 'Previous'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <span>{locale === 'ar' ? 'التالي' : 'Next'}</span>
              <NextIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
