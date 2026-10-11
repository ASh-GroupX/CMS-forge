export type TemplateField = {
  id: string;
  label: string;
  type: 'text' | 'long_text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[]; // for dropdown/radio
  section?: string;
  helpText?: string;
};

export type ComplaintTemplate = {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  schema: TemplateField[];
  createdAt: Date;
  updatedAt: Date;
};

// Next.js development typically proxies API requests or hits localhost:3000
const API_BASE = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') : '';

async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  const isServer = typeof window === 'undefined';
  let cookieHeader = '';
  
  if (isServer) {
    try {
      const { headers } = await import('next/headers');
      cookieHeader = (await headers()).get('cookie') || '';
    } catch {}
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(isServer ? {} : (getCsrfToken() ? { 'x-csrf-token': getCsrfToken()! } : {})),
      ...init?.headers,
    },
    ...(isServer ? {} : { credentials: 'include' }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )cms_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1] || '') : null;
}

export async function getDepartmentTemplates(departmentId: string): Promise<ComplaintTemplate[]> {
  return apiFetch(`/department-complaint-templates/department/${departmentId}`);
}

export async function createComplaintTemplate(departmentId: string, payload: { name: string; description?: string; isActive?: boolean; schema: TemplateField[] }): Promise<ComplaintTemplate> {
  return apiFetch(`/department-complaint-templates/department/${departmentId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComplaintTemplate(id: string, payload: { name?: string; description?: string; isActive?: boolean; schema?: TemplateField[] }): Promise<ComplaintTemplate> {
  return apiFetch(`/department-complaint-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getComplaintTemplate(id: string): Promise<ComplaintTemplate> {
  return apiFetch(`/department-complaint-templates/${id}`);
}
