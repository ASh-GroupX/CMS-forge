import type { CaseConfidentialityLevel, CaseLifecycleStatus, CaseType, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction } from '@prisma/client';

export type DataSourceDto = 'LOCAL' | 'MANUAL' | 'DMS';

export type ComplaintQueueItemDto = {
  id: string;
  referenceNumber: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  branchId: string;
  branchName: string;
  displayTimeZone: string;
  ownerId: string | null;
  ownerName: string | null;
  assignedDepartmentId: string | null;
  assignedDepartmentName: string | null;
  assignedDepartmentNameAr: string | null;
  slaState: 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'CLOSED';
  slaDueAt: string | null;
  slaStage: string | null;
  categoryId: string | null;
  categoryName: string | null;
  slaPercentElapsed: number | null;
  nextAction: string | null;
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

export type ComplaintCustomerDetailDto = {
  id: string;
  name: string;
  phone: string | null;
  identifier: string | null;
  source: DataSourceDto;
};

export type ComplaintVehicleDetailDto = {
  id: string;
  vin: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  source: DataSourceDto;
};

export type ComplaintDetailDto = ComplaintQueueItemDto & {
  categoryId: string;
  categoryName: string;
  categoryNameAr: string;
  description: string;
  descriptionAr?: string | null;
  type?: string;
  templateId?: string | null;
  templateData?: any;
  incidentAt: string | null;
  customer: ComplaintCustomerDetailDto;
  vehicle: ComplaintVehicleDetailDto | null;
  customerSource: DataSourceDto;
  manualCustomer: boolean;
  vehicleRelated: boolean;
  vehicleSource: DataSourceDto | null;
  manualVehicle: boolean;
  vehicleDataUnavailableReason: string | null;
  channel: string | null;
  customerType: string | null;
  lastServiceDate: string | null;
  odometer: number | null;
  warrantyActive: boolean | null;
  salesAdvisorName: string | null;
  rootCauseCategory: string | null;
  repeatCustomer: boolean | null;
  alternativeCarProvided?: boolean;
  backupOfficerId?: string | null;
  backupOfficerName?: string | null;
  collaboratorId?: string | null;
  collaboratorName?: string | null;
  isJustified?: boolean | null;
  satisfactionStatus?: string | null;
  investigationNotes?: string | null;
  investigatedAt?: string | null;
  statusHistory: ComplaintStatusTimelineItemDto[];
  caseSummary: ComplaintCaseSummaryDto | null;
  allowedActions: ComplaintTransitionAction[];
  canDelete?: boolean;
  createdBy: { name: string; nameAr: string } | null;
  createdById?: string | null;
  departmentId?: string | null;
  approvedBy: { name: string; nameAr: string } | null;
  assignedBy: { name: string; nameAr: string; departmentName?: string; departmentNameAr?: string } | null;
};

export type ComplaintDetailResponseDto = {
  complaint: ComplaintDetailDto;
};

export type ComplaintTimelineItemDto = {
  id: string;
  type: 'ASSIGNMENT' | 'ATTACHMENT' | 'CAPA' | 'COMMENT' | 'COMPLAINT_STATUS' | 'NOTIFICATION' | 'PUBLIC_UPDATE' | 'SLA' | 'STATUS' | 'TASK' | 'TASK_COMMENT' | 'TASK_STATUS' | 'WORKFLOW';
  createdAt: string;
  actor: { id: string | null; name: string | null; role: string | null } | null;
  visibility: 'INTERNAL' | 'PUBLIC' | 'SYSTEM';
  customerVisible: boolean;
  summary: string;
  body?: string | null;
  related?: { type: string; id: string; label?: string | null } | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ComplaintTimelineResponseDto = {
  items: ComplaintTimelineItemDto[];
};

export type ComplaintRelationItemDto = {
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
  customerName: string;
};

export type ComplaintRelatedResponseDto = {
  items: ComplaintRelationItemDto[];
};

export type ComplaintDuplicateCandidatesResponseDto = {
  items: ComplaintRelationItemDto[];
  windowDays: number;
};

export type ComplaintRelationMutationResponseDto = {
  relation: {
    sourceComplaintId: string;
    targetComplaintId: string;
    changed: boolean;
  };
};
