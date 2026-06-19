import { Injectable } from '@nestjs/common';
import { AttachmentsRepository } from './attachments.repository.js';

@Injectable()
export class AttachmentsService {
  constructor(private readonly attachmentsRepository: AttachmentsRepository) {}
}
