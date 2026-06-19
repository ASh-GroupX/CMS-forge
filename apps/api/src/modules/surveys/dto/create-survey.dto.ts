import { AppException } from '../../../core/http-kernel.js';
import type { SubmitSurveyInput } from '../surveys.service.js';

export function parseSurveySubmissionBody(body: unknown): SubmitSurveyInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('body');
  const input = body as Record<string, unknown>;
  return {
    surveyToken: text(input.surveyToken, 'surveyToken'),
    rating: rating(input.rating),
    comment: input.comment === undefined || input.comment === null ? null : text(input.comment, 'comment'),
  };
}

function text(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalid(field);
}

function rating(value: unknown): number {
  if (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5) return Number(value);
  throw invalid('rating');
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid survey request', 400, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
