'use server';

import { cookies } from 'next/headers';
import { requestTicketPhoneDuplicates, type TicketPhoneDuplicateRequest, type PhoneDuplicateTicket } from '../../../../packages/contracts/src/ticket-phone-client';

export type { PhoneDuplicateTicket } from '../../../../packages/contracts/src/ticket-phone-client';
export async function findTicketPhoneDuplicates(input: TicketPhoneDuplicateRequest): Promise<{ items: PhoneDuplicateTicket[]; error?: string }> {
  const store = await cookies();
  const session = store.get('cms_staff_session')?.value;
  if (!session) return { items: [], error: 'AUTH_INVALID_CREDENTIALS' };
  return requestTicketPhoneDuplicates(input, { baseUrl: process.env.API_URL ?? 'http://localhost:3000', cookieHeader: `cms_staff_session=${session}` });
}
