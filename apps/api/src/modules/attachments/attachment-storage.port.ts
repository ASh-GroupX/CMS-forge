import { HttpStatus, Injectable } from '@nestjs/common';
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

function attachmentObjectMissing(): AppException {
  return new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', HttpStatus.NOT_FOUND);
}
