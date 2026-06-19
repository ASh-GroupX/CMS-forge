import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { SurveyStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class SurveysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(complaintId: string, customerId: string): Promise<SurveyRecord | null> {
    return this.prisma.survey.findFirst({
      where: { complaintId, customerId, status: SurveyStatus.PENDING },
      select: surveySelect,
    });
  }

  async createPending(data: CreatePendingSurveyData): Promise<SurveyRecord> {
    return this.prisma.survey.create({
      data: { ...data, status: SurveyStatus.PENDING },
      select: surveySelect,
    });
  }

  async findPendingByTokenHash(tokenHash: string): Promise<SurveyRecord | null> {
    return this.prisma.survey.findFirst({
      where: { tokenHash, status: SurveyStatus.PENDING },
      select: surveySelect,
    });
  }

  async submitPending(id: string, data: SubmitSurveyData): Promise<SurveyRecord | null> {
    return this.prisma.$transaction(async (client) => {
      const updated = await client.survey.updateMany({
        where: { id, status: SurveyStatus.PENDING, submittedAt: null },
        data: { status: SurveyStatus.SUBMITTED, rating: data.rating, comment: data.comment, submittedAt: data.submittedAt },
      });
      return updated.count === 1 ? client.survey.findUnique({ where: { id }, select: surveySelect }) : null;
    });
  }

  async listSubmittedByComplaint(complaintId: string): Promise<SurveyRecord[]> {
    return this.prisma.survey.findMany({
      where: { complaintId, status: SurveyStatus.SUBMITTED, submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: surveySelect,
    });
  }
}

const surveySelect = {
  id: true,
  complaintId: true,
  customerId: true,
  status: true,
  tokenHash: true,
  expiresAt: true,
  createdAt: true,
  rating: true,
  comment: true,
  submittedAt: true,
} satisfies Prisma.SurveySelect;

export type SurveyRecord = Prisma.SurveyGetPayload<{ select: typeof surveySelect }>;

export type CreatePendingSurveyData = {
  complaintId: string;
  customerId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type SubmitSurveyData = {
  rating: number;
  comment: string | null;
  submittedAt: Date;
};
