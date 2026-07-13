'use client';

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

type FileInputLocale = 'ar' | 'en';

type LocalizedFileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  className?: string | undefined;
  inputClassName?: string | undefined;
  locale: FileInputLocale;
};

const fileInputText = {
  ar: {
    chooseMany: 'اختيار ملفات',
    chooseOne: 'اختيار ملف',
    emptyMany: 'لم يتم اختيار ملفات',
    emptyOne: 'لم يتم اختيار ملف',
    selectedMany: (count: number) => `تم اختيار ${new Intl.NumberFormat('ar-EG').format(count)} ملفات`,
  },
  en: {
    chooseMany: 'Choose files',
    chooseOne: 'Choose file',
    emptyMany: 'No files selected',
    emptyOne: 'No file selected',
    selectedMany: (count: number) => `${new Intl.NumberFormat('en-US').format(count)} files selected`,
  },
} as const;

export function LocalizedFileInput({
  className,
  disabled,
  id,
  inputClassName,
  locale,
  multiple,
  onChange,
  style,
  ...props
}: LocalizedFileInputProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const text = fileInputText[locale];
  const emptyText = multiple ? text.emptyMany : text.emptyOne;
  const selectedText = selected.length
    ? selected.length === 1
      ? selected[0]
      : text.selectedMany(selected.length)
    : emptyText;

  return (
    <div className={cn('grid gap-1', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          {...props}
          className={cn('peer', inputClassName)}
          disabled={disabled}
          id={id}
          multiple={multiple}
          style={{ ...visuallyHiddenInputStyle, ...style }}
          type="file"
          onChange={(event) => {
            setSelected(Array.from(event.currentTarget.files ?? []).map((file) => file.name));
            onChange?.(event);
          }}
        />
        <Label
          aria-disabled={disabled || undefined}
          className={cn(
            'inline-flex min-h-10 cursor-pointer items-center justify-center rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm font-semibold text-content-strong shadow-sm',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          htmlFor={id}
        >
          {multiple ? text.chooseMany : text.chooseOne}
        </Label>
        <span className="min-w-0 break-words text-xs text-content-muted" aria-live="polite">{selectedText}</span>
      </div>
    </div>
  );
}

const visuallyHiddenInputStyle: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};
