'use client';

import React, { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/staff-shell';

export function LocalTime({ locale, value }: { locale: Locale; value: string }) {
  const [label, setLabel] = useState(value);
  useEffect(() => {
    const date = new Date(value);
    setLabel(Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date));
  }, [locale, value]);
  return <time dateTime={value}>{label}</time>;
}
