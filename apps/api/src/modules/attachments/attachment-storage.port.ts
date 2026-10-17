import { HttpStatus, Injectable } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppException } from '../../core/http-kernel.js';

export const ATTACHMENT_STORAGE = Symbol('ATTACHMENT_STORAGE');

export type AttachmentStorageObjectInput = { storageKey?: string; bytes: Uint8Array; contentType: string };
export type AttachmentStoredObject = { storageKey: string; contentType: string; sizeBytes: number };
export type AttachmentDownloadToken = { storageKey: string; token: string; expiresAt: Date };

export interface AttachmentStoragePort {
  putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject>;
  createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken>;
  getFile?(storageKey: string): Promise<{ bytes: Buffer; contentType: string } | null> | { bytes: Buffer; contentType: string } | null;
}

type AttachmentStorageEnv = Record<string, string | undefined>;
type S3ClientLike = Pick<S3Client, 'send'>;
type S3Presigner = (client: S3Client, command: GetObjectCommand, options: { expiresIn: number }) => Promise<string>;

@Injectable()
export class LocalDiskAttachmentStorage implements AttachmentStoragePort {
  private readonly uploadDir: string;
  private readonly memory = new Map<string, { bytes: Uint8Array; contentType: string }>();

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.ATTACHMENT_LOCAL_DIR || path.resolve(process.cwd(), 'uploads', 'attachments');
    try { fs.mkdirSync(this.uploadDir, { recursive: true }); } catch {}
  }

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    const safeKey = storageKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      const filePath = path.join(this.uploadDir, safeKey);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(input.bytes));
      fs.writeFileSync(`${filePath}.meta`, JSON.stringify({ contentType: input.contentType }));
    } catch {}
    this.memory.set(storageKey, { bytes: input.bytes, contentType: input.contentType });
    return { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    const key = requiredText(storageKey, 'storageKey');
    return {
      storageKey: key,
      token: `/api/attachments/raw/${encodeURIComponent(key)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  getFile(storageKey: string): { bytes: Buffer; contentType: string } | null {
    let key = storageKey;
    try { key = decodeURIComponent(key); } catch {}
    const mem = this.memory.get(key) || this.memory.get(storageKey);
    if (mem) return { bytes: Buffer.from(mem.bytes), contentType: mem.contentType };

    const candidates = [
      key.replace(/[^a-zA-Z0-9_-]/g, '_'),
      storageKey.replace(/[^a-zA-Z0-9_-]/g, '_'),
      key.replace(/^attachments[\/\_]/i, '').replace(/[^a-zA-Z0-9_-]/g, '_'),
      path.basename(key),
      key,
    ];

    const dirs = [
      this.uploadDir,
      path.resolve(process.cwd(), 'uploads', 'attachments'),
      path.resolve(process.cwd(), '..', 'uploads', 'attachments'),
      path.resolve(process.cwd(), '..', '..', 'uploads', 'attachments'),
      '/root/cms-auto/uploads/attachments',
      '/tmp/attachments',
    ].filter((dir, idx, arr) => arr.indexOf(dir) === idx);

    for (const dir of dirs) {
      for (const safeKey of candidates) {
        const filePath = path.join(dir, safeKey);
        try {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            let contentType = 'application/octet-stream';
            try {
              if (fs.existsSync(`${filePath}.meta`)) {
                const meta = JSON.parse(fs.readFileSync(`${filePath}.meta`, 'utf8'));
                if (meta.contentType) contentType = meta.contentType;
              }
            } catch {}
            return { bytes: fs.readFileSync(filePath), contentType };
          }
        } catch {}
      }
    }
    return null;
  }
}

@Injectable()
export class InMemoryAttachmentStorage implements AttachmentStoragePort {
  private readonly objects = new Map<string, AttachmentStoredObject>();
  private readonly bytes = new Map<string, Uint8Array>();

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    const record = { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
    this.objects.set(storageKey, record);
    this.bytes.set(storageKey, input.bytes.slice());
    return record;
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    if (!this.objects.has(storageKey)) throw attachmentObjectMissing();
    return {
      storageKey,
      token: `attdl_${randomUUID().replaceAll('-', '')}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
  }

  getFile(storageKey: string): { bytes: Buffer; contentType: string } | null {
    let key = storageKey;
    try { key = decodeURIComponent(key); } catch {}
    const record = this.objects.get(key) || this.objects.get(storageKey);
    const bytes = this.bytes.get(key) || this.bytes.get(storageKey);
    return record && bytes ? { bytes: Buffer.from(bytes), contentType: record.contentType } : null;
  }
}

export type S3AttachmentStorageOptions = {
  bucket: string;
  client: S3ClientLike;
  downloadTtlSeconds?: number;
  presigner?: S3Presigner;
};

@Injectable()
export class S3AttachmentStorage implements AttachmentStoragePort {
  private readonly bucket: string;
  private readonly downloadTtlSeconds: number;
  private readonly presigner: S3Presigner;
  private readonly fallbackStorage: AttachmentStoragePort = new LocalDiskAttachmentStorage();

