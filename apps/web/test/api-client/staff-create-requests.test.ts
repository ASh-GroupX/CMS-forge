import assert from 'node:assert/strict';
import test from 'node:test';
import { createBookingRequest, createTicketRequest } from '../../src/lib/staff-create-requests';

test('booking create uses stable API and reuses its request ID after a lost response', async () => {
  const restore = browserGlobals();
  const requests: Array<{ url: string; body: any; headers: HeadersInit }> = [];
  let attempts = 0;
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(String(options?.body)), headers: options?.headers ?? {} });
    if (++attempts === 1) throw new Error('connection interrupted');
    return Response.json({ id: 'saved-booking' });
  };
  try {
    const input = { branchId: 'center-1', bookingLaneId: 'lane-1', carModelId: 'model-1', maintenanceTypeId: 'type-1', customerName: 'Customer', customerPhone: '0790000000', date: '2026-11-21', startTime: '10:00', notes: '' };
    assert.equal((await createBookingRequest(input)).success, false);
    assert.equal((await createBookingRequest(input)).appointment?.id, 'saved-booking');
    assert.equal(requests[0].url, '/api/service-bookings/appointments');
    assert.equal(requests[0].body.requestId, requests[1].body.requestId);
    assert.equal((requests[0].headers as Record<string, string>)['x-csrf-token'], 'csrf-value');
    await createBookingRequest(input);
    assert.notEqual(requests[1].body.requestId, requests[2].body.requestId);
  } finally { restore(); }
});

test('ticket create survives a changed relative due time on retry', async () => {
  const restore = browserGlobals();
  const ids: string[] = [];
  let attempts = 0;
  globalThis.fetch = async (_url, options) => {
    ids.push(JSON.parse(String(options?.body)).requestId);
    if (++attempts === 1) throw new Error('connection interrupted');
    return Response.json({ id: 'saved-ticket' });
  };
  try {
    const base = { title: 'Request', description: 'Details', targetDepartmentId: 'department-1', categoryId: 'category-1' };
    assert.equal((await createTicketRequest({ ...base, dueAt: '2026-11-21T10:00:00Z' })).success, false);
    assert.equal((await createTicketRequest({ ...base, dueAt: '2026-11-21T10:01:00Z' })).data?.id, 'saved-ticket');
    assert.equal(ids[0], ids[1]);
  } finally { restore(); }
});

function browserGlobals(): () => void {
  const previousFetch = globalThis.fetch;
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: 'cms_csrf_token=csrf-value' } });
  return () => {
    globalThis.fetch = previousFetch;
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage); else Reflect.deleteProperty(globalThis, 'sessionStorage');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
  };
}
