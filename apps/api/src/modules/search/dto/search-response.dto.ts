export const SEARCH_TYPES = ['CUSTOMER', 'INTERNAL_TICKET', 'COMPLAINT', 'TASK', 'CASE', 'DEAL'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];
export type SearchActor = { userId: string; roleCode: string; branchId: string | null; departmentId?: string | null; permissions?: string[] };
export type SearchResult = { type: SearchType; id: string; label: string; labelAr: string; context: string; contextAr: string; href: string };
export type SearchResponseDto = { items: SearchResult[]; query: string; limit: number };
