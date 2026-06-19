import { Injectable } from '@nestjs/common';
import { PortalVerificationStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

type PortalClient = Pick<Prisma.TransactionClient, 'portalVerification' | 'portalSession'>;

export type CreatePortalVerificationData = {
  complaintId: string;
  customerId: string;
  phone: string;
  otpHash: string;
  ipAddress?: string | null;
  expiresAt: Date;
};

export type PortalVerificationRecord = CreatePortalVerificationData & {
  id: string;
  status: PortalVerificationStatus;
  attempts: number;
  ipAddress: string | null;
  createdAt: Date;
};

export type PortalVerificationChallengeRecord = {
  id: string;
  complaintId: string;
  customerId: string;
  otpHash: string;
  status: PortalVerificationStatus;
  attempts: number;
  expiresAt: Date;
};

export type PortalSessionRecord = {
  id: string;
  complaintId: string;
  customerId: string;
  sessionHash: string;
  expiresAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
};
export type PortalSessionLookupRecord = Pick<PortalSessionRecord, 'id' | 'complaintId' | 'customerId' | 'expiresAt'>;

@Injectable()
export class PortalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async createVerification(data: CreatePortalVerificationData, client: PortalClient = this.prisma): Promise<PortalVerificationRecord> {
    return client.portalVerification.create({
      data: { ...data, status: PortalVerificationStatus.PENDING, attempts: 0, ipAddress: data.ipAddress ?? null },
      select: verificationSelect,
    });
  }

  async findVerificationChallenge(id: string, client: PortalClient = this.prisma): Promise<PortalVerificationChallengeRecord | null> {
    return client.portalVerification.findUnique({
      where: { id },
      select: { id: true, complaintId: true, customerId: true, otpHash: true, status: true, attempts: true, expiresAt: true },
    });
  }

  async recordFailedAttempt(id: string, fail: boolean, client: PortalClient = this.prisma): Promise<{ attempts: number; status: PortalVerificationStatus }> {
    return client.portalVerification.update({
      where: { id },
      data: { attempts: { increment: 1 }, ...(fail ? { status: PortalVerificationStatus.FAILED } : {}) },
      select: { attempts: true, status: true },
    });
  }

  async markExpired(id: string, client: PortalClient = this.prisma): Promise<{ status: PortalVerificationStatus }> {
    return client.portalVerification.update({ where: { id }, data: { status: PortalVerificationStatus.EXPIRED }, select: { status: true } });
  }

  async markVerified(id: string, client: PortalClient = this.prisma): Promise<void> {
    await client.portalVerification.update({ where: { id }, data: { status: PortalVerificationStatus.VERIFIED, verifiedAt: new Date() } });
  }

  async createSession(data: { complaintId: string; customerId: string; sessionHash: string; expiresAt: Date }, client: PortalClient = this.prisma): Promise<PortalSessionRecord> {
    return client.portalSession.create({ data, select: sessionSelect });
  }

  async findValidSession(sessionHash: string, now = new Date(), client: PortalClient = this.prisma): Promise<PortalSessionLookupRecord | null> {
    return client.portalSession.findFirst({
      where: { sessionHash, expiresAt: { gt: now } },
      select: { id: true, complaintId: true, customerId: true, expiresAt: true },
    });
  }
}

const verificationSelect = {
  id: true,
  complaintId: true,
  customerId: true,
  phone: true,
  otpHash: true,
  status: true,
  attempts: true,
  ipAddress: true,
  expiresAt: true,
  createdAt: true,
} satisfies Prisma.PortalVerificationSelect;

const sessionSelect = {
  id: true,
  complaintId: true,
  customerId: true,
  sessionHash: true,
  expiresAt: true,
  lastSeenAt: true,
  createdAt: true,
} satisfies Prisma.PortalSessionSelect;
