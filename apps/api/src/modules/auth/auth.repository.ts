import type { Prisma, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

export type StaffAuthRecord = {
  id: string;
  email: string;
  username: string | null;
  nameEn: string;
  nameAr: string;
  passwordHash: string | null;
  branchId: string | null;
  isActive: boolean;
  lockedAt: Date | null;
  role: { code: RoleCode };
};

export type CreateStaffSessionInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
  user: Pick<StaffAuthRecord, 'id' | 'branchId' | 'isActive' | 'lockedAt'>;
};

export type StaffSessionRecord = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: Omit<StaffAuthRecord, 'passwordHash'>;
};

export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async findStaffByIdentifier(identifier: string): Promise<StaffAuthRecord | null> {
    const value = identifier.toLowerCase();
    return this.prisma.user.findFirst({
      where: { OR: [{ email: value }, { username: value }] },
      select: {
        id: true,
        email: true,
        username: true,
        nameEn: true,
        nameAr: true,
        passwordHash: true,
        branchId: true,
        isActive: true,
        lockedAt: true,
        role: { select: { code: true } },
      },
    });
  }

  async createStaffSession(
    input: CreateStaffSessionInput,
    client: Pick<PrismaService, 'staffSession'> = this.prisma,
  ): Promise<{ id: string }> {
    return client.staffSession.create({
      data: input,
      select: { id: true },
    });
  }

  async createPasswordResetToken(
    input: CreatePasswordResetTokenInput,
    client: Pick<PrismaService, 'staffPasswordResetToken'> = this.prisma,
  ): Promise<{ id: string }> {
    return client.staffPasswordResetToken.create({
      data: input,
      select: { id: true },
    });
  }

  async findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    return this.prisma.staffPasswordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
        user: { select: { id: true, branchId: true, isActive: true, lockedAt: true } },
      },
    });
  }

  async consumePasswordResetToken(
    tokenId: string,
    userId: string,
    newPasswordHash: string,
    now: Date,
    client: Pick<PrismaService, 'staffPasswordResetToken' | 'user'> = this.prisma,
  ): Promise<boolean> {
    const consumed = await client.staffPasswordResetToken.updateMany({
      where: { id: tokenId, consumedAt: null },
        data: { consumedAt: now },
    });
    if (consumed.count !== 1) return false;
    await client.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
    return true;
  }

  async findStaffSessionByTokenHash(tokenHash: string): Promise<StaffSessionRecord | null> {
    return this.prisma.staffSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            nameEn: true,
            nameAr: true,
            branchId: true,
            isActive: true,
            lockedAt: true,
            role: { select: { code: true } },
          },
        },
      },
    });
  }

  async revokeStaffSession(
    tokenHash: string,
    revokedAt: Date,
    client: Pick<PrismaService, 'staffSession'> = this.prisma,
  ): Promise<number> {
    const result = await client.staffSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });

    return result.count;
  }
}
