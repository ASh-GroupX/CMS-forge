import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { LocalDiskAttachmentStorage, S3AttachmentStorage } from '../../src/modules/attachments/attachment-storage.port.ts';
import { AttachmentsService } from '../../src/modules/attachments/attachments.service.ts';
import { RawAttachmentsController } from '../../src/modules/attachments/attachments.controller.ts';
import { toCreateAttachmentInput } from '../../src/modules/attachments/dto/create-attachment.dto.ts';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
for (const format of ['png', 'jpeg', 'webp']) {
  test(`${format} upload/download preserves original colored image after storage restart`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'cms-image-'));
    try {
      const bytes = readFileSync(new URL(`./fixtures/colors.${format}`, import.meta.url));
      const mime = `image/${format}`;
      const input = toCreateAttachmentInput('complaint', { fileName: `colors.${format}`, contentType: mime, sizeBytes: bytes.length, contentBase64: bytes.toString('base64') }, { actorId: 'staff', branchId: 'branch' });
      const stored = await new LocalDiskAttachmentStorage(directory).putObject({bytes: input.bytes, contentType: mime});
      const restarted = new LocalDiskAttachmentStorage(directory);
      const record = { storageKey: stored.storageKey, fileName: input.fileName, contentType: mime, sizeBytes: bytes.length };
      const service = new AttachmentsService({findByStorageKey: async (key: string) => key === 'attachment-id' ? record : null} as never, {} as never, restarted);
      const headers: Record<string, string> = {};
      let downloaded: Buffer | undefined;
      const controller = new RawAttachmentsController(service);
      await controller.serveRaw(stored.storageKey, {url:'/attachments/raw/original'}, {setHeader: (key: string, value: string) => { headers[key] = value; }, send: (value: Buffer) => { downloaded = value; }});
      assert.ok(downloaded);
      assert.equal(hash(downloaded), hash(bytes));
      assert.equal(downloaded.length, input.sizeBytes);
      assert.equal(headers['Content-Type'], mime);
      assert.match(headers['Content-Disposition'], new RegExp(`\\.${format === 'jpeg' ? 'jpg' : format}`));
      assert.match(headers['Cache-Control'], /no-store/);
    } finally { rmSync(directory, {recursive:true, force:true}); }
  });
}

test('missing original returns not-found instead of a dummy black image', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'cms-image-missing-'));
  try {
    const record = {storageKey:'attachments/missing', fileName:'original.jpg', contentType:'image/jpeg'};
    const service = new AttachmentsService({findByStorageKey: async () => record} as never, {} as never, new LocalDiskAttachmentStorage(directory));
    await assert.rejects(new RawAttachmentsController(service).serveRaw('attachment-id', {url:'/attachments/raw/attachment-id'}, {send:()=>assert.fail('Must not synthesize a successful image')}), (error: any) => error.code === 'ATTACHMENT_NOT_FOUND');
  } finally { rmSync(directory, {recursive:true, force:true}); }
});

test('failed durable disk writes fail the upload instead of accepting memory-only bytes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'cms-image-unwritable-'));
  try {
    const file = join(directory,'not-a-directory');
    writeFileSync(file,'occupied');
    await assert.rejects(new LocalDiskAttachmentStorage(file).putObject({bytes:new Uint8Array([1,2,3]), contentType:'image/png'}));
  } finally { rmSync(directory, {recursive:true, force:true}); }
});

test('raw reads do not resolve database row IDs into private originals', async () => {
  let lookedUp = false;
  const service = new AttachmentsService({findByStorageKey:async()=>{lookedUp=true;return {storageKey:'private-original'};}} as never, {} as never, {getFile:()=>null} as never);
  assert.equal(await service.getRawFile('attachment-row-id'),null);
  assert.equal(lookedUp,false);
});

test('disk reads reject traversal and copy mutable Buffer uploads', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'cms-image-safe-'));
  try {
    const storage = new LocalDiskAttachmentStorage(join(directory,'uploads'));
    writeFileSync(join(directory,'private.env'),'must-not-read');
    for (const key of ['../private.env','%2e%2e%2fprivate.env',join(directory,'private.env'),'..\\private.env']) assert.equal(storage.getFile(key),null);
    const bytes = Buffer.from([1,2,3]);
    const stored = await storage.putObject({bytes,contentType:'image/png'});
    bytes.fill(0);
    assert.deepEqual(storage.getFile(stored.storageKey)?.bytes,Buffer.from([1,2,3]));
  } finally { rmSync(directory, {recursive:true, force:true}); }
});

test('slow object-store reads return the full original image rather than the previous 800ms timeout result', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'cms-image-s3-'));
  try {
    const bytes = readFileSync(new URL('./fixtures/colors.png', import.meta.url));
    const storage = new S3AttachmentStorage({bucket:'test', fallbackStorage:new LocalDiskAttachmentStorage(directory), client:{send: async () => {
      await new Promise(resolve=>setTimeout(resolve,900));
      return {Body:Readable.from([bytes.subarray(0,30),bytes.subarray(30)]), ContentType:'image/png'};
    }} as never});
    const file = await storage.getFile('attachments/slow-original');
    assert.ok(file);
    assert.equal(hash(file.bytes),hash(bytes));
  } finally { rmSync(directory, {recursive:true, force:true}); }
});
