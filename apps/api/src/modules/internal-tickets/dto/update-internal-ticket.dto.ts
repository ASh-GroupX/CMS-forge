import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UploadTicketAttachmentDto } from './upload-attachment.dto.js';

export class UpdateInternalTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferTicketDto {
  @IsString()
  @IsNotEmpty()
  targetDepartmentId: string;

  @IsString()
  @IsOptional()
  requestedEmployeeId?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AssignTicketDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;
}

export class WaitTicketDto {
  @IsString()
  @IsNotEmpty()
  waitingReasonId: string;

  @IsString()
  @IsOptional()
  customWaitingReason?: string;
}

export class ResolveTicketDto {
  @IsString()
  @IsNotEmpty()
  resolutionReasonId: string;

  @IsString()
  @IsNotEmpty()
  resolutionDetails: string;
}

export class RateTicketDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectTicketDto {
  @IsString()
  @IsNotEmpty()
  rejectReasonId: string;

  @IsString()
  @IsOptional()
  rejectDetails?: string;
}

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadTicketAttachmentDto)
  @IsOptional()
  attachments?: UploadTicketAttachmentDto[];
}
