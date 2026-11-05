import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { enforcePhoneRule, phoneMatches } from '../apps/api/src/modules/internal-tickets/internal-ticket-phone-rule.ts';

const url = process.env.PHONE_RULE_PROOF_URL;
const { PrismaClient } = createRequire(new URL('../apps/api/package.json', import.meta.url))('@prisma/client');
if (!url || new URL(url).hostname !== '127.0.0.1' || !new URL(url).pathname.includes('phone_rule_proof')) throw new Error('Use an isolated loopback phone_rule_proof database');
const prisma = new PrismaClient({ datasourceUrl: url });
const principal = { userId: 'staff-1', roleCode: 'CR_OFFICER', departmentId: 'dept-1' };
try {
  await prisma.ticketCustomerPhone.createMany({ data: ['target', 'requester', 'assigned', 'coworker', 'hidden'].map(ticketId => ({ ticketId, fieldId: 'phone-field', phone: '+962790000000' })) });
  await prisma.$transaction(async tx => {
    const own = await phoneMatches(tx, '+962790000000', principal);
    assert.deepEqual(own.map(item => item.id).sort(), ['assigned', 'coworker', 'requester', 'target']);
    assert.ok(!JSON.stringify(own).includes('Hidden'));
    assert.equal((await phoneMatches(tx, '+962790000000', { ...principal, roleCode: 'ADMIN' })).length, 5);
    assert.deepEqual((await phoneMatches(tx, '+962790000000', { ...principal, departmentId: null })).map(item => item.id).sort(), ['assigned', 'requester']);
  });
  const legacy = await prisma.$queryRaw`SELECT phone_duplicate_check FROM department_ticket_custom_fields WHERE id = 'legacy-field'`;
  assert.equal(legacy[0].phone_duplicate_check, false);
  const fields = [{ id: 'race-field', nameEn: 'Phone', isRequired: true, phoneDuplicateCheck: true }];
  let signalLocked;
  const locked = new Promise(resolve => { signalLocked = resolve; });
  const first = prisma.$transaction(async tx => {
    await enforcePhoneRule(tx, principal, fields, { 'race-field': '+962790000001' }, []);
    signalLocked();
    await new Promise(resolve => setTimeout(resolve, 200));
    await tx.$executeRaw`INSERT INTO internal_tickets(id,reference_number,title,status,requested_by_id,target_department_id) VALUES('race-ticket','RACE-1','Race proof','NEW','staff-1','dept-1')`;
    await tx.ticketCustomerPhone.create({ data: { ticketId: 'race-ticket', fieldId: 'race-field', phone: '+962790000001' } });
  });
  await locked;
  const second = prisma.$transaction(tx => enforcePhoneRule(tx, principal, fields, { 'race-field': '+962790000001' }, []));
  const results = await Promise.allSettled([first, second]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.equal(results[1].reason.code, 'DUPLICATE_CUSTOMER_PHONE');
  console.log('PostgreSQL phone-rule proof passed: migration defaults, cross-department allowed/denied/admin visibility and serialized concurrent duplicate detection.');
} finally { await prisma.$disconnect(); }
