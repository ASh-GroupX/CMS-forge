'use server';

import { cookies } from 'next/headers';
import { createDataApiKey, loadDataApiKeys, revokeDataApiKey, testDataApiKey } from '../../../../lib/staff-integration-keys-api';
import type { DataResource, DataScope } from '../../../../lib/staff-integration-keys-api';

async function staffOptions() {
  const store = await cookies();
  const csrf = store.get('cms_csrf_token')?.value;
  return { cookie: store.toString(), ...(csrf ? { csrf } : {}) };
}

export async function loadDataApiKeysAction() {
  return loadDataApiKeys(await staffOptions());
}

export async function createDataApiKeyAction(input: {
  name: string; scopes: DataScope[]; allBranches: boolean; branchIds: string[];
}) {
  return createDataApiKey(await staffOptions(), input);
}

export async function revokeDataApiKeyAction(id: string) {
  return revokeDataApiKey(await staffOptions(), id);
}

export async function testDataApiKeyAction(secret: string, resource: DataResource) {
  return testDataApiKey({}, secret, resource);
}
