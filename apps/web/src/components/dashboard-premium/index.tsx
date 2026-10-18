'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Car,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  LayoutDashboard,
  PieChart,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffSessionPrincipal } from '../../lib/staff-session-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ── Premium Dashboard Component ───────────────────────────────────────────

export function PremiumDashboard({ locale, principal, data, workloadData, options }: { locale: Locale; principal: StaffSessionPrincipal | null; data?: any; workloadData?: any[]; options?: any }) {
  const isRtl = locale === 'ar';
  const role = principal?.roleCode || 'STAFF';
  const isAdmin = role === 'ADMIN';
  const isManager = ['BRANCH_MANAGER', 'DEPARTMENT_MANGER', 'CR_MANAGER'].includes(role);
  const isOfficer = !isAdmin && !isManager;
  const [activeTab, setActiveTab] = useState<'crm' | 'internal'>('crm');

  const title = isRtl ? 'لوحة القيادة الذكية' : 'Smart Dashboard';
  const subtitle = isRtl ? 'رؤى فورية ومقاييس أداء' : 'Real-time insights and performance metrics';

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content-strong flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <LayoutDashboard className="size-6" />
            </div>
            {title}
          </h1>
          <p className="mt-2 text-content-muted">{subtitle}</p>
        </div>

        {/* Global Filter/Search Simulation */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-content-muted" />
            <Input className="w-64 ps-9 bg-surface/50 border-line-subtle shadow-sm rounded-xl focus-visible:ring-brand" placeholder={isRtl ? 'بحث...' : 'Search insights...'} />
          </div>
          <Button type="button" variant="outline" className="rounded-xl border-line-subtle shadow-sm bg-surface/50 gap-2">
            <Filter className="size-4 text-brand" />
            {isRtl ? 'تصفية' : 'Filters'}
          </Button>
        </div>
      </header>

      {/* ── Mode Switcher (CRM vs Internal) ── */}
      <div className="mb-6 flex items-center gap-2 border-b border-line-subtle pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'crm'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-surface hover:bg-surface-raised text-content-muted border border-line-subtle'
          }`}
        >
          <Sparkles className="size-4" />
          {isRtl ? 'لوحة شكاوى وتجربة العملاء (CRM)' : 'CRM & Customer Complaints'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('internal')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'internal'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-surface hover:bg-surface-raised text-content-muted border border-line-subtle'
          }`}
        >
          <Briefcase className="size-4" />
          {isRtl ? 'العمليات والمهام الداخلية' : 'Internal Operations'}
        </button>
      </div>

      {/* ── Content View ── */}
      <div className="flex flex-col gap-6 pb-24">
        {activeTab === 'crm' ? (
          <CrmDashboardView isRtl={isRtl} crmData={data?.crm} locale={locale} />
        ) : (
          <>
            {isAdmin && <AdminView isRtl={isRtl} data={data?.admin} />}
            {isManager && <ManagerView isRtl={isRtl} data={data?.manager} workloadData={workloadData || []} options={options} principal={principal} />}
            {isOfficer && <OfficerView isRtl={isRtl} data={data?.officer} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── Role Components ───────────────────────────────────────────────────────

function AdminView({ isRtl, data }: { isRtl: boolean, data?: any }) {
  const adminData = data || {
    totalEmployees: 0,
    totalActiveTickets: 0,
    totalResolvedToday: 0,
    avgSystemRating: 5.0,
    systemTracking: [],
    trends: undefined,
  };

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = new Date();

  const emptyTracking = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayOfWeek = d.getDay();
    return {
      name: dayNamesEn[dayOfWeek],
      nameAr: dayNamesAr[dayOfWeek],
      active: 0,
      resolved: 0,
      avgTime: 0,
    };
  });

  const trackingData = Array.isArray(adminData.systemTracking) && adminData.systemTracking.length > 0
    ? adminData.systemTracking
    : emptyTracking;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={isRtl ? 'إجمالي الموظفين' : 'Total Employees'} value={adminData.totalEmployees ?? 0} icon={<Users />} trend={adminData.trends?.employees ? `${adminData.totalEmployees}` : undefined} isPositive={adminData.trends?.employeesPositive ?? true} />
        <StatCard title={isRtl ? 'التذاكر النشطة' : 'Active Tickets'} value={adminData.totalActiveTickets ?? 0} icon={<Activity />} trend={adminData.trends?.activeTickets} isPositive={adminData.trends?.activeTicketsPositive ?? true} />
        <StatCard title={isRtl ? 'تم الحل اليوم' : 'Resolved Today'} value={adminData.totalResolvedToday ?? 0} icon={<CheckCircle2 />} trend={adminData.trends?.resolvedToday} isPositive={adminData.trends?.resolvedTodayPositive ?? true} />
        <StatCard title={isRtl ? 'متوسط التقييم' : 'Avg Rating'} value={`${adminData.avgSystemRating ?? 5.0}/5.0`} icon={<Star className="text-yellow-500" />} trend={adminData.trends?.rating} isPositive={adminData.trends?.ratingPositive ?? true} />
      </div>

      <Card className="rounded-2xl border-line-subtle shadow-lg bg-surface/40 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-line-subtle bg-surface/30">
          <CardTitle className="text-lg font-bold">{isRtl ? 'نظرة عامة على النظام' : 'System Overview'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trackingData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line-subtle)" />
                <XAxis dataKey={isRtl ? 'nameAr' : 'name'} axisLine={false} tickLine={false} tick={{ fill: 'var(--content-muted)', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--content-muted)', fontSize: 12 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--content-muted)', fontSize: 12 }} dx={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-canvas)', borderColor: 'var(--line-subtle)', borderRadius: '12px', color: 'var(--content-strong)' }}
                  itemStyle={{ color: 'var(--content-strong)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="active" name={isRtl ? 'التذاكر النشطة' : 'Active Tickets'} stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                <Bar yAxisId="left" dataKey="resolved" name={isRtl ? 'تم الحل' : 'Resolved'} fill="url(#colorResolved)" radius={[4, 4, 0, 0]} barSize={40} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ManagerView({ isRtl, data, workloadData, options, principal }: { isRtl: boolean, data?: any, workloadData?: any[], options?: any, principal?: any }) {
  const managerData = data || {
    receivedTickets: 0,
    sentTickets: 0,
    avgCompletion: "0d",
    performanceKpi: "100%"
  };

  const managerDepartmentId = principal?.departmentId;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sortKey, setSortKey] = useState<'done' | 'active' | 'rating' | 'onTimeRate'>('done');
  const filterType = searchParams.get('filterType') || 'all';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const severity = searchParams.get('severity') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const applyDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_year' | 'clear') => {
    const params = new URLSearchParams(searchParams.toString());
    const today = new Date();
    
    if (preset === 'clear') {
      params.delete('dateFrom');
      params.delete('dateTo');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    let from = new Date();
    let to = new Date();

    if (preset === 'today') {
      // already today
    } else if (preset === 'this_week') {
      from.setDate(today.getDate() - today.getDay());
    } else if (preset === 'this_month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'last_30_days') {
      from.setDate(today.getDate() - 30);
    } else if (preset === 'this_year') {
      from = new Date(today.getFullYear(), 0, 1);
    }

    params.set('dateFrom', from.toISOString().split('T')[0] as string);
    params.set('dateTo', to.toISOString().split('T')[0] as string);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // If there's real data from the API (from /team-workload), use it.
  const sourceData = Array.isArray(workloadData) && workloadData.length ? workloadData : (managerData.teamPerformance || []);

  const teamList = [...sourceData].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 bg-surface p-4 rounded-2xl border border-line-subtle shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-content-strong px-2">{isRtl ? 'تحليل التذاكر:' : 'Ticket Analysis:'}</span>
            <Select value={filterType} onValueChange={(val) => updateFilter('filterType', val)}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? 'جميع التذاكر' : 'All Tickets'}</SelectItem>
                <SelectItem value="internal">{isRtl ? 'داخلية فقط' : 'Internal Only'}</SelectItem>
                <SelectItem value="external">{isRtl ? 'مستمدة من شكاوى' : 'From Complaints'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={() => {
            const headers = ['Department', 'Employee ID', 'Employee Name', 'Role', 'Active Tasks', 'Completed Tasks', 'On-Time Rate %', 'Rating'];
            
            const byDepartment = teamList.reduce((acc, emp) => {
              const dept = emp.department || 'Unassigned';
              if (!acc[dept]) acc[dept] = [];
              acc[dept].push(emp);
              return acc;
            }, {} as Record<string, any[]>);

            const csvLines = [headers.join(',')];
            
            Object.keys(byDepartment).sort().forEach(dept => {
              byDepartment[dept].forEach((emp: any) => {
                csvLines.push(`"${dept}","${emp.id}","${emp.name}","${emp.role}",${emp.active},${emp.done},${emp.onTimeRate},${emp.rating}`);
              });
            });
            
            const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `team_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }} variant="outline" className="gap-2 rounded-xl">
            <ArrowDownRight className="size-4 text-brand" />
            {isRtl ? 'تحميل CSV' : 'Download CSV'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-content-muted">{isRtl ? 'من تاريخ' : 'Date From'}</label>
            <input type="date" value={dateFrom} onChange={e => updateFilter('dateFrom', e.target.value)} className="flex h-10 w-full rounded-xl border border-line-subtle bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand" />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-content-muted">{isRtl ? 'إلى تاريخ' : 'Date To'}</label>
            <input type="date" value={dateTo} onChange={e => updateFilter('dateTo', e.target.value)} className="flex h-10 w-full rounded-xl border border-line-subtle bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand" />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-content-muted">{isRtl ? 'الفئة' : 'Category'}</label>
            <Select value={categoryId || 'all'} onValueChange={val => updateFilter('categoryId', val)}>
              <SelectTrigger className="w-full rounded-xl h-10"><SelectValue placeholder={isRtl ? 'جميع الفئات' : 'All Categories'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                {options?.categories?.filter((cat: any) => !managerDepartmentId || cat.departmentId === managerDepartmentId).map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{isRtl ? cat.nameAr : cat.nameEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-content-muted">{isRtl ? 'الأهمية' : 'Severity'}</label>
            <Select value={severity || 'all'} onValueChange={val => updateFilter('severity', val)}>
              <SelectTrigger className="w-full rounded-xl h-10"><SelectValue placeholder={isRtl ? 'جميع مستويات الأهمية' : 'All Severities'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? 'الكل' : 'All Severities'}</SelectItem>
                {options?.severities?.map((sev: string) => (
                  <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-line-subtle">
          <span className="text-xs font-semibold text-content-muted me-2">{isRtl ? 'فلاتر سريعة:' : 'Quick Filters:'}</span>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs rounded-full bg-surface-canvas" onClick={() => applyDatePreset('today')}>{isRtl ? 'اليوم' : 'Today'}</Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs rounded-full bg-surface-canvas" onClick={() => applyDatePreset('this_week')}>{isRtl ? 'هذا الأسبوع' : 'This Week'}</Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs rounded-full bg-surface-canvas" onClick={() => applyDatePreset('this_month')}>{isRtl ? 'هذا الشهر' : 'This Month'}</Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs rounded-full bg-surface-canvas" onClick={() => applyDatePreset('last_30_days')}>{isRtl ? 'آخر 30 يوم' : 'Last 30 Days'}</Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs rounded-full bg-surface-canvas" onClick={() => applyDatePreset('this_year')}>{isRtl ? 'هذه السنة' : 'This Year'}</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs rounded-full text-brand hover:bg-brand/10" onClick={() => applyDatePreset('clear')}>{isRtl ? 'إلغاء الفلتر' : 'Clear Dates'}</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={isRtl ? 'تذاكر واردة' : 'Received Tickets'} value={managerData.receivedTickets} icon={<ArrowDownRight className="text-brand" />} />
        <StatCard title={isRtl ? 'تذاكر صادرة' : 'Sent Tickets'} value={managerData.sentTickets} icon={<ArrowUpRight className="text-purple-500" />} />
        <StatCard title={isRtl ? 'متوسط الإنجاز' : 'Avg Completion'} value={managerData.avgCompletion} icon={<Clock />} />
        <StatCard title={isRtl ? 'مؤشر الأداء' : 'Performance KPI'} value={managerData.performanceKpi} icon={<Zap className="text-yellow-500" />} />
      </div>

      <Card className="rounded-2xl border-line-subtle shadow-lg bg-surface/40 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-line-subtle bg-surface/30 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">{isRtl ? 'أداء الموظفين وتقييمهم' : 'Employee Performance & Ratings'}</CardTitle>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={sortKey === 'done' ? 'default' : 'outline'} onClick={() => setSortKey('done')}>
              {isRtl ? 'مكتمل' : 'Completed'}
            </Button>
            <Button type="button" size="sm" variant={sortKey === 'active' ? 'default' : 'outline'} onClick={() => setSortKey('active')}>
              {isRtl ? 'نشط' : 'Active'}
            </Button>
            <Button type="button" size="sm" variant={sortKey === 'rating' ? 'default' : 'outline'} onClick={() => setSortKey('rating')}>
              {isRtl ? 'تقييم' : 'Rating'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-line-subtle">
            {teamList.map((emp: any) => (
              <Link key={emp.id} href={`/internal-tickets/employee/${emp.id}`} className="flex items-center justify-between p-4 hover:bg-surface-raised transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-gradient-to-br from-brand/20 to-purple-500/20 text-brand flex items-center justify-center font-bold shadow-inner shrink-0">
                    {String(isRtl ? (emp.nameAr || emp.name) : emp.name).charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-brand transition-colors">{isRtl ? (emp.nameAr || emp.name) : emp.name}</p>
                    <p className="text-xs text-content-muted">{emp.role} • {emp.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-content-muted mb-1">{isRtl ? 'نشط' : 'Active'}</p>
                    <p className="font-bold tabular-nums text-sm">{emp.active}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-content-muted mb-1">{isRtl ? 'مكتمل' : 'Completed'}</p>
                    <p className="font-bold tabular-nums text-sm text-status-success">{emp.done}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-content-muted mb-1">{isRtl ? 'معدل الوقت' : 'On-Time'}</p>
                    <p className="font-bold tabular-nums text-sm">{emp.onTimeRate}%</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full shrink-0">
                    <Star className="size-3.5 fill-current" />
                    <span className="font-bold text-sm">{emp.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function OfficerView({ isRtl, data }: { isRtl: boolean, data?: any }) {
  const officerData = data || {
    activeTasks: 0,
    sentTasks: 0,
    receivedTasks: 0,
    onTime: 0,
    overdue: 0,
    pending: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Workload Stats */}
        <Link href="/internal-tickets/my-work?status=active" className="block transition-transform hover:-translate-y-1">
          <Card className="rounded-2xl border-line-subtle shadow-xl bg-gradient-to-br from-brand/5 to-purple-500/5 overflow-hidden group h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-muted mb-2">{isRtl ? 'مهامي النشطة' : 'My Active Tasks'}</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand to-purple-600">
                    {officerData.activeTasks}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="size-6 text-brand" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/internal-tickets/my-work?filter=sent" className="block transition-transform hover:-translate-y-1">
          <Card className="rounded-2xl border-line-subtle shadow-xl bg-surface/50 overflow-hidden group h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-muted mb-2">{isRtl ? 'مهام مرسلة' : 'Sent Tasks'}</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter text-content-strong">
                    {officerData.sentTasks}
                  </p>
                </div>
                <div className="p-3 bg-brand/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpRight className="size-6 text-brand" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/internal-tickets/my-work?filter=received" className="block transition-transform hover:-translate-y-1">
          <Card className="rounded-2xl border-line-subtle shadow-xl bg-surface/50 overflow-hidden group h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-muted mb-2">{isRtl ? 'مهام مستلمة' : 'Received Tasks'}</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter text-content-strong">
                    {officerData.receivedTasks}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownRight className="size-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-line-subtle shadow-lg bg-surface/40 h-full">
            <CardHeader className="border-b border-line-subtle">
              <CardTitle className="text-lg font-bold">{isRtl ? 'تحليل الأداء الفردي' : 'Personal Performance Insights'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-3 gap-4">
              <Link href="/internal-tickets/my-work?status=on-time" className="flex flex-col items-center justify-center p-6 bg-status-success/10 rounded-2xl border border-status-success/20 hover:bg-status-success/20 transition-colors">
                <CheckCircle2 className="size-8 text-status-success mb-3" />
                <p className="text-3xl font-black text-content-strong">{officerData.onTime}</p>
                <p className="text-sm font-semibold text-content-muted mt-1">{isRtl ? 'في الوقت' : 'On-Time'}</p>
              </Link>
              <Link href="/internal-tickets/my-work?status=overdue" className="flex flex-col items-center justify-center p-6 bg-status-error/10 rounded-2xl border border-status-error/20 hover:bg-status-error/20 transition-colors">
                <Clock className="size-8 text-status-error mb-3" />
                <p className="text-3xl font-black text-content-strong">{officerData.overdue}</p>
                <p className="text-sm font-semibold text-content-muted mt-1">{isRtl ? 'متأخر' : 'Overdue'}</p>
              </Link>
              <Link href="/internal-tickets/my-work?status=pending" className="flex flex-col items-center justify-center p-6 bg-status-warning/10 rounded-2xl border border-status-warning/20 hover:bg-status-warning/20 transition-colors">
                <Inbox className="size-8 text-status-warning mb-3" />
                <p className="text-3xl font-black text-content-strong">{officerData.pending}</p>
                <p className="text-sm font-semibold text-content-muted mt-1">{isRtl ? 'معلق' : 'Pending'}</p>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-line-subtle shadow-lg bg-surface/40 h-full">
            <CardHeader className="border-b border-line-subtle">
              <CardTitle className="text-lg font-bold">{isRtl ? 'المهام القادمة' : 'Up Next'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-line-subtle rounded-xl text-content-muted text-sm text-center px-4">
                {isRtl ? 'ستظهر هنا المهام ذات الأولوية العالية' : 'High priority incoming tasks will appear here'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── CRM Dashboard View ────────────────────────────────────────────────────

function CrmDashboardView({ isRtl, crmData, locale }: { isRtl: boolean; crmData?: any; locale: Locale }) {
  const crm = crmData || {
    total: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    escalated: 0,
    alternativeCarCount: 0,
    justifiedCount: 0,
    unjustifiedCount: 0,
    satisfaction: { satisfied: 0, neutral: 0, unsatisfied: 0 },
    rootCausesBreakdown: [],
    departmentWorkload: [],
    officerWorkload: [],
  };

  const totalResolved = (crm.resolved || 0) + (crm.closed || 0);
  const resolutionRate = crm.total > 0 ? Math.round((totalResolved / crm.total) * 100) : 0;
  
  const totalDecidedJustification = (crm.justifiedCount || 0) + (crm.unjustifiedCount || 0);
  const justifiedRate = totalDecidedJustification > 0
    ? Math.round((crm.justifiedCount / totalDecidedJustification) * 100)
    : 0;
  const unjustifiedRate = totalDecidedJustification > 0
    ? Math.round((crm.unjustifiedCount / totalDecidedJustification) * 100)
    : 0;

  const totalSatisfactionResponses =
    (crm.satisfaction?.satisfied || 0) +
    (crm.satisfaction?.neutral || 0) +
    (crm.satisfaction?.unsatisfied || 0);

  const satRate = totalSatisfactionResponses > 0
    ? Math.round(((crm.satisfaction?.satisfied || 0) / totalSatisfactionResponses) * 100)
    : 0;
  const neuRate = totalSatisfactionResponses > 0
    ? Math.round(((crm.satisfaction?.neutral || 0) / totalSatisfactionResponses) * 100)
    : 0;
  const unsatRate = totalSatisfactionResponses > 0
    ? Math.round(((crm.satisfaction?.unsatisfied || 0) / totalSatisfactionResponses) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href={`/complaints?locale=${locale}`} className="block transition-transform hover:scale-[1.02]">
          <StatCard
            title={isRtl ? 'إجمالي الشكاوى' : 'Total Complaints'}
            value={crm.total}
            icon={<Inbox className="size-5" />}
            trend={isRtl ? 'سجل الحالات' : 'All Cases'}
            isPositive={true}
          />
        </Link>
        <StatCard
          title={isRtl ? 'قيد المتابعة والتحقيق' : 'In Progress'}
          value={crm.inProgress}
          icon={<Clock className="size-5 text-amber-500" />}
          trend={`${crm.total > 0 ? Math.round((crm.inProgress / crm.total) * 100) : 0}%`}
          isPositive={false}
        />
        <StatCard
          title={isRtl ? 'تم الحل والإغلاق' : 'Resolved & Closed'}
          value={totalResolved}
          icon={<CheckCircle2 className="size-5 text-emerald-500" />}
          trend={`${resolutionRate}%`}
          isPositive={resolutionRate >= 70}
        />
        <StatCard
          title={isRtl ? 'شكاوى مصعدة' : 'Escalated / Reopened'}
          value={crm.escalated}
          icon={<AlertTriangle className="size-5 text-rose-500" />}
          trend={crm.escalated === 0 ? '0%' : `${crm.escalated}`}
          isPositive={crm.escalated === 0}
        />
        <StatCard
          title={isRtl ? 'سيارات بديلة ممنوحة' : 'Alternative Cars'}
          value={crm.alternativeCarCount}
          icon={<Car className="size-5 text-blue-500" />}
          trend="🚗 Active"
          isPositive={true}
        />
      </div>

      {/* ── Justification & Satisfaction Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Justification Card */}
        <Card className="rounded-2xl border-line-subtle shadow-md bg-surface overflow-hidden">
          <CardHeader className="border-b border-line-subtle bg-surface-canvas/50 pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-brand" />
                {isRtl ? 'مشروعية الشكاوى (مبررة أم غير مبررة)' : 'Complaint Justification Analysis'}
              </span>
              <span className="text-xs font-normal text-content-muted">
                {totalDecidedJustification} {isRtl ? 'حالة محددة' : 'Decided'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {totalDecidedJustification > 0 ? (
              <>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div style={{ width: `${justifiedRate}%` }} className="bg-emerald-500 transition-all" title={`Justified: ${justifiedRate}%`} />
                  <div style={{ width: `${unjustifiedRate}%` }} className="bg-rose-500 transition-all" title={`Unjustified: ${unjustifiedRate}%`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {isRtl ? '✅ شكاوى مبررة' : '✅ Justified'}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {justifiedRate}%
                      </span>
                    </div>
                    <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                      {crm.justifiedCount}
                    </p>
                  </div>

                  <div className="rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                        {isRtl ? '❌ غير مبررة' : '❌ Unjustified'}
                      </span>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                        {unjustifiedRate}%
                      </span>
                    </div>
                    <p className="text-2xl font-black text-rose-800 dark:text-rose-200">
                      {crm.unjustifiedCount}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-content-muted">
                {isRtl ? 'لا توجد شكاوى محددة بعد بمشروعية الحل.' : 'No complaints with justification status determined yet.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Status Card */}
        <Card className="rounded-2xl border-line-subtle shadow-md bg-surface overflow-hidden">
          <CardHeader className="border-b border-line-subtle bg-surface-canvas/50 pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smile className="size-5 text-brand" />
                {isRtl ? 'مؤشر رضا العملاء' : 'Customer Satisfaction Breakdown'}
              </span>
              <span className="text-xs font-normal text-content-muted">
                {totalSatisfactionResponses} {isRtl ? 'تقييم مسجل' : 'Responses'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {totalSatisfactionResponses > 0 ? (
              <>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div style={{ width: `${satRate}%` }} className="bg-emerald-500 transition-all" title={`Satisfied: ${satRate}%`} />
                  <div style={{ width: `${neuRate}%` }} className="bg-blue-500 transition-all" title={`Neutral: ${neuRate}%`} />
                  <div style={{ width: `${unsatRate}%` }} className="bg-rose-500 transition-all" title={`Unsatisfied: ${unsatRate}%`} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
                    <p className="text-xl font-bold mb-1">😊</p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {isRtl ? 'راضٍ' : 'Satisfied'}
                    </p>
                    <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                      {crm.satisfaction?.satisfied || 0}
                    </p>
                    <span className="text-[10px] text-content-muted">{satRate}%</span>
                  </div>

                  <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-center">
                    <p className="text-xl font-bold mb-1">😐</p>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {isRtl ? 'محايد' : 'Neutral'}
                    </p>
                    <p className="text-xl font-black text-blue-800 dark:text-blue-200 mt-1">
                      {crm.satisfaction?.neutral || 0}
                    </p>
                    <span className="text-[10px] text-content-muted">{neuRate}%</span>
                  </div>

                  <div className="rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-center">
                    <p className="text-xl font-bold mb-1">😞</p>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      {isRtl ? 'غير راضٍ' : 'Unsatisfied'}
                    </p>
                    <p className="text-xl font-black text-rose-800 dark:text-rose-200 mt-1">
                      {crm.satisfaction?.unsatisfied || 0}
                    </p>
                    <span className="text-[10px] text-content-muted">{unsatRate}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-content-muted">
                {isRtl ? 'لم تسجل بعد بيانات رضا العملاء عند الإغلاق.' : 'No customer satisfaction feedback recorded upon resolution yet.'}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Root Causes & Workloads Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Root Causes Distribution Card */}
        <Card className="rounded-2xl border-line-subtle shadow-md bg-surface overflow-hidden">
          <CardHeader className="border-b border-line-subtle bg-surface-canvas/50 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="size-5 text-brand" />
              {isRtl ? 'توزيع الأسباب الجذرية الأكثر تكراراً' : 'Top Root Cause Categories'}
            </CardTitle>
            <Link href={`/admin/complaint-settings?locale=${locale}`} className="text-xs font-semibold text-brand hover:underline">
              {isRtl ? 'إدارة القائمة' : 'Manage List'}
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            {crm.rootCausesBreakdown?.length > 0 ? (
              <div className="space-y-3">
                {crm.rootCausesBreakdown.map((item: any) => {
                  const maxCount = crm.rootCausesBreakdown[0]?.count || 1;
                  const percent = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-content-strong truncate max-w-[250px]">{item.category}</span>
                        <span className="text-brand tabular-nums">{item.count} {isRtl ? 'شكوى' : 'cases'}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                        <div style={{ width: `${percent}%` }} className="h-full bg-brand rounded-full transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-content-muted">
                {isRtl ? 'لا توجد بيانات للأسباب الجذرية بعد.' : 'No root cause categories recorded yet.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload by Department & Officer */}
        <Card className="rounded-2xl border-line-subtle shadow-md bg-surface overflow-hidden">
          <CardHeader className="border-b border-line-subtle bg-surface-canvas/50 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-5 text-brand" />
              {isRtl ? 'توزيع الشكاوى حسب الأقسام والموظفين' : 'Complaints Workload Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                {isRtl ? 'حسب القسم المسؤول' : 'By Department'}
              </h4>
              {crm.departmentWorkload?.length > 0 ? (
                <div className="space-y-2">
                  {crm.departmentWorkload.slice(0, 4).map((d: any) => (
                    <div key={d.nameEn} className="flex items-center justify-between rounded-xl bg-surface-sunken p-2.5 text-xs">
                      <span className="font-semibold text-content-strong">
                        {isRtl ? d.nameAr || d.nameEn : d.nameEn}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600">
                          {d.active} {isRtl ? 'نشطة' : 'active'}
                        </span>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600">
                          {d.resolved} {isRtl ? 'محلولة' : 'resolved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-content-muted py-2">{isRtl ? 'لا توجد بيانات' : 'No data'}</p>
              )}
            </div>

            <div className="pt-2 border-t border-line-subtle">
              <h4 className="text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                {isRtl ? 'أبرز الموظفين المكلفين' : 'Top Assigned Officers'}
              </h4>
              {crm.officerWorkload?.length > 0 ? (
                <div className="space-y-2">
                  {crm.officerWorkload.slice(0, 4).map((o: any) => (
                    <div key={o.nameEn} className="flex items-center justify-between rounded-xl bg-surface-sunken p-2.5 text-xs">
                      <span className="font-semibold text-content-strong">
                        {isRtl ? o.nameAr || o.nameEn : o.nameEn}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600">
                          {o.active} {isRtl ? 'نشطة' : 'active'}
                        </span>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600">
                          {o.resolved} {isRtl ? 'محلولة' : 'resolved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-content-muted py-2">{isRtl ? 'لا توجد بيانات' : 'No data'}</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, trend, isPositive }: { title: string; value: string | number; icon: React.ReactNode; trend?: string | undefined; isPositive?: boolean | undefined }) {
  return (
    <Card className="rounded-2xl border-line-subtle shadow-md bg-surface hover:shadow-lg transition-shadow duration-300 group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-content-muted">{title}</p>
          <div className="p-2 bg-brand/10 text-brand rounded-xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black tabular-nums tracking-tighter text-content-strong">{value}</p>
          {trend && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${isPositive ? 'border-status-success-border bg-status-success-bg text-content-strong' : 'border-status-error-border bg-status-error-bg text-content-strong'}`}>
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
