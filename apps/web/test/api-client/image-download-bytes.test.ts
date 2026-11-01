import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GET as complaintDownload } from '../../src/app/api/complaints/[id]/attachments/[attachmentId]/download/route';
import { GET as rawDownload } from '../../src/app/api/attachments/raw/[...key]/route';
import { attachmentFileToBase64 } from '../../src/lib/attachment-file-policy';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
for (const format of ['png','jpeg','webp']) {
  test(`${format} browser encoding and scoped download proxy preserve every original byte`, async (context) => {
    const bytes = readFileSync(`apps/api/test/attachments/fixtures/colors.${format}`);
    const mime = `image/${format}`;
    const encoded = await attachmentFileToBase64(new File([bytes], `colors.${format}`, {type:mime}));
    assert.equal(hash(Buffer.from(encoded,'base64')),hash(bytes));
    const calls: string[] = [];
    context.mock.method(globalThis,'fetch',async (input: string | URL) => {
      calls.push(String(input));
      return String(input).endsWith('/download')
        ? Response.json({download:{token:'/api/attachments/raw/objects%2Foriginal'}})
        : new Response(bytes,{headers:{'content-type':mime,'content-disposition':`attachment; filename="colors.${format}"`}});
    });
    const response = await complaintDownload(new Request('http://localhost/api/complaints/c1/attachments/a1/download?download=1',{headers:{cookie:'cms_staff_session=proof'}}), {params:Promise.resolve({id:'c1',attachmentId:'a1'})});
    assert.equal(response.status,200);
    assert.equal(hash(new Uint8Array(await response.arrayBuffer())),hash(bytes));
    assert.equal(response.headers.get('content-type'),mime);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.ok(calls[0]?.includes('/complaints/c1/attachments/a1/download'));
    assert.ok(calls[1]?.includes('/attachments/raw/objects%2Foriginal'));
  });
}

test('raw download proxy never publicly caches an image or replaces missing objects with image bytes', async (context) => {
  let missing = false;
  const original = readFileSync('apps/api/test/attachments/fixtures/colors.png');
  context.mock.method(globalThis,'fetch',async()=>missing ? new Response(null,{status:404}) : new Response(original,{headers:{'content-type':'image/png'}}));
  const existing = await rawDownload(new Request('http://localhost/api/attachments/raw/existing'),{params:Promise.resolve({key:['existing']})});
  assert.equal(hash(new Uint8Array(await existing.arrayBuffer())),hash(original));
  assert.equal(existing.headers.get('cache-control'),'private, no-store');
  missing = true;
  const response = await rawDownload(new Request('http://localhost/api/attachments/raw/missing'),{params:Promise.resolve({key:['missing']})});
  assert.equal(response.status,404);
  assert.match(response.headers.get('content-type') ?? '',/json/);
});
