import { HttpStatus } from '@nestjs/common';
import { TaskLinkEntityType } from '@prisma/client';
import { AppException } from '../../../core/http-kernel.js';

export const QUICK_ADD_RELATED_RECORD_TYPES = [
  TaskLinkEntityType.CUSTOMER,
  TaskLinkEntityType.COMPLAINT,
  TaskLinkEntityType.CASE,
  TaskLinkEntityType.DEAL,
] as const;

export type RelatedRecordType = (typeof QUICK_ADD_RELATED_RECORD_TYPES)[number];

export type RelatedRecordLookupQueryDto = {
  type: RelatedRecordType;
  q?: string;
};

export type RelatedRecordDto = {
  recordType: RelatedRecordType;
  recordId: string;
  label: string;
  labelAr: string;
  context: string | null;
  contextAr: string | null;
};

export type RelatedRecordLookupResponseDto = {
  records: RelatedRecordDto[];
};

export function parseRelatedRecordLookupQuery(query: Record<string, unknown>): RelatedRecordLookupQueryDto {
  const type = query.type;
  if (!QUICK_ADD_RELATED_RECORD_TYPES.includes(type as RelatedRecordType)) {
    throw invalid('type', 'type is invalid.');
  }
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  return q ? { type: type as RelatedRecordType, q } : { type: type as RelatedRecordType };
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid related-record lookup request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}
