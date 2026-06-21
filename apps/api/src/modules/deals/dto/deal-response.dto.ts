import type { DealStageCode } from '../deals.service.js';

export type DealBoardItemDto = {
  id: string;
  title: string;
  branchId: string;
  branchName: string | null;
  ownerId: string;
  ownerName: string | null;
  currentHolderId: string;
  currentHolderName: string | null;
  stage: DealStageCode;
  stageDueAt: string;
  blocker: string | null;
  delayAgeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type DealStageBucketDto = {
  stage: DealStageCode;
  count: number;
  deals: DealBoardItemDto[];
};

export type DealHolderBucketDto = {
  currentHolderId: string;
  currentHolderName: string | null;
  count: number;
};

export type DealWriteResponseDto = {
  deal: Omit<DealBoardItemDto, 'delayAgeMinutes'>;
};

export type DealAdvanceResponseDto = DealWriteResponseDto & {
  taskId: string;
};

export type DealHandoffBoardResponseDto = {
  byStage: DealStageBucketDto[];
  stuck: DealBoardItemDto[];
  currentHolder: DealHolderBucketDto[];
};
