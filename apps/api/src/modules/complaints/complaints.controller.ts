import { Controller } from '@nestjs/common';
import { ComplaintsService } from './complaints.service.js';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}
}
