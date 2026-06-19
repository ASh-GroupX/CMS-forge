import { Controller } from '@nestjs/common';
import { SlaService } from './sla.service.js';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}
}
