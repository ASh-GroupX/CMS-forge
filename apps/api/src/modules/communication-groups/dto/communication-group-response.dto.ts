import type { CommunicationGroupVisibility } from '@prisma/client';

export type CommunicationGroupMemberDto = {
  userId: string;
  displayName: string;
  displayNameAr: string;
};

export type CommunicationGroupDto = {
  id: string;
  name: string;
  visibility: CommunicationGroupVisibility;
  ownerId: string;
  members: CommunicationGroupMemberDto[];
  createdAt: string;
  updatedAt: string;
};

export type CommunicationEligibleMemberDto = { userId: string; displayName: string; displayNameAr: string };
export type CommunicationGroupsResponseDto = { items: CommunicationGroupDto[]; eligibleMembers: CommunicationEligibleMemberDto[]; canManageShared: boolean };
