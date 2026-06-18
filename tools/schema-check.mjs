import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requiredModels = [
  'Branch',
  'Department',
  'Role',
  'User',
  'Category',
  'Customer',
  'Vehicle',
  'Complaint',
  'ComplaintStatusHistory',
  'Approval',
  'Attachment',
  'Comment',
  'SlaPolicy',
  'SlaEvent',
  'Notification',
  'Survey',
  'Compensation',
  'PortalVerification',
  'PortalSession',
  'AuditLog',
];

export function checkSchemaText(text) {
  const errors = [];

  for (const model of requiredModels) {
    if (!new RegExp(`model\\s+${model}\\s+{`).test(text)) {
      errors.push(`missing model: ${model}`);
    }
  }

  for (const [model, table] of [
    ['ComplaintStatusHistory', 'complaint_status_history'],
    ['AuditLog', 'audit_logs'],
  ]) {
    const block = text.match(new RegExp(`model\\s+${model}\\s+{[\\s\\S]*?\\n}`))?.[0] ?? '';
    if (!block.includes(`@@map("${table}")`)) {
      errors.push(`${model} must map to ${table}`);
    }
  }

  if (!/model\s+Complaint\s+{[\s\S]*statusHistory\s+ComplaintStatusHistory\[\]/.test(text)) {
    errors.push('Complaint must expose status history');
  }

  if (!/enum\s+AuditEventType\s+{[\s\S]*SECURITY/.test(text)) {
    errors.push('AuditEventType must include SECURITY');
  }

  return errors;
}

export function checkSchema(root = process.cwd()) {
  const text = readFileSync(join(root, 'packages/database/prisma/schema.prisma'), 'utf8');
  const errors = checkSchemaText(text);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkSchema();
  console.log('Schema check passed');
}
