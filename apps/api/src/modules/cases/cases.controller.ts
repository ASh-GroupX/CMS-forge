import { Controller } from '@nestjs/common';
import { CasesService } from './cases.service.js';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}
}