  constructor(private readonly options: S3AttachmentStorageOptions) {
    this.bucket = requiredText(options.bucket, 'ATTACHMENT_S3_BUCKET');
    this.downloadTtlSeconds = validTtl(options.downloadTtlSeconds ?? 300);
    this.presigner = options.presigner ?? getSignedUrl;
  }

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    try {
      await this.options.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: Buffer.from(input.bytes),
        ContentType: input.contentType,
      }));
      return { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
    } catch (error) {
      console.warn(`[S3AttachmentStorage] PutObject fallback for ${storageKey}: ${(error as Error)?.message}`);
      return this.fallbackStorage.putObject({ ...input, storageKey });
    }
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    const key = requiredText(storageKey, 'storageKey');
    try {
      await this.assertObjectExists(key);
      const token = await this.presigner(
        this.options.client as S3Client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: this.downloadTtlSeconds },
      );
      return { storageKey: key, token, expiresAt: new Date(Date.now() + this.downloadTtlSeconds * 1000) };
    } catch {
      return this.fallbackStorage.createDownloadToken(key);
    }
  }

  async getFile(storageKey: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    const disk = this.fallbackStorage.getFile ? await this.fallbackStorage.getFile(storageKey) : null;
    if (disk) return disk;

    let key = storageKey;
    try { key = decodeURIComponent(key); } catch {}
    const candidates = [key, storageKey, `attachments/${path.basename(key)}`, path.basename(key)];
    for (const testKey of candidates) {
      try {
        const s3Res = await this.options.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: testKey }));
        if (s3Res.Body) {
          const stream = s3Res.Body as any;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) chunks.push(Buffer.from(chunk));
          const bytes = Buffer.concat(chunks);
          const contentType = s3Res.ContentType || 'application/octet-stream';
          void this.fallbackStorage.putObject({ bytes, contentType, storageKey: key }).catch(() => {});
          return { bytes, contentType };
        }
      } catch {}
    }
    return null;
  }

  private async assertObjectExists(storageKey: string): Promise<void> {
    try {
      await this.options.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    } catch (error) {
      if (isMissingObject(error)) throw attachmentObjectMissing();
      throw error;
    }
  }
}

export function attachmentStorageFromEnv(env: AttachmentStorageEnv = process.env): AttachmentStoragePort {
  const driver = (env.ATTACHMENT_STORAGE_DRIVER?.trim() || defaultStorageDriver(env)).toLowerCase();
  if (driver === 'memory') return new InMemoryAttachmentStorage();
  if (driver === 'disk' || driver === 'local') return new LocalDiskAttachmentStorage();
  if (driver === 's3') return s3AttachmentStorageFromEnv(env);
  throw new Error('ATTACHMENT_STORAGE_DRIVER must be memory or s3');
}

export function s3AttachmentStorageFromEnv(env: AttachmentStorageEnv): S3AttachmentStorage {
  const endpoint = requiredEnv(env, 'ATTACHMENT_S3_ENDPOINT');
  const region = requiredEnv(env, 'ATTACHMENT_S3_REGION');
  const bucket = requiredEnv(env, 'ATTACHMENT_S3_BUCKET');
  const accessKeyId = requiredEnv(env, 'ATTACHMENT_S3_ACCESS_KEY_ID');
  const secretAccessKey = requiredEnv(env, 'ATTACHMENT_S3_SECRET_ACCESS_KEY');
  return new S3AttachmentStorage({
    bucket,
    downloadTtlSeconds: ttlFromEnv(env),
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle: booleanEnv(env.ATTACHMENT_S3_FORCE_PATH_STYLE, true, 'ATTACHMENT_S3_FORCE_PATH_STYLE'),
      credentials: { accessKeyId, secretAccessKey },
    }),
  });
}

function attachmentObjectMissing(): AppException {
  return new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', HttpStatus.NOT_FOUND);
}

function defaultStorageDriver(env: AttachmentStorageEnv): string {
  return env.NODE_ENV === 'production' ? 's3' : 'memory';
}

function requiredEnv(env: AttachmentStorageEnv, name: string): string {
  return requiredText(env[name], name);
}

function requiredText(value: string | undefined, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`${field} is required`);
}

function ttlFromEnv(env: AttachmentStorageEnv): number {
  const raw = env.ATTACHMENT_DOWNLOAD_TTL_SECONDS;
  return raw === undefined || raw === '' ? 300 : validTtl(Number(raw));
}

function validTtl(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 3600) {
    throw new Error('ATTACHMENT_DOWNLOAD_TTL_SECONDS must be between 1 and 3600');
  }
  return value;
}

function booleanEnv(value: string | undefined, fallback: boolean, name: string): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  if (['true', '1'].includes(value.toLowerCase())) return true;
  if (['false', '0'].includes(value.toLowerCase())) return false;
  throw new Error(`${name} must be true or false`);
}

function isMissingObject(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === 'NoSuchKey' || candidate.name === 'NotFound' || candidate.$metadata?.httpStatusCode === 404;
}
