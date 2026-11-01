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

export { LocalDiskAttachmentStorage, InMemoryAttachmentStorage } from './local-disk-storage.js';
import { LocalDiskAttachmentStorage, InMemoryAttachmentStorage, attachmentObjectMissing } from './local-disk-storage.js';

export type S3AttachmentStorageOptions = {
  bucket: string;
  client: S3ClientLike;
  downloadTtlSeconds?: number;
  presigner?: S3Presigner;
  fallbackStorage?: AttachmentStoragePort;
};

export function isPublicHttpUrl(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'minio' ||
      host === 'api' ||
      host === 'web' ||
      host === 'postgres' ||
      host === 'redis' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.test') ||
      host.endsWith('.example')
    ) {
      return false;
    }
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

@Injectable()
export class S3AttachmentStorage implements AttachmentStoragePort {
  private readonly bucket: string;
  private readonly downloadTtlSeconds: number;
  private readonly presigner: S3Presigner;
  private readonly fallbackStorage: AttachmentStoragePort;
  private lastS3Failure = 0;
  private readonly s3CooldownMs = 30000;

  constructor(private readonly options: S3AttachmentStorageOptions) {
    this.fallbackStorage = options.fallbackStorage ?? new LocalDiskAttachmentStorage();
    this.bucket = requiredText(options.bucket, 'ATTACHMENT_S3_BUCKET');
    this.downloadTtlSeconds = validTtl(options.downloadTtlSeconds ?? 300);
    this.presigner = options.presigner ?? getSignedUrl;
  }

  private isS3CircuitOpen(): boolean {
    return Date.now() - this.lastS3Failure < this.s3CooldownMs;
  }

  private recordS3Failure(): void {
    this.lastS3Failure = Date.now();
  }

  private recordS3Success(): void {
    this.lastS3Failure = 0;
  }

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    const diskRecord = await this.fallbackStorage.putObject({ ...input, storageKey });

    if (this.isS3CircuitOpen()) {
      return diskRecord;
    }

    try {
      const putRes = await withTimeout(this.options.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: Buffer.from(input.bytes),
        ContentType: input.contentType,
      })), 2500);
      if (!putRes) throw new Error('S3 putObject timed out');
      this.recordS3Success();
      return { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
    } catch (error) {
      this.recordS3Failure();
      console.warn(`[S3AttachmentStorage] S3 unavailable for ${storageKey}, using disk fallback: ${(error as Error)?.message}`);
      return diskRecord;
    }
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    const key = requiredText(storageKey, 'storageKey');
    try {
      await this.assertObjectExists(key);
      const token = await withTimeout(this.presigner(
        this.options.client as S3Client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: this.downloadTtlSeconds },
      ), 2500);
      if (!token) throw new Error('Presigner timed out');
      this.recordS3Success();
      return { storageKey: key, token, expiresAt: new Date(Date.now() + this.downloadTtlSeconds * 1000) };
    } catch {
      return this.fallbackStorage.createDownloadToken(key);
    }
  }

  async getFile(storageKey: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    const disk = this.fallbackStorage.getFile ? await this.fallbackStorage.getFile(storageKey) : null;
    if (disk) return disk;

    if (this.isS3CircuitOpen()) {
      return null;
    }

    let key = storageKey;
    try { key = decodeURIComponent(key); } catch {}
    try {
      const s3Res = await withTimeout(
        this.options.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key })),
        2500,
      );
      if (s3Res?.Body) {
        const stream = s3Res.Body as any;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        const bytes = Buffer.concat(chunks);
        const contentType = s3Res.ContentType || 'application/octet-stream';
        this.recordS3Success();
        void this.fallbackStorage.putObject({ bytes, contentType, storageKey: key }).catch(() => {});
        return { bytes, contentType };
      }
    } catch {
      this.recordS3Failure();
    }
    return null;
  }

  private async assertObjectExists(storageKey: string): Promise<void> {
    if (this.isS3CircuitOpen()) {
      if (this.fallbackStorage.getFile && (await this.fallbackStorage.getFile(storageKey))) {
        return;
      }
      throw attachmentObjectMissing();
    }

    try {
      const res = await withTimeout(
        this.options.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey })),
        2500,
      );
      if (!res) throw attachmentObjectMissing();
      this.recordS3Success();
    } catch (error) {
      if (isMissingObject(error)) {
        if (this.fallbackStorage.getFile && (await this.fallbackStorage.getFile(storageKey))) {
          return;
        }
        throw attachmentObjectMissing();
      }
      this.recordS3Failure();
      if (this.fallbackStorage.getFile && (await this.fallbackStorage.getFile(storageKey))) {
        return;
      }
      throw error;
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 800): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
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
