import assert from 'node:assert/strict';
import test from 'node:test';
import {
  S3AttachmentStorage,
  attachmentStorageFromEnv,
  s3AttachmentStorageFromEnv,
} from '../../src/modules/attachments/attachment-storage.port.ts';

test('attachment storage factory keeps memory storage for development without S3 config', () => {
  const storage = attachmentStorageFromEnv({ NODE_ENV: 'development' });
  assert.equal(storage.constructor.name, 'InMemoryAttachmentStorage');
});

test('attachment storage factory requires complete S3 config for production', () => {
  assert.throws(
    () => attachmentStorageFromEnv({ NODE_ENV: 'production', ATTACHMENT_S3_SECRET_ACCESS_KEY: 'not-returned' }),
    /ATTACHMENT_S3_ENDPOINT is required/,
  );
});

test('S3 attachment storage writes objects and returns a short-lived signed URL', async () => {
  const sent: string[] = [];
  const storage = new S3AttachmentStorage({
    bucket: 'attachments',
    downloadTtlSeconds: 120,
    client: {
      send: async (command) => {
        sent.push(command.constructor.name);
        return {};
      },
    },
    presigner: async (_client, command, options) => {
      sent.push(`${command.constructor.name}:${options.expiresIn}`);
      return 'http://minio:9000/attachments/objects/att_1?X-Amz-Signature=proof';
    },
  });

  const stored = await storage.putObject({
    storageKey: 'objects/att_1',
    bytes: new Uint8Array([1, 2, 3]),
    contentType: 'application/pdf',
  });
  const download = await storage.createDownloadToken(stored.storageKey);

  assert.deepEqual(stored, { storageKey: 'objects/att_1', contentType: 'application/pdf', sizeBytes: 3 });
  assert.equal(download.storageKey, stored.storageKey);
  assert.match(download.token, /^http:\/\/minio:9000\/attachments\/objects\/att_1\?/);
  assert.ok(download.expiresAt.getTime() > Date.now());
  assert.deepEqual(sent, ['PutObjectCommand', 'HeadObjectCommand', 'GetObjectCommand:120']);
});

test('S3 config validation does not expose credential values', () => {
  assert.throws(
    () => s3AttachmentStorageFromEnv({
      ATTACHMENT_S3_ENDPOINT: 'http://minio:9000',
      ATTACHMENT_S3_REGION: 'us-east-1',
      ATTACHMENT_S3_BUCKET: 'attachments',
      ATTACHMENT_S3_ACCESS_KEY_ID: 'access-key-value',
      ATTACHMENT_S3_SECRET_ACCESS_KEY: 'secret-key-value',
      ATTACHMENT_DOWNLOAD_TTL_SECONDS: 'bad',
    }),
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      assert.equal(message.includes('secret-key-value'), false);
      assert.equal(message.includes('access-key-value'), false);
      return /ATTACHMENT_DOWNLOAD_TTL_SECONDS/.test(message);
    },
  );
});
