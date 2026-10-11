import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../core/http-kernel.js';

export type TemplateFieldDto = {
  id: string;
  label: string;
  type: 'text' | 'long_text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[] | undefined; // for dropdown/radio
  section?: string | undefined;
  helpText?: string | undefined;
};

export type CreateComplaintTemplateDto = {
  name: string;
  description?: string | undefined;
  isActive?: boolean | undefined;
  schema: TemplateFieldDto[];
};

export type UpdateComplaintTemplateDto = Partial<CreateComplaintTemplateDto>;

export type ComplaintTemplateResponseDto = {
  id: string;
  departmentId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  schema: any; // Prisma Json
  createdAt: Date;
  updatedAt: Date;
};

export function parseCreateComplaintTemplateBody(body: unknown): CreateComplaintTemplateDto {
  const input = objectBody(body);
  return {
    name: requiredText(input.name, 'name'),
    description: optionalText(input.description, 'description') ?? undefined,
    isActive: typeof input.isActive === 'boolean' ? input.isActive : true,
    schema: parseSchemaArray(input.schema),
  };
}

export function parseUpdateComplaintTemplateBody(body: unknown): UpdateComplaintTemplateDto {
  const input = objectBody(body);
  return {
    name: optionalText(input.name, 'name') ?? undefined,
    description: optionalText(input.description, 'description') ?? undefined,
    isActive: typeof input.isActive === 'boolean' ? input.isActive : undefined,
    schema: input.schema !== undefined ? parseSchemaArray(input.schema) : undefined,
  } as UpdateComplaintTemplateDto;
}

function parseSchemaArray(schema: unknown): TemplateFieldDto[] {
  if (!Array.isArray(schema)) throw invalid('schema', 'Schema must be an array of fields.');
  return schema.map((field, index) => {
    const f = objectBody(field);
    const type = enumValue(f.type, ['text', 'long_text', 'number', 'date', 'dropdown', 'checkbox', 'radio'], `schema[${index}].type`);
    return {
      id: requiredText(f.id, `schema[${index}].id`),
      label: requiredText(f.label, `schema[${index}].label`),
      type: type as TemplateFieldDto['type'],
      required: typeof f.required === 'boolean' ? f.required : false,
      options: Array.isArray(f.options) ? f.options.map(o => String(o)) : undefined,
      section: optionalText(f.section, `schema[${index}].section`) ?? undefined,
      helpText: optionalText(f.helpText, `schema[${index}].helpText`) ?? undefined,
    };
  });
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('body', 'Request body must be an object.');
  }
  return body as Record<string, unknown>;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalid(field, `${field} is required.`);
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return requiredText(value, field);
}

function enumValue(value: unknown, options: readonly string[], field: string): string {
  if (typeof value === 'string' && options.includes(value)) {
    return value;
  }
  throw invalid(field, `${field} is invalid. Allowed: ${options.join(', ')}`);
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid template request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}
