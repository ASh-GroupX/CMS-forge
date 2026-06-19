import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository.js';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}
}
