'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export const TIME_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '1 Day', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '5 Days', hours: 120 },
  { label: '1 Week', hours: 168 },
] as const;

interface DueDatePickerProps {
  dateMode: 'relative' | 'specific';
  setDateMode: (mode: 'relative' | 'specific') => void;
  timeIndex: number;
  setTimeIndex: (index: number) => void;
  specificDate: string;
  setSpecificDate: (date: string) => void;
}

export function DueDatePicker({
  dateMode,
  setDateMode,
  timeIndex,
  setTimeIndex,
  specificDate,
  setSpecificDate,
}: DueDatePickerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface-canvas/50 p-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold text-content-strong">Timeline / Due Date</label>
        
        <div className="flex items-center gap-1 rounded-lg bg-surface border border-line-subtle p-1">
          <button
            type="button"
            onClick={() => setDateMode('relative')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${dateMode === 'relative' ? 'bg-brand text-white shadow-sm' : 'text-content-muted hover:text-content-strong'}`}
          >
            <Clock className="size-3.5" /> Relative
          </button>
          <button
            type="button"
            onClick={() => setDateMode('specific')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${dateMode === 'specific' ? 'bg-brand text-white shadow-sm' : 'text-content-muted hover:text-content-strong'}`}
          >
            <Calendar className="size-3.5" /> Specific Date
          </button>
        </div>
      </div>

      {dateMode === 'relative' ? (
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">Time allowed:</span>
            <span className="rounded-lg bg-brand/10 px-3 py-1 text-sm font-bold text-brand">{TIME_OPTIONS[timeIndex]?.label ?? '1 Day'}</span>
          </div>
          <div className="relative w-full px-2">
            <input 
              type="range" 
              min="0" 
              max={TIME_OPTIONS.length - 1} 
              step="1" 
              value={timeIndex}
              onChange={(e) => setTimeIndex(Number(e.target.value))}
              className="w-full h-2 bg-line-subtle rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <div className="flex justify-between text-[10px] font-semibold text-content-subtle mt-2 px-1">
              <span>{TIME_OPTIONS[0]?.label}</span>
              <span>{TIME_OPTIONS[TIME_OPTIONS.length - 1]?.label}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <input 
            type="date" 
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="w-full rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" 
          />
        </div>
      )}
    </div>
  );
}
