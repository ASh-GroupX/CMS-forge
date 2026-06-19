import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const file = 'packages/contracts/openapi.json';
const eventTypes = ['AUTH', 'USER_ADMIN', 'COMPLAINT', 'WORKFLOW', 'COMMENT', 'ATTACHMENT', 'SLA', 'NOTIFICATION', 'REPORT', 'CONFIG', 'SECURITY'];
const complaintStatuses = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED'];
const complaintTransitionActions = ['SUBMIT', 'ACCEPT_INTAKE', 'REJECT_AS_INVALID', 'APPROVE_AND_ROUTE', 'SEND_BACK', 'ASSIGN_INVESTIGATION', 'RESOLVE_DIRECTLY', 'REJECT_AFTER_REVIEW', 'ADD_INVESTIGATION_UPDATE', 'RESOLVE', 'REJECT_AFTER_INVESTIGATION', 'CLOSE', 'REJECT_RESOLUTION', 'REOPEN', 'ROUTE_AGAIN'];
const complaintSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], roleCodes = ['CR_OFFICER', 'CR_MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'MGMT_READONLY', 'CUSTOMER_PORTAL'], notificationChannels = ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'];
const ref = (name) => ({ $ref: `#/components/schemas/${name}` }), json = (schema) => ({ content: { 'application/json': { schema } } });
const body = (schema) => ({ required: true, ...json(schema) }), error = (description) => ({ description, ...json(ref('ErrorEnvelope')) });
const ok = (description, schema, headers) => ({ description, ...(headers ? { headers } : {}), ...json(schema) }), cookie = (description) => ({ 'Set-Cookie': { schema: { type: 'string' }, description } });
const attachment = (filename) => ({ 'Content-Disposition': { schema: { type: 'string' }, description: `attachment; filename="${filename}"` } }), param = (name, schema = { type: 'string' }) => ({ name, in: 'query', required: false, schema });
const pathParam = (name) => ({ name, in: 'path', required: true, schema: { type: 'string' } });
const str = { type: 'string' }, text = { type: 'string', minLength: 1 }, nullText = { type: ['string', 'null'], minLength: 1 };
const auditParams = [param('eventType', { type: 'string', enum: eventTypes }), ...['actorId', 'targetType', 'targetId', 'branchId', 'correlationId'].map((name) => param(name)), param('from', { type: 'string', format: 'date-time' }), param('to', { type: 'string', format: 'date-time' })];
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
    '/auth/password-reset/request': { post: { tags: ['Auth'], operationId: 'authPasswordResetRequest', summary: 'Request a staff password reset', requestBody: body(ref('AuthPasswordResetRequest')), responses: { 200: ok('Password reset request accepted', ref('AuthPasswordResetResponse')), 400: error('Invalid request body') } } },
    '/auth/password-reset/consume': { post: { tags: ['Auth'], operationId: 'authPasswordResetConsume', summary: 'Consume a staff password reset token', requestBody: body(ref('AuthPasswordResetConsumeRequest')), responses: { 200: ok('Password reset consume result', ref('AuthPasswordResetConsumeResponse')), 400: error('Invalid request body') } } },
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
    '/notifications/templates': {
      get: { tags: ['Notifications'], operationId: 'notificationTemplateList', summary: 'List notification templates', responses: { 200: ok('Notification templates', ref('NotificationTemplateListResponse')), 401: error('Missing or invalid session'), 403: error('Role denied') } },
      post: { tags: ['Notifications'], operationId: 'notificationTemplateCreate', summary: 'Create notification template', requestBody: body(ref('NotificationTemplateCreateRequest')), responses: { 201: ok('Notification template created', ref('NotificationTemplateWriteResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') } },
    },
    '/notifications/templates/{id}': { patch: { tags: ['Notifications'], operationId: 'notificationTemplateUpdate', summary: 'Update notification template', parameters: [pathParam('id')], requestBody: body(ref('NotificationTemplateUpdateRequest')), responses: { 200: ok('Notification template updated', ref('NotificationTemplateWriteResponse')), 400: error('Invalid request body'), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') } } },
    '/notifications/templates/{id}/activate': { post: { tags: ['Notifications'], operationId: 'notificationTemplateActivate', summary: 'Activate notification template', parameters: [pathParam('id')], responses: { 200: ok('Notification template activated', ref('NotificationTemplateWriteResponse')), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') } } },
    '/notifications/templates/{id}/deactivate': { post: { tags: ['Notifications'], operationId: 'notificationTemplateDeactivate', summary: 'Deactivate notification template', parameters: [pathParam('id')], responses: { 200: ok('Notification template deactivated', ref('NotificationTemplateWriteResponse')), 401: error('Missing or invalid session'), 403: error('Role denied or invalid CSRF token (CSRF_INVALID)') } } },
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
    '/complaints/{id}/attachments': { post: { tags: ['Attachments'], operationId: 'complaintAttachmentUpload', summary: 'Upload a staff complaint attachment', parameters: [pathParam('id'), param('branchId')], requestBody: body(ref('AttachmentUploadRequest')), responses: { 201: ok('Attachment uploaded', ref('AttachmentUploadResponse')), 400: error('Invalid attachment request'), 401: error('Missing or invalid session'), 403: error('Role, branch scope, or CSRF denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') } } },
    '/complaints/{id}/attachments/{attachmentId}/download': { get: { tags: ['Attachments'], operationId: 'complaintAttachmentDownloadPrepare', summary: 'Prepare a staff attachment download', parameters: [pathParam('id'), pathParam('attachmentId'), param('branchId')], responses: { 200: ok('Attachment download prepared', ref('AttachmentDownloadResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied'), 404: error('Complaint or attachment not found') } } },
    '/complaints/{id}/comments/public': { get: { tags: ['Complaints'], operationId: 'complaintPublicCommentList', summary: 'List public complaint comments', parameters: [pathParam('id'), param('branchId')], responses: { 200: ok('Public comments', ref('ComplaintPublicCommentsResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') } } },
    '/complaints/{id}/surveys': { get: { tags: ['Surveys'], operationId: 'complaintSurveyList', summary: 'List submitted staff survey results', parameters: [pathParam('id'), param('branchId')], responses: { 200: ok('Submitted survey results', ref('StaffSurveyResultsResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied'), 404: error('Complaint not found (COMPLAINT_NOT_FOUND)') } } },
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
    '/reports/dashboard': { get: { tags: ['Reports'], operationId: 'reportDashboardGet', summary: 'Get scoped operational dashboard summary', parameters: [param('branchId')], responses: { 200: ok('Dashboard summary', ref('ReportDashboardResponse')), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied') } } },
    '/reports': { get: { tags: ['Reports'], operationId: 'reportList', summary: 'Get scoped filtered operational reports', parameters: [param('dateFrom', { type: 'string', format: 'date-time' }), param('dateTo', { type: 'string', format: 'date-time' }), param('branchId'), param('categoryId'), param('severity', { type: 'string', enum: complaintSeverities }), param('ownerId')], responses: { 200: ok('Filtered report rows', ref('ReportListResponse')), 400: error('Invalid query'), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied') } } },
    '/reports/export': { get: { tags: ['Reports'], operationId: 'reportExport', summary: 'Export scoped filtered operational reports', parameters: [param('format', { type: 'string', enum: ['csv', 'excel'] }), param('dateFrom', { type: 'string', format: 'date-time' }), param('dateTo', { type: 'string', format: 'date-time' }), param('branchId'), param('categoryId'), param('severity', { type: 'string', enum: complaintSeverities }), param('ownerId')], responses: { 200: ok('Bounded report export file', { type: 'string' }, attachment('reports.csv')), 400: error('Invalid query'), 401: error('Missing or invalid session'), 403: error('Role or branch scope denied') } } },
    '/portal/complaints': { post: { tags: ['Portal'], operationId: 'portalComplaintCreate', summary: 'Submit a public customer portal complaint', requestBody: body(ref('PortalComplaintRequest')), responses: { 201: ok('Complaint created', ref('ComplaintCreateResponse')), 400: error('Invalid request body'), 429: error('Rate limit exceeded (RATE_LIMITED)') } } },
    '/portal/tracking': { get: { tags: ['Portal'], operationId: 'portalTrackingGet', summary: 'Get verified public complaint tracking status', parameters: [{ name: 'x-portal-session', in: 'header', required: true, schema: { type: 'string', minLength: 1 } }], responses: { 200: ok('Portal tracking status', ref('PortalTrackingResponse')), 400: error('Invalid or expired portal session (PORTAL_VERIFICATION_FAILED)') } } },
    '/portal/tracking/follow-ups': { post: { tags: ['Portal'], operationId: 'portalTrackingFollowUpCreate', summary: 'Create a verified public customer follow-up', parameters: [{ name: 'x-portal-session', in: 'header', required: true, schema: { type: 'string', minLength: 1 } }], requestBody: body(ref('PortalFollowUpRequest')), responses: { 201: ok('Follow-up accepted', ref('PortalFollowUpResponse')), 400: error('Invalid request, expired session, or closed complaint (PORTAL_VERIFICATION_FAILED)') } } },
    '/portal/attachments': { post: { tags: ['Portal'], operationId: 'portalAttachmentUpload', summary: 'Upload a verified portal attachment', parameters: [{ name: 'x-portal-session', in: 'header', required: true, schema: { type: 'string', minLength: 1 } }], requestBody: body(ref('AttachmentUploadRequest')), responses: { 201: ok('Attachment uploaded', ref('AttachmentUploadResponse')), 400: error('Invalid request, expired session, terminal complaint, or invalid attachment (PORTAL_VERIFICATION_FAILED/VALIDATION_FAILED)') } } },
    '/portal/surveys': { post: { tags: ['Portal'], operationId: 'portalSurveySubmit', summary: 'Submit a one-time customer satisfaction survey', requestBody: body(ref('PortalSurveySubmitRequest')), responses: { 201: ok('Survey submitted', ref('PortalSurveySubmitResponse')), 400: error('Invalid, expired, or already submitted survey token (PORTAL_VERIFICATION_FAILED/VALIDATION_FAILED)') } } },
    '/portal/tracking/otp': { post: { tags: ['Portal'], operationId: 'portalTrackingOtpRequest', summary: 'Request a public tracking verification challenge', requestBody: body(ref('PortalOtpRequest')), responses: { 201: ok('Verification request accepted', ref('PortalOtpRequestResponse')), 400: error('Invalid or unmatched verification request (PORTAL_VERIFICATION_FAILED)'), 429: error('Rate limit exceeded (RATE_LIMITED)') } } },
    '/portal/tracking/otp/verify': { post: { tags: ['Portal'], operationId: 'portalTrackingOtpVerify', summary: 'Verify a public tracking challenge and issue a portal session', requestBody: body(ref('PortalOtpVerifyRequest')), responses: { 201: ok('Portal session issued', ref('PortalSessionResponse')), 400: error('Invalid or failed verification request (PORTAL_VERIFICATION_FAILED)') } } },
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
      AuthPasswordResetRequest: object(['identifier'], { identifier: text }),
      AuthPasswordResetConsumeRequest: object(['token', 'newPassword'], { token: text, newPassword: { type: 'string', minLength: 12 } }),
      AuthPasswordResetResponse: object(['ok'], { ok: { const: true } }), AuthPasswordResetConsumeResponse: object(['ok'], { ok: { type: 'boolean' } }),
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
      NotificationTemplate: object(['id', 'code', 'channel', 'locale', 'body', 'version', 'isActive', 'createdAt', 'updatedAt'], { id: str, code: text, channel: { type: 'string', enum: notificationChannels }, locale: { type: 'string', enum: ['en', 'ar'] }, subject: { type: ['string', 'null'] }, body: text, version: { type: 'integer', minimum: 1 }, versionNote: { type: ['string', 'null'] }, isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }),
      NotificationTemplateListResponse: object(['items'], { items: { type: 'array', items: ref('NotificationTemplate') } }),
      NotificationTemplateWriteResponse: object(['template'], { template: ref('NotificationTemplate') }),
      NotificationTemplateCreateRequest: object(['code', 'channel', 'locale', 'body'], { code: text, channel: { type: 'string', enum: notificationChannels }, locale: { type: 'string', enum: ['en', 'ar'] }, subject: nullText, body: text, version: { type: 'integer', minimum: 1 }, versionNote: nullText, isActive: { type: 'boolean' } }),
      NotificationTemplateUpdateRequest: object([], { code: text, channel: { type: 'string', enum: notificationChannels }, locale: { type: 'string', enum: ['en', 'ar'] }, subject: nullText, body: text, version: { type: 'integer', minimum: 1 }, versionNote: nullText, isActive: { type: 'boolean' } }),
      ComplaintCreateRequest: object(['customerName', 'categoryId', 'subcategoryId', 'description', 'incidentAt', 'subject', 'severity'], { customerName: text, customerPhone: nullText, customerNumber: nullText, categoryId: text, subcategoryId: text, description: text, incidentAt: { type: 'string', format: 'date-time' }, subject: text, severity: { type: 'string', enum: complaintSeverities }, vehicleRelated: { type: 'boolean' }, vehicleVin: nullText, vehicleId: nullText }),
      ComplaintCreateResponse: object(['complaint'], { complaint: object(['id', 'referenceNumber', 'status'], { id: str, referenceNumber: str, status: { type: 'string', enum: complaintStatuses } }) }),
      PortalComplaintRequest: object(['customerName', 'customerPhone', 'categoryId', 'subcategoryId', 'description', 'incidentAt', 'branchId', 'subject', 'severity'], { customerName: text, customerPhone: text, categoryId: text, subcategoryId: text, description: text, incidentAt: { type: 'string', format: 'date-time' }, branchId: text, subject: text, severity: { type: 'string', enum: complaintSeverities }, vehicleRelated: { type: 'boolean' }, vehicleVin: nullText, vehicleId: nullText }),
      PortalOtpRequest: object(['referenceNumber', 'customerPhone'], { referenceNumber: text, customerPhone: text }),
      PortalOtpRequestResponse: object(['ok'], { ok: { const: true } }),
      PortalOtpVerifyRequest: object(['verificationId', 'otp'], { verificationId: text, otp: text }),
      PortalSessionResponse: object(['session'], { session: object(['sessionToken', 'expiresAt'], { sessionToken: text, expiresAt: { type: 'string', format: 'date-time' } }) }),
      PortalTrackingResponse: object(['complaint'], { complaint: object(['referenceNumber', 'status', 'createdAt', 'updatedAt', 'timeline'], { referenceNumber: str, status: { type: 'string', enum: complaintStatuses }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }, timeline: { type: 'array', items: object(['fromStatus', 'toStatus', 'action', 'createdAt'], { fromStatus: { type: ['string', 'null'], enum: [...complaintStatuses, null] }, toStatus: { type: 'string', enum: complaintStatuses }, action: { type: ['string', 'null'], enum: [...complaintTransitionActions, null] }, createdAt: { type: 'string', format: 'date-time' } }) } }) }),
      PortalFollowUpRequest: object(['body'], { body: text }), PortalFollowUpResponse: object(['ok'], { ok: { const: true } }),
      PortalSurveySubmitRequest: object(['surveyToken', 'rating'], { surveyToken: text, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: nullText }),
      PortalSurveySubmitResponse: object(['survey'], { survey: object(['id', 'rating', 'submittedAt'], { id: str, rating: { type: 'integer', minimum: 1, maximum: 5 }, submittedAt: { type: 'string', format: 'date-time' } }) }),
      StaffSurveyResult: object(['id', 'complaintId', 'rating', 'submittedAt'], { id: str, complaintId: str, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: ['string', 'null'] }, submittedAt: { type: 'string', format: 'date-time' } }),
      StaffSurveyResultsResponse: object(['items'], { items: { type: 'array', items: ref('StaffSurveyResult') } }),
      ComplaintQueueItem: object(['id', 'referenceNumber', 'status', 'severity', 'subject', 'branchId', 'ownerId', 'createdAt', 'updatedAt'], { id: str, referenceNumber: str, status: { type: 'string', enum: complaintStatuses }, severity: { type: 'string', enum: complaintSeverities }, subject: str, branchId: str, ownerId: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }),
      ComplaintQueueResponse: object(['items'], { items: { type: 'array', items: ref('ComplaintQueueItem') } }),
      ComplaintStatusTimelineItem: object(['id', 'fromStatus', 'toStatus', 'action', 'actorId', 'actorRole', 'requestSource', 'reason', 'correlationId', 'createdAt'], { id: str, fromStatus: { type: ['string', 'null'], enum: [...complaintStatuses, null] }, toStatus: { type: 'string', enum: complaintStatuses }, action: { type: ['string', 'null'], enum: [...complaintTransitionActions, null] }, actorId: { type: ['string', 'null'] }, actorRole: { type: ['string', 'null'], enum: [...roleCodes, null] }, requestSource: { type: ['string', 'null'] }, reason: { type: ['string', 'null'] }, correlationId: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' } }),
      ComplaintDetailResponse: object(['complaint'], { complaint: { allOf: [ref('ComplaintQueueItem'), object(['description', 'incidentAt', 'statusHistory'], { description: str, incidentAt: { type: ['string', 'null'], format: 'date-time' }, statusHistory: { type: 'array', items: ref('ComplaintStatusTimelineItem') } })] } }),
      ComplaintCommentRequest: object(['body', 'visibility'], { body: text, visibility: { type: 'string', enum: ['INTERNAL', 'PUBLIC'] } }),
      ComplaintComment: object(['id', 'complaintId', 'authorId', 'body', 'visibility', 'createdAt'], { id: str, complaintId: str, authorId: { type: ['string', 'null'] }, body: str, visibility: { type: 'string', enum: ['INTERNAL', 'PUBLIC'] }, createdAt: { type: 'string', format: 'date-time' } }),
      ComplaintCommentResponse: object(['comment'], { comment: ref('ComplaintComment') }),
      ComplaintPublicCommentsResponse: object(['items'], { items: { type: 'array', items: ref('ComplaintComment') } }),
      AttachmentUploadRequest: object(['fileName', 'contentType', 'sizeBytes', 'contentBase64'], { fileName: text, contentType: text, sizeBytes: { type: 'integer', minimum: 1 }, contentBase64: text, customerVisible: { type: 'boolean' } }),
      Attachment: object(['id', 'complaintId', 'fileName', 'contentType', 'sizeBytes', 'scanStatus', 'customerVisible'], { id: str, complaintId: str, fileName: str, contentType: str, sizeBytes: { type: 'integer', minimum: 1 }, scanStatus: { type: 'string', enum: ['PENDING', 'CLEAN', 'REJECTED'] }, customerVisible: { type: 'boolean' } }),
      AttachmentUploadResponse: object(['attachment'], { attachment: ref('Attachment') }),
      AttachmentDownloadResponse: object(['download'], { download: object(['attachmentId', 'token', 'expiresAt'], { attachmentId: str, token: text, expiresAt: { type: 'string', format: 'date-time' } }) }),
      ComplaintTransitionRequest: object(['fromStatus', 'action'], { fromStatus: { type: 'string', enum: complaintStatuses }, action: { type: 'string', enum: complaintTransitionActions }, reason: { type: ['string', 'null'], minLength: 1 }, resolutionType: { type: ['string', 'null'], minLength: 1 }, resolutionSummary: { type: ['string', 'null'], minLength: 1 }, customerCommunicationStatus: { type: ['string', 'null'], minLength: 1 } }),
      ComplaintTransition: object(['complaintId', 'fromStatus', 'action', 'actorRole', 'toStatus'], {
        complaintId: str,
        fromStatus: { type: 'string', enum: complaintStatuses },
        action: { type: 'string', enum: complaintTransitionActions },
        actorRole: { type: 'string', enum: roleCodes },
        toStatus: { type: 'string', enum: complaintStatuses },
      }),
      ComplaintTransitionResponse: object(['transition'], { transition: ref('ComplaintTransition') }),
      ReportDashboardSummary: object(['openComplaints', 'overdueComplaints', 'slaWarningComplaints', 'closedComplaints', 'averageTatHours'], { openComplaints: { type: 'integer', minimum: 0 }, overdueComplaints: { type: 'integer', minimum: 0 }, slaWarningComplaints: { type: 'integer', minimum: 0 }, closedComplaints: { type: 'integer', minimum: 0 }, averageTatHours: { type: 'number', minimum: 0 } }),
      ReportDashboardResponse: object(['summary'], { summary: ref('ReportDashboardSummary') }),
      ReportRow: object(['id', 'referenceNumber', 'branchId', 'categoryId', 'status', 'severity', 'subject', 'ownerId', 'createdAt', 'updatedAt'], { id: str, referenceNumber: str, branchId: str, categoryId: str, status: { type: 'string', enum: complaintStatuses }, severity: { type: 'string', enum: complaintSeverities }, subject: str, ownerId: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }),
      ReportListResponse: object(['items'], { items: { type: 'array', items: ref('ReportRow') } }),
      AuditLogEntry: object(['id', 'eventType', 'action', 'actorId', 'branchId', 'targetType', 'targetId', 'correlationId', 'ipAddress', 'userAgent', 'metadata', 'createdAt'], { id: str, eventType: { type: 'string', enum: eventTypes }, action: str, actorId: { type: ['string', 'null'] }, branchId: { type: ['string', 'null'] }, targetType: str, targetId: { type: ['string', 'null'] }, correlationId: { type: ['string', 'null'] }, ipAddress: { type: ['string', 'null'] }, userAgent: { type: ['string', 'null'] }, metadata: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }, createdAt: { type: 'string', format: 'date-time' } }),
      AuditLogSearchResponse: object(['items', 'page', 'pageSize'], { items: { type: 'array', items: ref('AuditLogEntry') }, page: { type: 'integer', minimum: 1 }, pageSize: { type: 'integer', minimum: 1, maximum: 100 } }),
      AuditLogExportResponse: object(['items', 'rowCount', 'rowLimit'], { items: { type: 'array', items: ref('AuditLogEntry') }, rowCount: { type: 'integer', minimum: 0 }, rowLimit: { type: 'integer', minimum: 1 } }),
    },
  },
};
function object(required, properties) { return { type: 'object', required, properties, additionalProperties: false }; } export const canonicalOpenApiText = () => `${JSON.stringify(canonical, null, 2)}\n`;
export function checkOpenApiText(text) {
  let document;
  try { document = JSON.parse(text); } catch (error) { return [`OpenAPI document must be valid JSON (${error.message})`]; }
  const errors = [];
  if (document.openapi !== '3.1.0') errors.push('OpenAPI document must use version 3.1.0');
  if (document.info?.title !== 'CMS-Auto API' || typeof document.info.version !== 'string') errors.push('OpenAPI document must include CMS-Auto API info');
  if (!document.paths || typeof document.paths !== 'object' || Array.isArray(document.paths)) errors.push('OpenAPI document must include a paths object');
  for (const [path, method] of [['/auth/login', 'post'], ['/auth/logout', 'post'], ['/auth/password-reset/request', 'post'], ['/auth/password-reset/consume', 'post'], ['/auth/me', 'get'], ['/branches', 'get'], ['/branches', 'post'], ['/branches/{idOrCode}', 'get'], ['/branches/{idOrCode}', 'patch'], ['/branches/{id}/deactivate', 'post'], ['/notifications/templates', 'get'], ['/notifications/templates', 'post'], ['/notifications/templates/{id}', 'patch'], ['/notifications/templates/{id}/activate', 'post'], ['/notifications/templates/{id}/deactivate', 'post'], ['/complaints', 'get'], ['/complaints', 'post'], ['/complaints/{id}', 'get'], ['/complaints/{id}/comments', 'post'], ['/complaints/{id}/attachments', 'post'], ['/complaints/{id}/attachments/{attachmentId}/download', 'get'], ['/complaints/{id}/comments/public', 'get'], ['/complaints/{id}/surveys', 'get'], ['/complaints/{id}/transitions', 'post'], ['/reports/dashboard', 'get'], ['/reports', 'get'], ['/reports/export', 'get'], ['/portal/complaints', 'post'], ['/portal/tracking', 'get'], ['/portal/tracking/follow-ups', 'post'], ['/portal/attachments', 'post'], ['/portal/surveys', 'post'], ['/portal/tracking/otp', 'post'], ['/portal/tracking/otp/verify', 'post'], ['/audit/logs', 'get'], ['/audit/logs/export', 'get']]) if (!document.paths?.[path]?.[method]) errors.push(`OpenAPI document missing ${path} ${method} operation`);
  for (const schema of ['ErrorEnvelope', 'ErrorBody', 'FieldError', 'AuthLoginRequest', 'AuthLoginResponse', 'AuthLogoutResponse', 'AuthPasswordResetRequest', 'AuthPasswordResetConsumeRequest', 'AuthPasswordResetResponse', 'AuthPasswordResetConsumeResponse', 'AuthMeResponse', 'StaffAuthClaims', 'Branch', 'BranchListResponse', 'BranchGetResponse', 'BranchWriteResponse', 'BranchCreateRequest', 'BranchUpdateRequest', 'NotificationTemplate', 'NotificationTemplateListResponse', 'NotificationTemplateWriteResponse', 'NotificationTemplateCreateRequest', 'NotificationTemplateUpdateRequest', 'ComplaintCreateRequest', 'ComplaintCreateResponse', 'PortalComplaintRequest', 'PortalOtpRequest', 'PortalOtpRequestResponse', 'PortalOtpVerifyRequest', 'PortalSessionResponse', 'PortalTrackingResponse', 'PortalFollowUpRequest', 'PortalFollowUpResponse', 'PortalSurveySubmitRequest', 'PortalSurveySubmitResponse', 'StaffSurveyResult', 'StaffSurveyResultsResponse', 'ComplaintQueueItem', 'ComplaintQueueResponse', 'ComplaintStatusTimelineItem', 'ComplaintDetailResponse', 'ComplaintCommentRequest', 'ComplaintComment', 'ComplaintCommentResponse', 'ComplaintPublicCommentsResponse', 'AttachmentUploadRequest', 'Attachment', 'AttachmentUploadResponse', 'AttachmentDownloadResponse', 'ComplaintTransitionRequest', 'ComplaintTransition', 'ComplaintTransitionResponse', 'ReportDashboardSummary', 'ReportDashboardResponse', 'ReportRow', 'ReportListResponse', 'AuditLogEntry', 'AuditLogSearchResponse', 'AuditLogExportResponse']) if (!document.components?.schemas?.[schema]) errors.push(`OpenAPI document missing ${schema} schema`);
  if (text !== canonicalOpenApiText()) errors.push('OpenAPI document is not canonical; run corepack pnpm openapi:generate');
  return errors;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) { if (process.argv.includes('--write')) { writeFileSync(file, canonicalOpenApiText()); console.log('OpenAPI scaffold generated'); } else { const errors = checkOpenApiText(readFileSync(file, 'utf8')); if (errors.length > 0) throw new Error(errors.join('\n')); console.log('OpenAPI scaffold check passed'); } }
