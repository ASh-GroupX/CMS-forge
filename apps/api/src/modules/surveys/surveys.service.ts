import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SurveysRepository } from './surveys.repository.js';
import type { SurveyRecord } from './surveys.repository.js';

export type ScheduleSurveyInput = {
  complaintId?: string;
  customerId?: string;
  locale?: string;
  now?: Date;
  expiresInHours?: number;
};

export type ScheduledSurvey = {
  surveyId: string;
  complaintId: string;
  customerId: string;
  expiresAt: string;
  surveyToken: string | null;
  created: boolean;
};

export type SubmitSurveyInput = {
  surveyToken?: string;
  rating?: number;
  comment?: string | null;
  now?: Date;
};

export type SubmittedSurvey = {
  survey: {
    id: string;
    rating: number;
    submittedAt: string;
  };
};

export type StaffSurveyResult = {
  id: string;
  complaintId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
};

@Injectable()
export class SurveysService {
  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async scheduleClosureSurvey(input: ScheduleSurveyInput): Promise<ScheduledSurvey> {
    const complaintId = requiredText(input.complaintId, 'complaintId');
    const customerId = requiredText(input.customerId, 'customerId');
    const existing = await this.surveysRepository.findPending(complaintId, customerId);
    if (existing) return surveyDto(existing, null, false);

    const token = randomBytes(32).toString('base64url');
    const survey = await this.surveysRepository.createPending({
      complaintId,
      customerId,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: expiresAt(input.now ?? new Date(), input.expiresInHours ?? 24 * 14),
    });
    await this.notificationsService.queueInternal({
      complaintId,
      templateCode: 'survey.link.customer',
      locale: input.locale ?? 'en',
      payload: { surveyId: survey.id, surveyToken: token, expiresAt: survey.expiresAt.toISOString() },
    });
    return surveyDto(survey, token, true);
  }

  async submitPortalSurvey(input: SubmitSurveyInput): Promise<SubmittedSurvey> {
    const now = input.now ?? new Date();
    const survey = await this.surveysRepository.findPendingByTokenHash(hashToken(requiredText(input.surveyToken, 'surveyToken')));
    if (!survey || survey.expiresAt <= now) throw portalDenied();

    const submitted = await this.surveysRepository.submitPending(survey.id, {
      rating: rating(input.rating),
      comment: optionalText(input.comment, 'comment'),
      submittedAt: now,
    });
    if (!submitted?.submittedAt || submitted.rating === null) throw portalDenied();
    return { survey: { id: submitted.id, rating: submitted.rating, submittedAt: submitted.submittedAt.toISOString() } };
  }

  async listSubmittedForComplaint(complaintId: string): Promise<StaffSurveyResult[]> {
    return (await this.surveysRepository.listSubmittedByComplaint(requiredText(complaintId, 'complaintId'))).map(staffSurveyDto);
  }
}

function surveyDto(survey: SurveyRecord, surveyToken: string | null, created: boolean): ScheduledSurvey {
  return {
    surveyId: survey.id,
    complaintId: survey.complaintId,
    customerId: survey.customerId,
    expiresAt: survey.expiresAt.toISOString(),
    surveyToken,
    created,
  };
}

function staffSurveyDto(survey: SurveyRecord): StaffSurveyResult {
  if (!survey.submittedAt || survey.rating === null) throw portalDenied();
  return {
    id: survey.id,
    complaintId: survey.complaintId,
    rating: survey.rating,
    comment: survey.comment,
    submittedAt: survey.submittedAt.toISOString(),
  };
}

function expiresAt(now: Date, hours: number): Date {
  if (!Number.isInteger(hours) || hours <= 0) throw invalid('expiresInHours');
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalid(field);
}

function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return requiredText(value, field);
}

function rating(value: unknown): number {
  if (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5) return Number(value);
  throw invalid('rating');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid survey request', 400, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

function portalDenied(): AppException {
  return new AppException('PORTAL_VERIFICATION_FAILED', 'Portal verification failed', 400);
}
