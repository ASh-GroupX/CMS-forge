import { spawnSync } from 'node:child_process';

const composeEnv = {
  ...process.env,
  ATTACHMENT_STORAGE_DRIVER: 's3',
  ATTACHMENT_S3_ENDPOINT: 'http://minio:9000',
  ATTACHMENT_S3_REGION: 'us-east-1',
  ATTACHMENT_S3_BUCKET: 'cms-auto-attachments',
  ATTACHMENT_S3_ACCESS_KEY_ID: 'cms_auto_minio',
  ATTACHMENT_S3_SECRET_ACCESS_KEY: 'cms_auto_minio_dev',
  ATTACHMENT_S3_FORCE_PATH_STYLE: 'true',
};

function main() {
  run('docker', ['version']);
  run('docker', ['compose', 'up', '-d', '--build', 'minio', 'api', 'redis', 'worker'], { env: composeEnv });
  run('docker', ['compose', 'ps']);
  waitForApi();

  const proof = spawnSync('docker', ['compose', 'exec', '-T', 'api', 'node', '--input-type=module'], {
    input: containerProofScript,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (proof.status !== 0) {
    process.stdout.write(proof.stdout);
    process.stderr.write(proof.stderr);
    process.exit(proof.status ?? 1);
  }

  process.stdout.write(proof.stdout);
  console.log('runtime smoke proof passed');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function waitForApi() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const result = spawnSync(process.platform === 'win32' ? 'curl.exe' : 'curl', ['-fsS', '--max-time', '2', 'http://127.0.0.1:3000/health'], {
      stdio: 'ignore',
    });
    if (result.status === 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2_000);
  }
  throw new Error('API did not become ready');
}

const containerProofScript = String.raw`
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { CreateBucketCommand, HeadBucketCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { AttachmentScanStatus, ComplaintSeverity, ComplaintStatus, NotificationChannel, NotificationStatus, PrismaClient, RoleCode, SlaEventType, SlaStage, WorkingCalendarMode } from '@prisma/client';
import { Queue } from 'bullmq';

const api = 'http://127.0.0.1:3000';
const proofId = 'f8-06-' + Date.now();
const prisma = new PrismaClient();
const s3 = new S3Client({
  endpoint: process.env.ATTACHMENT_S3_ENDPOINT,
  region: process.env.ATTACHMENT_S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.ATTACHMENT_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.ATTACHMENT_S3_SECRET_ACCESS_KEY,
  },
});

try {
  // ponytail: direct DB setup keeps the smoke deterministic; use public seed APIs when they exist.
  const setup = await setupProofData();
  await ensureBucket();
  const auth = await login(setup.proofUserEmail, setup.proofPassword);
  const attachment = await proveAttachment(auth, setup.complaint.id);
  const sla = await proveSla(setup);
  const notifications = await proveNotifications(setup);
  console.log(JSON.stringify({
    proofId,
    complaintReference: setup.complaint.referenceNumber,
    sla,
    notifications,
    attachment,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

async function setupProofData() {
  const now = new Date();
  const branch = await prisma.branch.upsert({
    where: { code: 'F8E2E' },
    update: {},
    create: { code: 'F8E2E', nameEn: 'F8 E2E Branch', nameAr: 'F8 E2E Branch' },
  });
  const category = await prisma.category.upsert({
    where: { code: 'F8_E2E' },
    update: {},
    create: { code: 'F8_E2E', nameEn: 'F8 E2E', nameAr: 'F8 E2E' },
  });
  const customer = await prisma.customer.upsert({
    where: { phone: '+966599000001' },
    update: {},
    create: { phone: '+966599000001', nameEn: 'F8 Customer', nameAr: 'F8 Customer' },
  });
  await prisma.customerNotificationPreference.upsert({
    where: { customerId: customer.id },
    update: { preferredChannel: null, smsQuietStart: '00:00', smsQuietEnd: '23:59', timezone: 'UTC' },
    create: { customerId: customer.id, smsQuietStart: '00:00', smsQuietEnd: '23:59', timezone: 'UTC' },
  });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.ADMIN } });
  const proofPassword = randomBytes(24).toString('base64url');
  const proofUserEmail = proofId + '@cms-auto.test';
  await prisma.user.create({
    data: {
      email: proofUserEmail,
      nameEn: 'F8 E2E Proof',
      nameAr: 'F8 E2E Proof',
      passwordHash: await argon2.hash(proofPassword, { type: argon2.argon2id }),
      roleId: role.id,
    },
  });
  const policy = await prisma.slaPolicy.create({
    data: {
      severity: ComplaintSeverity.HIGH,
      stage: SlaStage.INVESTIGATION,
      branchId: branch.id,
      categoryId: category.id,
      durationMinutes: 1,
      warningPercent: 50,
      branchTimezone: 'UTC',
      workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
      escalationLevel1: 'CR_MANAGER',
    },
  });
  const complaint = await prisma.complaint.create({
    data: {
      referenceNumber: 'CMP-' + proofId.toUpperCase(),
      status: ComplaintStatus.IN_PROGRESS,
      severity: ComplaintSeverity.HIGH,
      subject: 'F8 runtime smoke',
      branchId: branch.id,
      categoryId: category.id,
      customerId: customer.id,
      descriptionEn: 'Runtime smoke proof complaint',
      incidentAt: now,
    },
  });
  const deadlineKey = 'sla:deadline:' + proofId;
  await prisma.slaEvent.create({
    data: {
      complaintId: complaint.id,
      policyId: policy.id,
      type: SlaEventType.DEADLINE_SET,
      stage: SlaStage.INVESTIGATION,
      dueAt: new Date(now.getTime() - 60_000),
      idempotencyKey: deadlineKey,
    },
  });
  await prisma.notification.createMany({
    data: [
      notificationData(complaint.id, NotificationChannel.EMAIL, { to: proofId + '@example.test', subject: 'F8 runtime', textBody: 'runtime email' }),
      notificationData(complaint.id, NotificationChannel.SMS, { to: '+966599000001', textBody: 'runtime sms' }),
      notificationData(complaint.id, NotificationChannel.WHATSAPP, { to: '+966599000001', textBody: 'runtime whatsapp' }),
    ],
  });
  return { branch, category, customer, policy, complaint, deadlineKey, proofPassword, proofUserEmail };
}

function notificationData(complaintId, channel, payload) {
  return { complaintId, channel, status: NotificationStatus.QUEUED, templateCode: 'f8.runtime', locale: 'en', payload };
}

async function ensureBucket() {
  const Bucket = process.env.ATTACHMENT_S3_BUCKET;
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket }));
  }
  await s3.send(new HeadBucketCommand({ Bucket }));
}

async function login(identifier, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': proofId },
    body: JSON.stringify({ identifier, password }),
  });
  const cookie = setCookies(result.response.headers);
  const csrf = cookieValue(cookie, 'cms_csrf_token');
  assert.ok(cookie.includes('cms_staff_session='));
  assert.ok(csrf);
  return { cookie, csrf };
}

async function proveAttachment(auth, complaintId) {
  const bytes = Buffer.from('F8 runtime attachment ' + proofId + '\n');
  const upload = await request('/complaints/' + complaintId + '/attachments', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: auth.cookie, 'x-csrf-token': auth.csrf, 'x-correlation-id': proofId },
    body: JSON.stringify({ fileName: proofId + '.pdf', contentType: 'application/pdf', sizeBytes: bytes.byteLength, contentBase64: bytes.toString('base64') }),
  });
  const attachment = upload.body.attachment;
  assert.equal(attachment.scanStatus, AttachmentScanStatus.PENDING);
  const blocked = await fetch(api + '/complaints/' + complaintId + '/attachments/' + attachment.id + '/download', {
    headers: { cookie: auth.cookie, 'x-correlation-id': proofId },
  });
  assert.equal(blocked.status, 409);
  const queue = new Queue('attachments-scan', redisConnection());
  await queue.add('attachments.scan', { attachmentId: attachment.id, toStatus: 'CLEAN', correlationId: proofId }, { jobId: proofId + '-scan' });
  await queue.close();
  await waitFor(async () => (await prisma.attachment.findUnique({ where: { id: attachment.id } }))?.scanStatus === AttachmentScanStatus.CLEAN, 'attachment clean');
  const download = await request('/complaints/' + complaintId + '/attachments/' + attachment.id + '/download', {
    headers: { cookie: auth.cookie, 'x-correlation-id': proofId },
  });
  const token = download.body.download.token;
  const tokenUrl = new URL(token);
  assert.equal(tokenUrl.hostname, 'minio');
  assert.equal(tokenUrl.port, '9000');
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: process.env.ATTACHMENT_S3_BUCKET }));
  assert.ok((listed.Contents ?? []).some((item) => item.Key));
  return { id: attachment.id, scanStatus: AttachmentScanStatus.CLEAN, pendingDownloadBlocked: true, tokenHost: tokenUrl.host };
}

async function proveSla(setup) {
  const queue = new Queue('sla', redisConnection());
  await queue.add('sla.warning', {}, { jobId: proofId + '-warning' });
  await queue.add('sla.breach', {}, { jobId: proofId + '-breach' });
  await queue.close();
  const warningKey = 'sla:warning:' + setup.deadlineKey;
  const breachKey = 'sla:breach:' + setup.deadlineKey;
  await waitFor(async () => Boolean(await prisma.slaEvent.findUnique({ where: { idempotencyKey: warningKey } })), 'sla warning');
  await waitFor(async () => Boolean(await prisma.slaEvent.findUnique({ where: { idempotencyKey: breachKey } })), 'sla breach');
  await waitFor(async () => Boolean(await prisma.notification.findFirst({ where: { complaintId: setup.complaint.id, templateCode: 'sla.breach.internal' } })), 'sla notification');
  return { warning: true, breach: true, escalationNotification: true };
}

async function proveNotifications(setup) {
  const queue = new Queue('notifications', redisConnection());
  await queue.add('notifications.email', {}, { jobId: proofId + '-email' });
  await queue.add('notifications.sms', {}, { jobId: proofId + '-sms' });
  await queue.add('notifications.whatsapp', {}, { jobId: proofId + '-whatsapp' });
  await queue.close();
  await waitFor(async () => {
    const rows = await prisma.notification.findMany({ where: { complaintId: setup.complaint.id, templateCode: 'f8.runtime' } });
    return rows.some((row) => row.channel === NotificationChannel.EMAIL && row.status === NotificationStatus.SENT)
      && rows.some((row) => row.channel === NotificationChannel.SMS && row.status === NotificationStatus.FAILED)
      && rows.some((row) => row.channel === NotificationChannel.WHATSAPP && row.status === NotificationStatus.SENT);
  }, 'notification dispatch');
  return { email: NotificationStatus.SENT, sms: NotificationStatus.FAILED, whatsapp: NotificationStatus.SENT };
}

function redisConnection() {
  return { connection: { host: 'redis', port: 6379, maxRetriesPerRequest: null } };
}

async function request(path, options = {}) {
  const response = await fetch(api + path, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error((options.method ?? 'GET') + ' ' + path + ' failed ' + response.status + ': ' + text.slice(0, 240));
  return { response, body };
}

function setCookies(headers) {
  const raw = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
  return raw.flatMap((value) => value.split(/,(?=\s*cms_)/)).map((value) => value.split(';')[0]).join('; ');
}

function cookieValue(cookieHeader, name) {
  return cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='))?.slice(name.length + 1) ?? '';
}

async function waitFor(check, label) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Timed out waiting for ' + label);
}
`;

main();
