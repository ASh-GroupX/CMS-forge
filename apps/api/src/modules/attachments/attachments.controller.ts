import { Controller } from '@nestjs/common';
import { AttachmentsService } from './attachments.service.js';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}
}
