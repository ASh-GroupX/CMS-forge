export type AdvanceDealRequestDto = {
  currentHolderId: string;
  stageDueAt: string;
};

export type DealBlockerRequestDto = {
  blocker: string | null;
};

export function parseAdvanceDealBody(body: unknown): AdvanceDealRequestDto {
  const input = objectBody(body);
  return {
    currentHolderId: text(input.currentHolderId),
    stageDueAt: text(input.stageDueAt),
  };
}

export function parseDealBlockerBody(body: unknown): DealBlockerRequestDto {
  const input = objectBody(body);
  return { blocker: text(input.blocker) || null };
}

function objectBody(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
