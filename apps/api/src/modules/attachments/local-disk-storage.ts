import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppException } from '../../core/http-kernel.js';
import type { AttachmentDownloadToken, AttachmentStorageObjectInput, AttachmentStoragePort, AttachmentStoredObject } from './attachment-storage.port.js';

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
    const filePath = path.join(this.uploadDir, safeKey);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(input.bytes));
    fs.writeFileSync(`${filePath}.meta`, JSON.stringify({ contentType: input.contentType }));
    this.memory.set(storageKey, { bytes: Uint8Array.from(input.bytes), contentType: input.contentType });
    return { storageKey, contentType: input.contentType, sizeBytes: input.bytes.byteLength };
  }

  async createDownloadToken(storageKey: string): Promise<AttachmentDownloadToken> {
    const key = requiredText(storageKey, 'storageKey');
    if (!this.getFile(key)) throw attachmentObjectMissing();
    return {
      storageKey: key,
      token: `/api/attachments/raw/${encodeURIComponent(key)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  getFile(storageKey: string): { bytes: Buffer; contentType: string } | null {
    let key = storageKey;
    try { key = decodeURIComponent(key); } catch {}
    if (path.isAbsolute(key) || path.win32.isAbsolute(key) || key.includes('\0') || key.split(/[\\/]/).some(part => part === '..' || part === '.')) return null;
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
        const root = path.resolve(dir);
        const filePath = path.resolve(root, safeKey);
        if (!filePath.startsWith(root + path.sep)) continue;
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
    this.bytes.set(storageKey, Uint8Array.from(input.bytes));
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

function requiredText(value: string | undefined, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`${field} is required`);
}

export function attachmentObjectMissing(): AppException {
  return new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', HttpStatus.NOT_FOUND);
}
