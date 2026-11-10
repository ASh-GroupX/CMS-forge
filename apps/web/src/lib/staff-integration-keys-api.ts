const resources = ['customers', 'complaints', 'tasks', 'appointments'] as const;
export type DataResource = (typeof resources)[number];
export type DataScope = `${DataResource}:read`;
export type DataApiKey = {
  id: string; name: string; keyPrefix: string; scopes: DataScope[];
  branchIds: string[]; allBranches: boolean; createdAt: string;
  lastUsedAt: string | null; revokedAt: string | null;
};
export type BranchOption = { id: string; nameEn: string; nameAr: string };
export type ApiFailure = { status: 'unauthorized' | 'forbidden' | 'validation' | 'conflict' | 'error' };
export type ApiClientOptions = { cookie: string; csrf?: string; apiUrl?: string; fetchImpl?: typeof fetch };

function url(path: string, options: ApiClientOptions): URL {
  return new URL(path, options.apiUrl ?? process.env.API_URL ?? 'http://localhost:3000');
}

async function staffFetch(path: string, options: ApiClientOptions, init: RequestInit = {}): Promise<Response> {
  return (options.fetchImpl ?? fetch)(url(path, options), {
    ...init, cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', cookie: options.cookie,
      ...(options.csrf ? { 'x-csrf-token': options.csrf } : {}), ...init.headers },
  });
}

function failure(response: Response): ApiFailure {
  return { status: response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden'
    : response.status === 400 ? 'validation' : response.status === 409 ? 'conflict' : 'error' };
}

export async function loadDataApiKeys(options: ApiClientOptions): Promise<({ status: 'ok'; keys: DataApiKey[]; branches: BranchOption[] }) | ApiFailure> {
  try {
    const [keysResponse, branchesResponse] = await Promise.all([
      staffFetch('/integrations/data-api-keys', options), staffFetch('/branches', options),
    ]);
    if (!keysResponse.ok) return failure(keysResponse);
    const keysBody = await keysResponse.json() as { items: DataApiKey[] };
    const branchesBody = branchesResponse.ok ? await branchesResponse.json() as { items: BranchOption[] } : { items: [] };
    return { status: 'ok', keys: keysBody.items, branches: branchesBody.items };
  } catch { return { status: 'error' }; }
}

export async function createDataApiKey(options: ApiClientOptions, input: {
  name: string; scopes: DataScope[]; allBranches: boolean; branchIds: string[];
}): Promise<({ status: 'ok'; key: DataApiKey; secret: string }) | ApiFailure> {
  try {
    const response = await staffFetch('/integrations/data-api-keys', options, { method: 'POST', body: JSON.stringify(input) });
    if (!response.ok) return failure(response);
    const body = await response.json() as { key: DataApiKey; secret: string };
    return { status: 'ok', key: body.key, secret: body.secret };
  } catch { return { status: 'error' }; }
}

export async function revokeDataApiKey(options: ApiClientOptions, id: string): Promise<{ status: 'ok' } | ApiFailure> {
  try {
    const response = await staffFetch(`/integrations/data-api-keys/${encodeURIComponent(id)}/revoke`, options, { method: 'POST' });
    if (!response.ok) return failure(response);
    const body = await response.json() as { revoked: boolean };
    return body.revoked ? { status: 'ok' } : { status: 'conflict' };
  } catch { return { status: 'error' }; }
}

export async function testDataApiKey(options: Pick<ApiClientOptions, 'apiUrl' | 'fetchImpl'>, secret: string, resource: DataResource): Promise<({ status: 'ok'; rowCount: number; hasMore: boolean }) | ApiFailure> {
  if (!resources.includes(resource) || !/^cms_live_[A-Za-z0-9_-]{40,}$/.test(secret)) return { status: 'validation' };
  try {
    const response = await (options.fetchImpl ?? fetch)(url(`/external-data/${resource}?limit=1`, { cookie: '', ...options }), {
      cache: 'no-store', headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
    });
    if (!response.ok) return failure(response);
    const body = await response.json() as { items: unknown[]; nextCursor: string | null };
    return { status: 'ok', rowCount: body.items.length, hasMore: body.nextCursor !== null };
  } catch { return { status: 'error' }; }
}
