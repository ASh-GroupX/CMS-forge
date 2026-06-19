import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

type AttachmentClient = Pick<Prisma.TransactionClient, 'attachment'>;

const attachmentSelect = {
  id: true,
  complaintId: true,
  uploadedById: true,
  storageKey: true,
  fileName: true,
  contentType: true,
  sizeBytes: true,
  scanStatus: true,
  customerVisible: true,
  createdAt: true,
} satisfies Prisma.AttachmentSelect;

export type AttachmentRecord = Prisma.AttachmentGetPayload<{ select: typeof attachmentSelect }>;

export type CreateAttachmentMetadataData = {
  complaintId: string;
  uploadedById?: string | null;
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  customerVisible?: boolean;
};

export type UpdateAttachmentScanStatusData = {
  id: string;
  toStatus: 'CLEAN' | 'REJECTED';
};

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService = {} as PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work as (client: Prisma.TransactionClient) => Promise<T>);
  }

  async createMetadata(data: CreateAttachmentMetadataData, client: AttachmentClient = this.prisma): Promise<AttachmentRecord> {
    return client.attachment.create({
      data: {
        complaintId: data.complaintId,
        uploadedById: data.uploadedById ?? null,
        storageKey: data.storageKey,
        fileName: data.fileName,
        contentType: data.contentType,
        sizeBytes: data.sizeBytes,
        customerVisible: data.customerVisible ?? false,
      },
      select: attachmentSelect,
    });
  }

  async findMetadata(id: string, client: AttachmentClient = this.prisma): Promise<AttachmentRecord | null> {
    return client.attachment.findUnique({ where: { id }, select: attachmentSelect });
  }

  async updateScanStatus(data: UpdateAttachmentScanStatusData, client: AttachmentClient = this.prisma): Promise<AttachmentRecord | null> {
    const updated = await client.attachment.updateMany({
      where: { id: data.id, scanStatus: 'PENDING' },
      data: { scanStatus: data.toStatus },
    });
    return updated.count === 0 ? null : this.findMetadata(data.id, client);
  }
}
