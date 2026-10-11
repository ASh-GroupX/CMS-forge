import React from 'react';
import type { ReactNode } from 'react';

export default function InternalTicketsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-6 bg-surface rounded-3xl p-6 shadow-sm border border-line-subtle">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Tickets</h1>
          <p className="text-content-muted">Manage cross-department requests and workflow.</p>
        </div>
      </div>
      <nav className="flex items-center gap-6 border-b border-line-subtle pb-3">
        <a href="/internal-tickets" className="text-sm font-semibold text-content-strong hover:text-brand transition-colors">Department</a>
        <a href="/internal-tickets/my-work" className="text-sm font-semibold text-content-strong hover:text-brand transition-colors">My Work</a>
      </nav>
      {children}
    </div>
  );
}
