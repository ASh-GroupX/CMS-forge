import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const file = 'packages/contracts/openapi.json';
const canonical = {
  openapi: '3.1.0',
  info: {
    title: 'CMS-Auto API',
    version: '0.1.0',
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        operationId: 'authLogin',
        summary: 'Log in a staff user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Staff session created',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string' },
                description: 'HttpOnly staff session cookie',
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLoginResponse' },
              },
            },
          },
          400: {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'authLogout',
        summary: 'Log out the active staff session',
        responses: {
          200: {
            description: 'Staff session invalidated',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string' },
                description: 'Expired HttpOnly staff session cookie',
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLogoutResponse' },
              },
            },
          },
          401: {
            description: 'Invalid session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        operationId: 'authMe',
        summary: 'Return the authenticated staff principal',
        parameters: [
          {
            name: 'branchId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Optional branch scope to authorize against the server session',
          },
        ],
        responses: {
          200: {
            description: 'Authenticated staff principal',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthMeResponse' },
              },
            },
          },
          401: {
            description: 'Missing or invalid session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          403: {
            description: 'Role or branch scope denied',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
  },
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
      AuthLoginRequest: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
      StaffAuthClaims: {
        type: 'object',
        required: ['userId', 'email', 'nameEn', 'nameAr', 'roleCode', 'branchId'],
        properties: {
          userId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          nameEn: { type: 'string' },
          nameAr: { type: 'string' },
          roleCode: { type: 'string' },
          branchId: { type: ['string', 'null'] },
        },
        additionalProperties: false,
      },
      AuthLoginResponse: {
        type: 'object',
        required: ['user', 'expiresAt'],
        properties: {
          user: { $ref: '#/components/schemas/StaffAuthClaims' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AuthLogoutResponse: {
        type: 'object',
        required: ['ok'],
        properties: {
          ok: { const: true },
        },
        additionalProperties: false,
      },
      AuthMeResponse: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/StaffAuthClaims' },
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

  for (const path of ['/auth/login', '/auth/logout', '/auth/me']) {
    const method = path === '/auth/me' ? 'get' : 'post';
    if (!document.paths?.[path]?.[method]) {
      errors.push(`OpenAPI document missing ${path} ${method} operation`);
    }
  }

  for (const schema of ['AuthLoginRequest', 'AuthLoginResponse', 'AuthLogoutResponse', 'AuthMeResponse', 'StaffAuthClaims']) {
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
