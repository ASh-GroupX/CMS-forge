import assert from 'node:assert/strict';
import test from 'node:test';
import { selectedTaskRecipients } from '../../src/lib/staff-tasks-api';

test('quick add keeps every selected officer and department recipient', () => {
  const form = new FormData();
  form.append('assignedUserIds', 'officer-1');
  form.append('assignedUserIds', 'officer-2');
  form.append('assignedDepartmentIds', 'department-1');
  assert.deepEqual(selectedTaskRecipients(form), {
    assignedUserIds: ['officer-1', 'officer-2'],
    assignedDepartmentIds: ['department-1'],
  });
  assert.deepEqual(selectedTaskRecipients(new FormData()), { assignedUserIds: [], assignedDepartmentIds: [] });
});
