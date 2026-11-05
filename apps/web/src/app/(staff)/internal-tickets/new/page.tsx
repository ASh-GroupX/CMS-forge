import React from 'react';
import CreateInternalTicketForm from './client-form';
import { getTicketOptions } from '../../../../lib/staff-internal-tickets-actions';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';

export default async function NewInternalTicketPage({ searchParams }: { searchParams?: Promise<{ locale?: string }> } = {}) {
  const locale = (await searchParams)?.locale === 'ar' ? 'ar' : 'en';
  const [options, principal] = await Promise.all([getTicketOptions(), getStaffSessionPrincipal()]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-content-strong">Create Internal Ticket</h2>
        <p className="text-sm text-content-muted">Send a request or task to another department.</p>
      </div>
      
      <CreateInternalTicketForm options={options} locale={locale} draftOwner={principal?.userId ?? null} />
    </div>
  );
}
