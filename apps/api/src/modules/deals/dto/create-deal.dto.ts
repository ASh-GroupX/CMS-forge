export type CreateDealRequestDto = {
  title: string;
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stageDueAt: string;
  branchId?: string;
  blocker?: string | null;
};

export function parseCreateDealBody(body: unknown): CreateDealRequestDto {
  const input = objectBody(body);
  return {
    title: text(input.title),
    currentHolderId: text(input.currentHolderId) || null,
    stageDueAt: text(input.stageDueAt),
    ...(text(input.branchId) ? { branchId: text(input.branchId) } : {}),
    ...(input.blocker !== undefined ? { blocker: text(input.blocker) || null } : {}),
    ...(input.assignedDepartmentId !== undefined ? { assignedDepartmentId: text(input.assignedDepartmentId) || null } : {}),
  };
}

function objectBody(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
