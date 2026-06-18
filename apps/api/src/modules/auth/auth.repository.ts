import type { RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

export type StaffAuthRecord = {
  id: string;
  email: string;
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

export type StaffSessionRecord = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: Omit<StaffAuthRecord, 'passwordHash'>;
};

export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStaffByIdentifier(identifier: string): Promise<StaffAuthRecord | null> {
    return this.prisma.user.findUnique({
      where: { email: identifier.toLowerCase() },
      select: {
        id: true,
        email: true,
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

  async createStaffSession(input: CreateStaffSessionInput): Promise<{ id: string }> {
    return this.prisma.staffSession.create({
      data: input,
      select: { id: true },
    });
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

  async revokeStaffSession(tokenHash: string, revokedAt: Date): Promise<number> {
    const result = await this.prisma.staffSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });

    return result.count;
  }
}
