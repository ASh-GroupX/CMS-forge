'use client';

import React from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Plus,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { useServiceBooking } from './service-booking-context';
import { getTodayDateString } from './service-booking-utils';

export function TimelineTopbar() {
  const {
    branches,
    locale,
    selectedBranchIds,
    selectedDate,
    setIsNewModalOpen,
    setSelectedDate,
    setView,
    t,
    toggleBranch,
    userRules,
    view,
  } = useServiceBooking();

  const isAr = locale === 'ar';
  const currentDate = new Date(`${selectedDate}T00:00:00Z`);

  // Format header month/year
  const monthYearLabel = currentDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'day') next.setUTCDate(next.getUTCDate() - 1);
    else if (view === 'week') next.setUTCDate(next.getUTCDate() - 7);
    else next.setUTCMonth(next.getUTCMonth() - 1);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'day') next.setUTCDate(next.getUTCDate() + 1);
    else if (view === 'week') next.setUTCDate(next.getUTCDate() + 7);
    else next.setUTCMonth(next.getUTCMonth() + 1);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const today = getTodayDateString();
    setSelectedDate(today);
    setTimeout(() => {
      const marker = document.getElementById('timeline-current-time-marker');
      if (marker) {
        try {
          marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          marker.scrollIntoView(true);
        }
      }
    }, 50);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line-subtle bg-surface/90 p-4 shadow-sm backdrop-blur-md">
      {/* Left: Date controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold tracking-tight text-content-strong min-w-[10rem]">
          {monthYearLabel}
        </h2>
        <div className="flex items-center gap-1 rounded-xl border border-line-subtle bg-surface-canvas/60 p-1">
          <Button
            aria-label="Previous"
            className="size-8 rounded-lg p-0"
            onClick={handlePrev}
            size="sm"
            type="button"
            variant="ghost"
          >
            {isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
          <Button
            className="h-8 rounded-lg px-3 text-xs font-semibold"
            onClick={handleToday}
            size="sm"
            type="button"
            variant="outline"
          >
            {t.today}
          </Button>
          <Button
            aria-label="Next"
            className="size-8 rounded-lg p-0"
            onClick={handleNext}
            size="sm"
            type="button"
            variant="ghost"
          >
            {isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Center & Right: Branch filter, View toggles, and New Appointment */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Filter */}
        <fieldset className="flex flex-wrap items-center gap-1 rounded-xl border border-line-subtle bg-surface-canvas/60 p-1 text-xs">
          <legend className="sr-only">{t.allBranches}</legend>
          <span className="flex items-center gap-1.5 px-2 text-content-muted" aria-hidden="true">
            <GitCompare className="size-3.5" />
          </span>
          {branches.map((b) => (
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
                selectedBranchIds.includes(b.id)
                  ? 'bg-brand/10 text-content-strong'
                  : 'text-content-muted hover:bg-surface hover:text-content-strong'
              }`}
              key={b.id}
            >
              <Checkbox
                aria-label={isAr ? b.nameAr : b.nameEn}
                checked={selectedBranchIds.includes(b.id)}
                onCheckedChange={() => toggleBranch(b.id)}
              />
              {isAr ? b.nameAr : b.nameEn}
            </label>
          ))}
        </fieldset>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-line-subtle bg-surface-canvas/60 p-1 text-xs">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              view === 'day'
                ? 'bg-surface text-content-strong shadow-sm font-semibold'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setView('day')}
            type="button"
          >
            <Calendar className="size-3.5" />
            <span>{t.views.day}</span>
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              view === 'week'
                ? 'bg-surface text-content-strong shadow-sm font-semibold'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setView('week')}
            type="button"
          >
            <CalendarRange className="size-3.5" />
            <span>{t.views.week}</span>
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              view === 'month'
                ? 'bg-surface text-content-strong shadow-sm font-semibold'
                : 'text-content-muted hover:text-content-strong'
            }`}
            onClick={() => setView('month')}
            type="button"
          >
            <CalendarDays className="size-3.5" />
            <span>{t.views.month}</span>
          </button>
        </div>

        {/* New Appointment Primary Button */}
        {userRules.canCreateBookings && (
          <Button
            className="flex items-center gap-2 rounded-xl bg-brand font-semibold text-primary-foreground shadow-lg shadow-brand/25 transition-transform active:scale-95"
            onClick={() => setIsNewModalOpen(true)}
            type="button"
          >
            <Plus className="size-4" />
            <span>{t.newAppointment}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
