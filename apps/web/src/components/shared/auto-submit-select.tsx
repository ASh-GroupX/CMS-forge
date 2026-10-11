"use client";

import React, { useRef, useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AutoSubmitSelect({
  defaultValue,
  name,
  label,
  options,
  allLabel = 'All',
}: {
  defaultValue: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <div ref={(el) => { if (el) formRef.current = el.closest('form'); }}>
      <Select 
        defaultValue={defaultValue} 
        name={name}
        onValueChange={(val) => {
          // Find the hidden input that Radix creates and force its value
          if (formRef.current) {
            const hiddenSelect = formRef.current.querySelector(`select[name="${name}"]`) as HTMLSelectElement;
            if (hiddenSelect) {
              hiddenSelect.value = val === 'all' ? '' : val;
            } else {
              // Fallback: create a hidden input if Radix hasn't rendered it yet
              let fallbackInput = formRef.current.querySelector(`input[name="${name}"][type="hidden"]`) as HTMLInputElement;
              if (!fallbackInput) {
                fallbackInput = document.createElement('input');
                fallbackInput.type = 'hidden';
                fallbackInput.name = name;
                formRef.current.appendChild(fallbackInput);
              }
              fallbackInput.value = val === 'all' ? '' : val;
            }
            formRef.current.requestSubmit();
          }
        }}
      >
        <SelectTrigger aria-label={label} id={`work-queue-${name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
