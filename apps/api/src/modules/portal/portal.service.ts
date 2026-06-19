import { Injectable } from '@nestjs/common';
import { ComplaintTransitionRequestSource } from '@prisma/client';
import { ComplaintsService } from '../complaints/complaints.service.js';
import type { ComplaintCreationResult, CreateInternalComplaintInput } from '../complaints/complaints.service.js';

export type SubmitPortalComplaintInput = Omit<CreateInternalComplaintInput, 'actorId' | 'requestSource'>;

@Injectable()
export class PortalService {
  constructor(private readonly complaintsService: ComplaintsService) {}

  async submitComplaint(input: SubmitPortalComplaintInput): Promise<ComplaintCreationResult> {
    return this.complaintsService.createInternal({
      ...input,
      actorId: null,
      requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
    });
  }
}
