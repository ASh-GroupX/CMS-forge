import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSchema, checkSchemaText, requiredModels } from './schema-check.mjs';

test('current prisma schema includes the required core data model', () => {
  assert.deepEqual(checkSchema().errors, []);
});

test('schema check accepts the current core model draft', () => {
  const text = requiredModels
    .filter((model) => !['Complaint', 'ComplaintStatusHistory', 'AuditLog'].includes(model))
    .map((model) => `model ${model} {\n  id String @id\n}`)
    .join('\n\n');
  const complaint = 'model Complaint {\n  id String @id\n  statusHistory ComplaintStatusHistory[]\n}';
  const history = 'model ComplaintStatusHistory {\n  id String @id\n\n  @@map("complaint_status_history")\n}';
  const audit = 'model AuditLog {\n  id String @id\n\n  @@map("audit_logs")\n}';
  const auditEnum = 'enum AuditEventType {\n  SECURITY\n}';

  assert.deepEqual(checkSchemaText(`${text}\n${complaint}\n${history}\n${audit}\n${auditEnum}`), []);
});

test('schema check rejects missing complaint history and audit storage', () => {
  assert.deepEqual(checkSchemaText('model Complaint {\n  id String @id\n}\n'), [
    ...requiredModels.filter((model) => model !== 'Complaint').map((model) => `missing model: ${model}`),
    'ComplaintStatusHistory must map to complaint_status_history',
    'AuditLog must map to audit_logs',
    'Complaint must expose status history',
    'AuditEventType must include SECURITY',
  ]);
});
