'use client';

import React, { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/staff-shell';

export function LocalTime({ locale, value, timeZone = 'Asia/Amman' }: { locale: Locale; value: string; timeZone?: string }) {
  const [label, setLabel] = useState(value);
  useEffect(() => {
    const date = new Date(value);
    setLabel(Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale === 'ar' ? 'ar-JO' : 'en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone,
        }).format(date));
  }, [locale, value, timeZone]);
  return <time dateTime={value}>{label}</time>;
}
