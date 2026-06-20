import type { DealStageCode } from '../deals.service.js';

export type DealBoardItemDto = {
  id: string;
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string;
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
  count: number;
};

export type DealHandoffBoardResponseDto = {
  byStage: DealStageBucketDto[];
  stuck: DealBoardItemDto[];
  currentHolder: DealHolderBucketDto[];
};
