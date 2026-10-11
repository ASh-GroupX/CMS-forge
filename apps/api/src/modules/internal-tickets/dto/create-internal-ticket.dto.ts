import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InternalTicketPriority } from '@prisma/client';
import { UploadTicketAttachmentDto } from './upload-attachment.dto.js';

export class CreateInternalTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  targetDepartmentId: string;

  @IsString()
  @IsOptional()
  requestedEmployeeId?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(InternalTicketPriority)
  @IsOptional()
  priority?: InternalTicketPriority;

  @IsString()
  @IsOptional()
  slaOptionId?: string;

  @IsString()
  @IsOptional()
  dueAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadTicketAttachmentDto)
  @IsOptional()
  attachments?: UploadTicketAttachmentDto[];
}
