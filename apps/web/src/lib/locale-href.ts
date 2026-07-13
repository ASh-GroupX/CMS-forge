import type { Locale } from '../i18n/staff-shell';

export function localeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, 'http://cms.local');
  url.searchParams.set('locale', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}
