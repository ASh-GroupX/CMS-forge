import type { CommunicationGroupVisibility } from '@prisma/client';

export type CommunicationGroupMemberDto = {
  userId: string;
  displayName: string;
  displayNameAr: string;
  roleCode: string;
  roleName: string;
  roleNameAr: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentNameAr: string | null;
  branchId: string | null;
  branchName: string | null;
  branchNameAr: string | null;
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

export type CommunicationEligibleMemberDto = CommunicationGroupMemberDto;
export type CommunicationGroupsResponseDto = { items: CommunicationGroupDto[]; eligibleMembers: CommunicationEligibleMemberDto[]; canManageShared: boolean };
