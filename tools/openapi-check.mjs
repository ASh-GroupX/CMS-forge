import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const file = 'packages/contracts/openapi.json';
const eventTypes = ['AUTH', 'USER_ADMIN', 'COMPLAINT', 'WORKFLOW', 'COMMENT', 'ATTACHMENT', 'SLA', 'NOTIFICATION', 'REPORT', 'CONFIG', 'SECURITY'];
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const error = (description) => ({ description, ...json(ref('ErrorEnvelope')) });
const ok = (description, schema, headers) => ({ description, ...(headers ? { headers } : {}), ...json(schema) });
const cookie = (description) => ({ 'Set-Cookie': { schema: { type: 'string' }, description } });
const param = (name, schema = { type: 'string' }) => ({ name, in: 'query', required: false, schema });

const canonical = {
  openapi: '3.1.0',
  info: { title: 'CMS-Auto API', version: '0.1.0' },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        operationId: 'authLogin',
        summary: 'Log in a staff user',
        requestBody: { required: true, ...json(ref('AuthLoginRequest')) },
        responses: {
          200: ok('Staff session created', ref('AuthLoginResponse'), cookie('HttpOnly staff session cookie')),
          400: error('Invalid request body'),
          401: error('Invalid credentials'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'authLogout',
        summary: 'Log out the active staff session',
        responses: {
          200: ok('Staff session invalidated', ref('AuthLogoutResponse'), cookie('Expired HttpOnly staff session cookie')),
          401: error('Invalid session'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        operationId: 'authMe',
        summary: 'Return the authenticated staff principal',
        parameters: [param('branchId')],
        responses: {
          200: ok('Authenticated staff principal', ref('AuthMeResponse')),
          401: error('Missing or invalid session'),
          403: error('Role or branch scope denied'),
        },
      },
    },
    '/audit/logs': {
      get: {
        tags: ['Audit'],
        operationId: 'auditLogSearch',
        summary: 'Search audit log entries',
        parameters: [
          param('eventType', { type: 'string', enum: eventTypes }),
          ...['actorId', 'targetType', 'targetId', 'branchId', 'correlationId'].map((name) => param(name)),
          param('from', { type: 'string', format: 'date-time' }),
          param('to', { type: 'string', format: 'date-time' }),
          param('page', { type: 'integer', minimum: 1 }),
          param('pageSize', { type: 'integer', minimum: 1, maximum: 100 }),
        ],
        responses: {
          200: ok('Audit log search results', ref('AuditLogSearchResponse')),
          400: error('Invalid query'),
          401: error('Missing or invalid session'),
          403: error('Role or branch scope denied'),
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorEnvelope: object(['error'], { error: ref('ErrorBody') }),
      ErrorBody: object(['code', 'message', 'correlationId'], {
        code: { type: 'string' },
        message: { type: 'string' },
        correlationId: { type: 'string' },
        fieldErrors: { type: 'array', items: ref('FieldError') },
      }),
      FieldError: object(['field', 'code', 'message'], {
        field: { type: 'string' },
        code: { type: 'string' },
        message: { type: 'string' },
      }),
      AuthLoginRequest: object(['identifier', 'password'], {
        identifier: { type: 'string', minLength: 1 },
        password: { type: 'string', minLength: 1 },
      }),
      StaffAuthClaims: object(['userId', 'email', 'nameEn', 'nameAr', 'roleCode', 'branchId'], {
        userId: { type: 'string' },
        email: { type: 'string', format: 'email' },
        nameEn: { type: 'string' },
        nameAr: { type: 'string' },
        roleCode: { type: 'string' },
        branchId: { type: ['string', 'null'] },
      }),
      AuthLoginResponse: object(['user', 'expiresAt'], {
        user: ref('StaffAuthClaims'),
        expiresAt: { type: 'string', format: 'date-time' },
      }),
      AuthLogoutResponse: object(['ok'], { ok: { const: true } }),
      AuthMeResponse: object(['user'], { user: ref('StaffAuthClaims') }),
      AuditLogEntry: object([
        'id',
        'eventType',
        'action',
        'actorId',
        'branchId',
        'targetType',
        'targetId',
        'correlationId',
        'ipAddress',
        'userAgent',
        'metadata',
        'createdAt',
      ], {
        id: { type: 'string' },
        eventType: { type: 'string', enum: eventTypes },
        action: { type: 'string' },
        actorId: { type: ['string', 'null'] },
        branchId: { type: ['string', 'null'] },
        targetType: { type: 'string' },
        targetId: { type: ['string', 'null'] },
        correlationId: { type: ['string', 'null'] },
        ipAddress: { type: ['string', 'null'] },
        userAgent: { type: ['string', 'null'] },
        metadata: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
      }),
      AuditLogSearchResponse: object(['items', 'page', 'pageSize'], {
        items: { type: 'array', items: ref('AuditLogEntry') },
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1, maximum: 100 },
      }),
    },
  },
};

function object(required, properties) {
  return { type: 'object', required, properties, additionalProperties: false };
}

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

  for (const [path, method] of [['/auth/login', 'post'], ['/auth/logout', 'post'], ['/auth/me', 'get'], ['/audit/logs', 'get']]) {
    if (!document.paths?.[path]?.[method]) {
      errors.push(`OpenAPI document missing ${path} ${method} operation`);
    }
  }

  for (const schema of ['ErrorEnvelope', 'ErrorBody', 'FieldError', 'AuthLoginRequest', 'AuthLoginResponse', 'AuthLogoutResponse', 'AuthMeResponse', 'StaffAuthClaims', 'AuditLogEntry', 'AuditLogSearchResponse']) {
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
