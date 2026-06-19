import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const file = 'packages/contracts/openapi.json';
const eventTypes = ['AUTH', 'USER_ADMIN', 'COMPLAINT', 'WORKFLOW', 'COMMENT', 'ATTACHMENT', 'SLA', 'NOTIFICATION', 'REPORT', 'CONFIG', 'SECURITY'];
const complaintStatuses = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED'];
const complaintTransitionActions = ['SUBMIT', 'ACCEPT_INTAKE', 'REJECT_AS_INVALID', 'APPROVE_AND_ROUTE', 'SEND_BACK', 'ASSIGN_INVESTIGATION', 'RESOLVE_DIRECTLY', 'REJECT_AFTER_REVIEW', 'ADD_INVESTIGATION_UPDATE', 'RESOLVE', 'REJECT_AFTER_INVESTIGATION', 'CLOSE', 'REJECT_RESOLUTION', 'REOPEN', 'ROUTE_AGAIN'];
const complaintSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const roleCodes = ['CR_OFFICER', 'CR_MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'MGMT_READONLY', 'CUSTOMER_PORTAL'];
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const body = (schema) => ({ required: true, ...json(schema) });
const error = (description) => ({ description, ...json(ref('ErrorEnvelope')) });
const ok = (description, schema, headers) => ({ description, ...(headers ? { headers } : {}), ...json(schema) });
const cookie = (description) => ({ 'Set-Cookie': { schema: { type: 'string' }, description } });
const attachment = (filename) => ({ 'Content-Disposition': { schema: { type: 'string' }, description: `attachment; filename="${filename}"` } });
const param = (name, schema = { type: 'string' }) => ({ name, in: 'query', required: false, schema });
const pathParam = (name) => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const str = { type: 'string' };
const text = { type: 'string', minLength: 1 };
const nullText = { type: ['string', 'null'], minLength: 1 };
const auditParams = [
  param('eventType', { type: 'string', enum: eventTypes }),
  ...['actorId', 'targetType', 'targetId', 'branchId', 'correlationId'].map((name) => param(name)),
  param('from', { type: 'string', format: 'date-time' }),
  param('to', { type: 'string', format: 'date-time' }),
];

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
          200: ok('Staff session created', ref('AuthLoginResponse'), cookie('HttpOnly staff session cookie and readable CSRF cookie')),
          400: error('Invalid request body'),
          401: error('Invalid credentials'),
          429: error('Rate limit exceeded (RATE_LIMITED)'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'authLogout',
        summary: 'Log out the active staff session',
        responses: {
          200: ok('Staff session invalidated', ref('AuthLogoutResponse'), cookie('Expired staff session and CSRF cookies')),
          401: error('Invalid session'),
          403: error('Invalid CSRF token (CSRF_INVALID)'),
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
    '/branches': {
      get: {
        tags: ['Branches'],
        operationId: 'branchList',
        summary: 'List active branches',
        responses: {
          200: ok('Active branches', ref('BranchListResponse')),
          401: error('Missing or invalid session'),
          403: error('Role denied'),
        },
      },
      post: {
        tags: ['Branches'],
        operationId: 'branchCreate',
        summary: 'Create a branch',
        requestBody: body(ref('BranchCreateRequest')),
        responses: { 201: ok('Branch created', ref('BranchWriteResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') },
      },
    },
    '/branches/{idOrCode}': {
      get: {
        tags: ['Branches'],
        operationId: 'branchGet',
        summary: 'Get one branch by id or code',
        parameters: [pathParam('idOrCode')],
        responses: {
          200: ok('Branch lookup result', ref('BranchGetResponse')),
          401: error('Missing or invalid session'),
          403: error('Role denied'),
        },
      },
      patch: {
        tags: ['Branches'],
        operationId: 'branchUpdate',
        summary: 'Update a branch',
        parameters: [pathParam('idOrCode')],
        requestBody: body(ref('BranchUpdateRequest')),
        responses: { 200: ok('Branch updated', ref('BranchWriteResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') },
      },
    },
    '/branches/{id}/deactivate': {
      post: {
        tags: ['Branches'],
        operationId: 'branchDeactivate',
        summary: 'Deactivate a branch',
        parameters: [pathParam('id')],
        responses: { 200: ok('Branch deactivated', ref('BranchWriteResponse')), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') },
      },
    },
    '/complaints/{id}/transitions': {
      post: {
        tags: ['Complaints'],
        operationId: 'complaintTransitionCreate',
        summary: 'Apply a staff complaint workflow transition',
        parameters: [pathParam('id'), param('branchId')],
        requestBody: body(ref('ComplaintTransitionRequest')),
        responses: {
          201: ok('Complaint transition applied', ref('ComplaintTransitionResponse')),
          400: error('Invalid request body'),
          401: error('Missing or invalid session'),
          403: error('Role, branch scope, or CSRF denied'),
          409: error('Complaint transition not allowed (COMPLAINT_INVALID_TRANSITION)'),
        },
      },
    },
    '/complaints/{id}': { get: {
      tags: ['Complaints'], operationId: 'complaintDetailGet', summary: 'Get staff complaint detail',
      parameters: [pathParam('id'), param('branchId')],
      responses: { 200: ok('Complaint detail', ref('ComplaintDetailResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') },
    } },
    '/complaints/{id}/comments': { post: { tags: ['Complaints'], operationId: 'complaintCommentCreate', summary: 'Create a staff complaint comment', parameters: [pathParam('id'), param('branchId')], requestBody: body(ref('ComplaintCommentRequest')), responses: { 201: ok('Comment created', ref('ComplaintCommentResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role, branch scope, or CSRF denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') } } },
    '/complaints/{id}/comments/public': { get: { tags: ['Complaints'], operationId: 'complaintPublicCommentList', summary: 'List public complaint comments', parameters: [pathParam('id'), param('branchId')], responses: { 200: ok('Public comments', ref('ComplaintPublicCommentsResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') } } },
    '/complaints': {
      get: {
        tags: ['Complaints'],
        operationId: 'complaintQueueList',
        summary: 'List staff complaint queue items',
        parameters: [param('branchId')],
        responses: { 200: ok('Complaint queue items', ref('ComplaintQueueResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied') },
      },
      post: {
        tags: ['Complaints'],
        operationId: 'complaintCreate',
        summary: 'Create a staff complaint',
        parameters: [{ name: 'branchId', in: 'query', required: true, schema: { type: 'string' } }],
        requestBody: body(ref('ComplaintCreateRequest')),
        responses: { 201: ok('Complaint created', ref('ComplaintCreateResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role, branch scope, or CSRF denied') },
      },
    },
    '/audit/logs': {
      get: {
        tags: ['Audit'],
        operationId: 'auditLogSearch',
        summary: 'Search audit log entries',
        parameters: [
          ...auditParams,
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
    '/audit/logs/export': {
      get: {
        tags: ['Audit'],
        operationId: 'auditLogExport',
        summary: 'Export audit log entries',
        parameters: auditParams,
        responses: {
          200: ok('Audit log export file', ref('AuditLogExportResponse'), attachment('audit-logs.json')),
          400: error('Invalid query'),
          401: error('Missing or invalid session'),
          403: error('Role denied'),
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorEnvelope: object(['error'], { error: ref('ErrorBody') }),
      ErrorBody: object(['code', 'message', 'correlationId'], { code: { type: 'string' }, message: { type: 'string' }, correlationId: { type: 'string' }, fieldErrors: { type: 'array', items: ref('FieldError') } }),
      FieldError: object(['field', 'code', 'message'], { field: { type: 'string' }, code: { type: 'string' }, message: { type: 'string' } }),
      AuthLoginRequest: object(['identifier', 'password'], { identifier: text, password: text }),
      StaffAuthClaims: object(['userId', 'email', 'nameEn', 'nameAr', 'roleCode', 'branchId'], {
        userId: str,
        email: { type: 'string', format: 'email' },
        nameEn: str,
        nameAr: str,
        roleCode: str,
        branchId: { type: ['string', 'null'] },
      }),
      AuthLoginResponse: object(['user', 'expiresAt'], { user: ref('StaffAuthClaims'), expiresAt: { type: 'string', format: 'date-time' } }),
      AuthLogoutResponse: object(['ok'], { ok: { const: true } }),
      AuthMeResponse: object(['user'], { user: ref('StaffAuthClaims') }),
      Branch: object(['id', 'code', 'nameEn', 'nameAr', 'timezone', 'isActive', 'createdAt', 'updatedAt'], {
        id: str,
        code: str,
        nameEn: str,
        nameAr: str,
        timezone: str,
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      }),
      BranchListResponse: object(['items'], { items: { type: 'array', items: ref('Branch') } }),
      BranchGetResponse: object(['branch'], { branch: { oneOf: [ref('Branch'), { type: 'null' }] } }),
      BranchWriteResponse: object(['branch'], { branch: ref('Branch') }),
      BranchCreateRequest: object(['code', 'nameEn', 'nameAr'], { code: text, nameEn: text, nameAr: text, timezone: text }),
      BranchUpdateRequest: object([], { code: text, nameEn: text, nameAr: text, timezone: text }),
      ComplaintCreateRequest: object(['customerName', 'categoryId', 'subcategoryId', 'description', 'incidentAt', 'subject', 'severity'], { customerName: text, customerPhone: nullText, customerNumber: nullText, categoryId: text, subcategoryId: text, description: text, incidentAt: { type: 'string', format: 'date-time' }, subject: text, severity: { type: 'string', enum: complaintSeverities }, vehicleRelated: { type: 'boolean' }, vehicleVin: nullText, vehicleId: nullText }),
      ComplaintCreateResponse: object(['complaint'], { complaint: object(['id', 'referenceNumber', 'status'], { id: str, referenceNumber: str, status: { type: 'string', enum: complaintStatuses } }) }),
      ComplaintQueueItem: object(['id', 'referenceNumber', 'status', 'severity', 'subject', 'branchId', 'ownerId', 'createdAt', 'updatedAt'], { id: str, referenceNumber: str, status: { type: 'string', enum: complaintStatuses }, severity: { type: 'string', enum: complaintSeverities }, subject: str, branchId: str, ownerId: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }),
      ComplaintQueueResponse: object(['items'], { items: { type: 'array', items: ref('ComplaintQueueItem') } }),
      ComplaintStatusTimelineItem: object(['id', 'fromStatus', 'toStatus', 'action', 'actorId', 'actorRole', 'requestSource', 'reason', 'correlationId', 'createdAt'], { id: str, fromStatus: { type: ['string', 'null'], enum: [...complaintStatuses, null] }, toStatus: { type: 'string', enum: complaintStatuses }, action: { type: ['string', 'null'], enum: [...complaintTransitionActions, null] }, actorId: { type: ['string', 'null'] }, actorRole: { type: ['string', 'null'], enum: [...roleCodes, null] }, requestSource: { type: ['string', 'null'] }, reason: { type: ['string', 'null'] }, correlationId: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' } }),
      ComplaintDetailResponse: object(['complaint'], { complaint: { allOf: [ref('ComplaintQueueItem'), object(['description', 'incidentAt', 'statusHistory'], { description: str, incidentAt: { type: ['string', 'null'], format: 'date-time' }, statusHistory: { type: 'array', items: ref('ComplaintStatusTimelineItem') } })] } }),
      ComplaintCommentRequest: object(['body', 'visibility'], { body: text, visibility: { type: 'string', enum: ['INTERNAL', 'PUBLIC'] } }),
      ComplaintComment: object(['id', 'complaintId', 'authorId', 'body', 'visibility', 'createdAt'], { id: str, complaintId: str, authorId: { type: ['string', 'null'] }, body: str, visibility: { type: 'string', enum: ['INTERNAL', 'PUBLIC'] }, createdAt: { type: 'string', format: 'date-time' } }),
      ComplaintCommentResponse: object(['comment'], { comment: ref('ComplaintComment') }),
      ComplaintPublicCommentsResponse: object(['items'], { items: { type: 'array', items: ref('ComplaintComment') } }),
      ComplaintTransitionRequest: object(['fromStatus', 'action'], { fromStatus: { type: 'string', enum: complaintStatuses }, action: { type: 'string', enum: complaintTransitionActions }, reason: { type: ['string', 'null'], minLength: 1 }, resolutionType: { type: ['string', 'null'], minLength: 1 }, resolutionSummary: { type: ['string', 'null'], minLength: 1 }, customerCommunicationStatus: { type: ['string', 'null'], minLength: 1 } }),
      ComplaintTransition: object(['complaintId', 'fromStatus', 'action', 'actorRole', 'toStatus'], {
        complaintId: str,
        fromStatus: { type: 'string', enum: complaintStatuses },
        action: { type: 'string', enum: complaintTransitionActions },
        actorRole: { type: 'string', enum: roleCodes },
        toStatus: { type: 'string', enum: complaintStatuses },
      }),
      ComplaintTransitionResponse: object(['transition'], { transition: ref('ComplaintTransition') }),
      AuditLogEntry: object(['id', 'eventType', 'action', 'actorId', 'branchId', 'targetType', 'targetId', 'correlationId', 'ipAddress', 'userAgent', 'metadata', 'createdAt'], { id: str, eventType: { type: 'string', enum: eventTypes }, action: str, actorId: { type: ['string', 'null'] }, branchId: { type: ['string', 'null'] }, targetType: str, targetId: { type: ['string', 'null'] }, correlationId: { type: ['string', 'null'] }, ipAddress: { type: ['string', 'null'] }, userAgent: { type: ['string', 'null'] }, metadata: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }, createdAt: { type: 'string', format: 'date-time' } }),
      AuditLogSearchResponse: object(['items', 'page', 'pageSize'], { items: { type: 'array', items: ref('AuditLogEntry') }, page: { type: 'integer', minimum: 1 }, pageSize: { type: 'integer', minimum: 1, maximum: 100 } }),
      AuditLogExportResponse: object(['items', 'rowCount', 'rowLimit'], { items: { type: 'array', items: ref('AuditLogEntry') }, rowCount: { type: 'integer', minimum: 0 }, rowLimit: { type: 'integer', minimum: 1 } }),
    },
  },
};

function object(required, properties) { return { type: 'object', required, properties, additionalProperties: false }; }

export const canonicalOpenApiText = () => `${JSON.stringify(canonical, null, 2)}\n`;

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

  for (const [path, method] of [['/auth/login', 'post'], ['/auth/logout', 'post'], ['/auth/me', 'get'], ['/branches', 'get'], ['/branches', 'post'], ['/branches/{idOrCode}', 'get'], ['/branches/{idOrCode}', 'patch'], ['/branches/{id}/deactivate', 'post'], ['/complaints', 'get'], ['/complaints', 'post'], ['/complaints/{id}', 'get'], ['/complaints/{id}/comments', 'post'], ['/complaints/{id}/comments/public', 'get'], ['/complaints/{id}/transitions', 'post'], ['/audit/logs', 'get'], ['/audit/logs/export', 'get']]) {
    if (!document.paths?.[path]?.[method]) errors.push(`OpenAPI document missing ${path} ${method} operation`);
  }

  for (const schema of ['ErrorEnvelope', 'ErrorBody', 'FieldError', 'AuthLoginRequest', 'AuthLoginResponse', 'AuthLogoutResponse', 'AuthMeResponse', 'StaffAuthClaims', 'Branch', 'BranchListResponse', 'BranchGetResponse', 'BranchWriteResponse', 'BranchCreateRequest', 'BranchUpdateRequest', 'ComplaintCreateRequest', 'ComplaintCreateResponse', 'ComplaintQueueItem', 'ComplaintQueueResponse', 'ComplaintStatusTimelineItem', 'ComplaintDetailResponse', 'ComplaintCommentRequest', 'ComplaintComment', 'ComplaintCommentResponse', 'ComplaintPublicCommentsResponse', 'ComplaintTransitionRequest', 'ComplaintTransition', 'ComplaintTransitionResponse', 'AuditLogEntry', 'AuditLogSearchResponse', 'AuditLogExportResponse']) {
    if (!document.components?.schemas?.[schema]) errors.push(`OpenAPI document missing ${schema} schema`);
  }

  if (text !== canonicalOpenApiText()) errors.push('OpenAPI document is not canonical; run corepack pnpm openapi:generate');

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
