export type StandardProblemView = {
  id: string;
  departmentId: string;
  titleEn: string;
  titleAr: string;
  isActive: boolean;
};

export type CreateStandardProblemData = {
  titleEn: string;
  titleAr: string;
};

export type UpdateStandardProblemData = {
  titleEn?: string;
  titleAr?: string;
  isActive?: boolean;
};

export async function fetchStandardProblems(departmentId: string): Promise<StandardProblemView[]> {
  const response = await fetch(`/api/departments/${departmentId}/standard-problems`);
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.items) ? body.items : [];
}

export async function createStandardProblem(departmentId: string, data: CreateStandardProblemData, csrfToken: string): Promise<StandardProblemView | null> {
  const response = await fetch(`/api/departments/${departmentId}/standard-problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  const body = await response.json();
  return body.problem ?? null;
}

export async function updateStandardProblem(id: string, data: UpdateStandardProblemData, csrfToken: string): Promise<StandardProblemView | null> {
  const response = await fetch(`/api/departments/standard-problems/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  const body = await response.json();
  return body.problem ?? null;
}

export async function deleteStandardProblem(id: string, csrfToken: string): Promise<boolean> {
  const response = await fetch(`/api/departments/standard-problems/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrfToken },
  });
  return response.ok;
}
