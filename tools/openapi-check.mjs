import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const file = 'packages/contracts/openapi.json';
const canonical = {
  openapi: '3.1.0',
  info: {
    title: 'CMS-Auto API',
    version: '0.1.0',
  },
  paths: {},
  components: {
    schemas: {
      ErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { $ref: '#/components/schemas/ErrorBody' },
        },
        additionalProperties: false,
      },
      ErrorBody: {
        type: 'object',
        required: ['code', 'message', 'correlationId'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          correlationId: { type: 'string' },
          fieldErrors: {
            type: 'array',
            items: { $ref: '#/components/schemas/FieldError' },
          },
        },
        additionalProperties: false,
      },
      FieldError: {
        type: 'object',
        required: ['field', 'code', 'message'],
        properties: {
          field: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
};

export function canonicalOpenApiText() {
  return `${JSON.stringify(canonical, null, 2)}\n`;
}

export function checkOpenApiText(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    return [`OpenAPI document must be valid JSON (${error.message})`];
  }

  const errors = [];

  if (document.openapi !== '3.1.0') {
    errors.push('OpenAPI document must use version 3.1.0');
  }

  if (document.info?.title !== 'CMS-Auto API' || typeof document.info.version !== 'string') {
    errors.push('OpenAPI document must include CMS-Auto API info');
  }

  if (!document.paths || typeof document.paths !== 'object' || Array.isArray(document.paths)) {
    errors.push('OpenAPI document must include a paths object');
  }

  for (const schema of ['ErrorEnvelope', 'ErrorBody', 'FieldError']) {
    if (!document.components?.schemas?.[schema]) {
      errors.push(`OpenAPI document missing ${schema} schema`);
    }
  }

  if (text !== canonicalOpenApiText()) {
    errors.push('OpenAPI document is not canonical; run corepack pnpm openapi:generate');
  }

  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--write')) {
    writeFileSync(file, canonicalOpenApiText());
    console.log('OpenAPI scaffold generated');
  } else {
    const errors = checkOpenApiText(readFileSync(file, 'utf8'));
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    console.log('OpenAPI scaffold check passed');
  }
}
