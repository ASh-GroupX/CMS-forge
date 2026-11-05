'use client';
import React, { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isActiveNav } from '../../lib/staff-active-navigation';

export function StaffNavAnchor({ href, rootHref, navKey, activePath, label, title, className, activeClassName, inactiveClassName, children }: {
  href: string; rootHref: string; navKey: string; activePath: string; label?: string; title?: string;
  className: string; activeClassName: string; inactiveClassName: string; children: ReactNode;
}) {
  const pathname = usePathname();
  const active = isActiveNav(navKey, rootHref, pathname ?? activePath);
  return <a href={href} data-staff-nav={rootHref} aria-current={active ? 'page' : undefined} aria-label={label} title={title}
    className={`${className} ${active ? activeClassName : inactiveClassName}`}>{children}</a>;
}
