import { HttpStatus, Injectable } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { AppException } from '../../core/http-kernel.js';

export const ATTACHMENT_STORAGE = Symbol('ATTACHMENT_STORAGE');

export type AttachmentStorageObjectInput = {
  storageKey?: string;
  bytes: Uint8Array;
  contentType: string;
};

export type AttachmentStoredObject = {
  storageKey: string;
  contentType: string;
  sizeBytes: number;
};

export type AttachmentDownloadToken = {
  storageKey: string;
  token: string;
  expiresAt: Date;
};

export interface AttachmentStoragePort {
  putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject>;
  createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken>;
}

type AttachmentStorageEnv = Record<string, string | undefined>;
type S3ClientLike = Pick<S3Client, 'send'>;
type S3Presigner = (client: S3Client, command: GetObjectCommand, options: { expiresIn: number }) => Promise<string>;

@Injectable()
export class InMemoryAttachmentStorage implements AttachmentStoragePort {
  private readonly objects = new Map<string, AttachmentStoredObject>();
  private readonly bytes = new Map<string, Uint8Array>();

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    const record = {
      storageKey,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    };
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

  constructor(private readonly options: S3AttachmentStorageOptions) {
    this.bucket = requiredText(options.bucket, 'ATTACHMENT_S3_BUCKET');
    this.downloadTtlSeconds = validTtl(options.downloadTtlSeconds ?? 300);
    this.presigner = options.presigner ?? getSignedUrl;
  }

  async putObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    const storageKey = input.storageKey?.trim() || `attachments/${randomUUID()}`;
    await this.options.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: Buffer.from(input.bytes),
      ContentType: input.contentType,
    }));
    return { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    const key = requiredText(storageKey, 'storageKey');
    await this.assertObjectExists(key);
    const token = await this.presigner(
      this.options.client as S3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.downloadTtlSeconds },
    );
    return {
      storageKey: key,
      token,
      expiresAt: new Date(Date.now() + this.downloadTtlSeconds * 1000),
    };
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
