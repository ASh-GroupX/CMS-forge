import React from 'react';
import CreateInternalTicketForm from './client-form';
import { getTicketOptions } from '../../../../lib/staff-internal-tickets-actions';

export default async function NewInternalTicketPage() {
  const options = await getTicketOptions();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-content-strong">Create Internal Ticket</h2>
        <p className="text-sm text-content-muted">Send a request or task to another department.</p>
      </div>
      
      <CreateInternalTicketForm options={options} />
    </div>
  );
}
