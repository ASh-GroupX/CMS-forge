import assert from 'node:assert/strict';
import test from 'node:test';
import { clearStaffSession, enterStaffSession, readStaffSession, sanitizeNavigationTrail, staffSectionHref, staffSessionKey, writeStaffSession } from '../../src/lib/staff-navigation-session';
import { hasTicketDraft, sanitizeTicketDraft } from '../../src/lib/use-ticket-draft';
import { staffDetailBackHref } from '../../src/lib/staff-report-navigation';

test('ticket draft includes metadata-only edits and excludes acknowledgement authority', () => {
  for (const value of [{ selectedCategoryId: 'category-1' }, { selectedPriority: 'HIGH' }, { specificDate: '2026-12-01' }, { timeIndex: 1 }, { assignmentMode: 'officer' }, { customFieldValues: { phone: '+962790000000' } }]) {
    assert.equal(hasTicketDraft(sanitizeTicketDraft(value)!), true);
  }
  assert.equal(hasTicketDraft(sanitizeTicketDraft({})!), false);
  assert.equal(sanitizeTicketDraft(null), null);
  assert.equal('acknowledgedPhoneFields' in sanitizeTicketDraft({ acknowledgedPhoneFields: ['phone'] })!, false);
});
test('draft return is allowlisted and section fallbacks always exist internally', () => {
  assert.equal(staffDetailBackHref('new-ticket', 'ar', 'tickets'), '/internal-tickets/new?locale=ar');
  assert.equal(staffDetailBackHref('https://attacker.test', 'en', 'tickets'), '/internal-tickets?locale=en');
  assert.equal(staffSectionHref('/internal-tickets/employee/staff-1', 'ar'), '/internal-tickets?locale=ar');
  assert.equal(staffSectionHref('/cases/confidential/case-1', 'en'), '/dashboard?locale=en');
  for (const root of ['communication', 'notifications', 'service-booking']) assert.equal(staffSectionHref(`/${root}`, 'en'), `/${root}?locale=en`);
  assert.deepEqual(sanitizeNavigationTrail({ entries: 'bad', index: 3 }), { entries: [], index: 0 });
  assert.deepEqual(sanitizeNavigationTrail({ entries: [{ id: 'a', href: '//attacker.test' }], index: 0 }), { entries: [], index: 0 });
});
test('tab drafts expire, clear on owner change/logout, and preserve unrelated preferences', context => {
  const oldStore = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage: Record<string, any> = {};
  Object.defineProperties(storage, {
    getItem: { value: (key: string) => storage[key] ?? null }, setItem: { value: (key: string, value: string) => { storage[key] = value; } }, removeItem: { value: (key: string) => { delete storage[key]; } },
  });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  context.mock.timers.enable({ apis: ['Date'], now: 1000 });
  try {
    enterStaffSession('owner-1');
    storage.setItem('cms-theme', 'dark');
    const key = staffSessionKey('owner-1', 'new-ticket');
    assert.equal(writeStaffSession(key, { title: 'Private draft' }), true);
    assert.deepEqual(readStaffSession(key), { title: 'Private draft' });
    context.mock.timers.tick(2 * 60 * 60 * 1000 + 1);
    assert.equal(readStaffSession(key), null);
    writeStaffSession(key, { title: 'Private draft' });
    enterStaffSession('owner-2');
    assert.equal(readStaffSession(key), null);
    assert.equal(storage.getItem('cms-theme'), 'dark');
    clearStaffSession();
    assert.equal(Object.keys(storage).some(key => key.startsWith('cms:staff-work:')), false);
  } finally {
    context.mock.timers.reset();
    if (oldStore) Object.defineProperty(globalThis, 'sessionStorage', oldStore); else delete (globalThis as any).sessionStorage;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete (globalThis as any).window;
  }
});
