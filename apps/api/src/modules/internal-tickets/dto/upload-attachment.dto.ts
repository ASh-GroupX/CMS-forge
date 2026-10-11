import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class UploadTicketAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsString()
  @IsNotEmpty()
  contentBase64: string;
}
