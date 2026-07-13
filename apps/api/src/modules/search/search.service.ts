import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import { SEARCH_TYPES, type SearchActor, type SearchResponseDto, type SearchType } from './dto/search-response.dto.js';
import { SearchRepository } from './search.repository.js';

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async search(query: Record<string, unknown>, actor: SearchActor): Promise<SearchResponseDto> {
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const limit = query.limit === undefined ? 8 : Number(query.limit);
    const types = searchTypes(query.types);
    if (q.length < 2 || q.length > 100 || !Number.isInteger(limit) || limit < 1 || limit > 20) throw invalidSearch();
    const grouped = await Promise.all(types.map((type) => this.searchRepository.search(type, q, limit, actor)));
    return { items: grouped.flat().slice(0, limit), query: q, limit };
  }
}

function searchTypes(value: unknown): SearchType[] {
  if (value === undefined || value === '') return [...SEARCH_TYPES];
  const values = (Array.isArray(value) ? value : String(value).split(',')).map(String);
  if (!values.length || values.some((type) => !SEARCH_TYPES.includes(type as SearchType))) throw invalidSearch();
  return [...new Set(values)] as SearchType[];
}
function invalidSearch(): AppException { return new AppException('VALIDATION_FAILED', 'Invalid search query', HttpStatus.BAD_REQUEST, [{ field: 'q', code: 'INVALID', message: 'Search query, types, or limit is invalid.' }]); }
