import { Injectable } from '@nestjs/common';
import { BranchesRepository } from './branches.repository.js';
import type { BranchRecord } from './branches.repository.js';
import type { BranchResponseDto } from './dto/branch-response.dto.js';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  async listActive(): Promise<BranchResponseDto[]> {
    const branches = await this.branchesRepository.listActive();
    return branches.map(toResponse);
  }

  async findByIdOrCode(idOrCode: string): Promise<BranchResponseDto | null> {
    const branch = await this.branchesRepository.findByIdOrCode(idOrCode);
    return branch ? toResponse(branch) : null;
  }
}

function toResponse(branch: BranchRecord): BranchResponseDto {
  return {
    id: branch.id,
    code: branch.code,
    nameEn: branch.nameEn,
    nameAr: branch.nameAr,
    timezone: branch.timezone,
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}
