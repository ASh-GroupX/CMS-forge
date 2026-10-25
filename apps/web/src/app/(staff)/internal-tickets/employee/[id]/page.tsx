import React from 'react';
import { headers } from 'next/headers';
import { ArrowRight, ArrowLeft, Briefcase, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { getEmployeeTickets } from '../../../../../lib/staff-internal-tickets-actions';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { internalTicketStatusLabel } from '../../../../../i18n/domain-labels';
import Link from 'next/link';

export default async function EmployeeTicketsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ locale?: string }> }) {
  const { id: employeeId } = await params;
  const sParams = await searchParams;
  const requestHeaders = await headers();
  const locale = resolveLocale(sParams?.locale || (requestHeaders.get('x-cms-locale') ?? undefined));
  const isAr = locale === 'ar';

  const tickets = (await getEmployeeTickets(employeeId)) || [];

  // Group tickets
  const activeTickets = tickets.filter((t: any) => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const pendingTickets = tickets.filter((t: any) => t.status === 'WAITING' || t.status === 'PENDING_APPROVAL');
  const doneTickets = tickets.filter((t: any) => ['CLOSED', 'RESOLVED'].includes(t.status));
  const rejectedTickets = tickets.filter((t: any) => t.status === 'REJECTED');

  const Column = ({ title, icon, tickets, colorClass }: { title: string; icon: any; tickets: any[]; colorClass: string }) => (
    <div className="flex flex-col gap-4 bg-surface-canvas p-4 rounded-3xl border border-line-subtle min-w-[300px] max-w-sm">
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-line-subtle">
        <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
          {icon}
        </div>
        <h3 className="font-bold text-content-strong text-lg flex-1">{title}</h3>
        <span className="bg-surface-raised px-2.5 py-0.5 rounded-full text-sm font-bold text-content-muted">
          {tickets.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {tickets.length === 0 ? (
          <div className="text-center p-8 text-content-muted border border-dashed border-line-subtle rounded-2xl">
            <p className="text-sm font-medium">{isAr ? 'لا توجد تذاكر' : 'No tickets'}</p>
          </div>
        ) : (
          tickets.map((t: any) => {
            const reqName = isAr && t.requestedBy?.nameAr ? t.requestedBy.nameAr : (t.requestedBy?.nameEn || t.requestedById || (isAr ? 'غير محدد' : 'Unknown'));
            return (
              <Link key={t.id} href={`/internal-tickets/${t.id}?locale=${locale}`} className="group relative flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass.replace('text-', 'bg-').replace('500', '100')} ${colorClass}`}>
                    {internalTicketStatusLabel(locale, t.status || 'ASSIGNED')}
                  </span>
                  <span className="text-xs text-content-muted font-mono">{t.id}</span>
                </div>
                <div>
                  <h4 className="font-bold text-content-strong truncate group-hover:text-brand transition-colors text-sm">{t.title}</h4>
                  <p className="mt-1 text-xs text-content-muted line-clamp-2">{t.description || (isAr ? 'لا يوجد وصف.' : 'No description provided.')}</p>
                </div>
                <div className="flex items-center justify-between mt-1 pt-3 border-t border-line-subtle">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                      {String(reqName).charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-content-strong truncate max-w-[120px]">
                      {reqName}
                    </span>
                  </div>
                  <div className="grid size-6 place-items-center rounded-full bg-surface-raised text-content-muted group-hover:bg-brand group-hover:text-white transition-colors">
                    <ArrowRight className={`size-3 ${isAr ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-full bg-surface-canvas p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard?locale=${locale}`} className="grid place-items-center size-10 rounded-full bg-surface hover:bg-surface-raised transition-colors text-content-muted hover:text-content-strong shadow-sm border border-line-subtle">
          <ArrowLeft className={`size-5 ${isAr ? 'rotate-180' : ''}`} />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-content-strong flex items-center gap-3">
            <Briefcase className="size-7 text-brand" />
            {isAr ? 'لوحة تذاكر الموظف' : 'Employee Ticket Board'}
          </h2>
          <p className="text-sm text-content-muted mt-1 font-medium">
            {isAr ? 'عرض مسار العمل والمهام المسندة لهذا الموظف.' : 'Viewing full workload pipeline for this employee.'}
          </p>
        </div>
      </div>

      <div className="w-full min-w-0 max-w-full rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-w-0 max-w-full pb-4">
          <div className="flex gap-6 min-w-max">
            <Column title={isAr ? 'نشطة' : 'Active'} icon={<PlayCircle className="size-5 text-blue-500" />} tickets={activeTickets} colorClass="text-blue-500 bg-blue-100" />
            <Column title={isAr ? 'معلقة / قيد الانتظار' : 'Pending / Waiting'} icon={<Clock className="size-5 text-yellow-500" />} tickets={pendingTickets} colorClass="text-yellow-500 bg-yellow-100" />
            <Column title={isAr ? 'مكتملة' : 'Completed'} icon={<CheckCircle2 className="size-5 text-emerald-500" />} tickets={doneTickets} colorClass="text-emerald-500 bg-emerald-100" />
            <Column title={isAr ? 'مرفوضة' : 'Rejected'} icon={<AlertCircle className="size-5 text-red-500" />} tickets={rejectedTickets} colorClass="text-red-500 bg-red-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
