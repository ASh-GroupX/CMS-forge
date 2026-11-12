import assert from 'node:assert/strict';
import test from 'node:test';
import { customValues } from '../../src/components/portal-submission/custom-fields';
test('cleared optional custom answers are sent explicitly to intake', () => {
  const fields = [{ key: 'custom_note', type: 'text', enabled: true }, { key: 'custom_distance', type: 'number', enabled: true }, { key: 'custom_check', type: 'checkbox', enabled: true }];
  const data = new FormData();
  data.append('customFields.custom_note', '');
  data.append('customFields.custom_distance', '');
  data.append('customFields.custom_check', 'false');
  assert.deepEqual(customValues(data, fields as never), { custom_note: '', custom_distance: '', custom_check: false });
});
