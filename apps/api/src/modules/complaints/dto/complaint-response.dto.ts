import type { ComplaintSeverity, ComplaintStatus } from '@prisma/client';

export type ComplaintQueueItemDto = {
  id: string;
  referenceNumber: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  branchId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComplaintQueueResponseDto = {
  items: ComplaintQueueItemDto[];
};

export type ComplaintStatusTimelineItemDto = {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: string | null;
  actorId: string | null;
  actorRole: string | null;
  requestSource: string | null;
  reason: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type ComplaintDetailDto = ComplaintQueueItemDto & {
  description: string;
  incidentAt: string | null;
  statusHistory: ComplaintStatusTimelineItemDto[];
};

export type ComplaintDetailResponseDto = {
  complaint: ComplaintDetailDto;
};
