import type { CaseConfidentialityLevel, CaseLifecycleStatus, CaseType, ComplaintSeverity, ComplaintStatus } from '@prisma/client';

export type DataSourceDto = 'LOCAL' | 'MANUAL' | 'DMS';

export type ComplaintQueueItemDto = {
  id: string;
  referenceNumber: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  branchId: string;
  branchName: string;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComplaintQueueResponseDto = {
  items: ComplaintQueueItemDto[];
};

export type ComplaintSearchItemDto = ComplaintQueueItemDto & {
  categoryId: string;
  customerName: string;
  customerPhone: string;
  customerIdentifier: string | null;
};

export type ComplaintSearchResponseDto = {
  items: ComplaintSearchItemDto[];
  limit: number;
  offset: number;
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

export type ComplaintCaseSummaryDto = {
  id: string;
  type: CaseType;
  status: ComplaintStatus;
  lifecycleStatus: CaseLifecycleStatus;
  confidentialityLevel: CaseConfidentialityLevel;
  branchId: string;
  branchName: string;
  ownerId: string | null;
  ownerName: string | null;
};

export type ComplaintDetailDto = ComplaintQueueItemDto & {
  description: string;
  incidentAt: string | null;
  customerSource: DataSourceDto;
  manualCustomer: boolean;
  vehicleRelated: boolean;
  vehicleSource: DataSourceDto | null;
  manualVehicle: boolean;
  vehicleDataUnavailableReason: string | null;
  statusHistory: ComplaintStatusTimelineItemDto[];
  caseSummary: ComplaintCaseSummaryDto | null;
};

export type ComplaintDetailResponseDto = {
  complaint: ComplaintDetailDto;
};

export type ComplaintRelatedResponseDto = {
  items: ComplaintQueueItemDto[];
};

export type ComplaintDuplicateCandidatesResponseDto = {
  items: ComplaintQueueItemDto[];
  windowDays: number;
};

export type ComplaintRelationMutationResponseDto = {
  relation: {
    sourceComplaintId: string;
    targetComplaintId: string;
    changed: boolean;
  };
};
