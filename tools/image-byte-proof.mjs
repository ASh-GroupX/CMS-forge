import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,readdirSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {LocalDiskAttachmentStorage} from '../apps/api/src/modules/attachments/attachment-storage.port.ts';
import {AttachmentsService} from '../apps/api/src/modules/attachments/attachments.service.ts';
import {RawAttachmentsController} from '../apps/api/src/modules/attachments/attachments.controller.ts';
import {toCreateAttachmentInput} from '../apps/api/src/modules/attachments/dto/create-attachment.dto.ts';
import {GET as download} from '../apps/web/src/app/api/complaints/[id]/attachments/[attachmentId]/download/route.ts';
const pw=readdirSync('node_modules/.pnpm').find(p=>p.startsWith('playwright-core@'));
const {chromium}=await import(pathToFileURL(resolve('node_modules/.pnpm',pw,'node_modules/playwright-core/index.mjs')).href);
const browser=await chromium.launch({headless:true});
const directory=mkdtempSync(join(tmpdir(),'cms-real-image-'));
const hash=b=>createHash('sha256').update(b).digest('hex');
mkdirSync('.codex-run/image-proof',{recursive:true});
const samples=[];
try {
  for(const format of ['png','jpeg','webp']) {
    const original=readFileSync(`apps/api/test/attachments/fixtures/colors.${format}`);
    const input=toCreateAttachmentInput('complaint',{fileName:`colors.${format}`,contentType:`image/${format}`,sizeBytes:original.length,contentBase64:original.toString('base64')},{actorId:'staff',branchId:'branch'});
    const initial=new LocalDiskAttachmentStorage(directory);
    const stored=await initial.putObject({bytes:input.bytes,contentType:input.contentType});
    const disk=new LocalDiskAttachmentStorage(directory);
    const raw=new RawAttachmentsController(new AttachmentsService({} ,{},disk));
    const originalFetch=globalThis.fetch;
    globalThis.fetch=async url=>{
      if(String(url).endsWith('/download'))return Response.json({download:await disk.createDownloadToken(stored.storageKey)});
      const headers=new Headers(); let bytes;
      await raw.serveRaw(stored.storageKey,{url:String(url)},{setHeader:(key,value)=>headers.set(key,value),send:value=>{bytes=value;}});
      return new Response(bytes,{headers});
    };
    let response;
    try {response=await download(new Request('http://localhost/api/complaints/complaint/attachments/attachment/download?download=1'),{params:Promise.resolve({id:'complaint',attachmentId:'attachment'})});} finally {globalThis.fetch=originalFetch;}
    const bytes=Buffer.from(await response.arrayBuffer());
    if(hash(bytes)!==hash(original))throw Error('Original bytes changed');
    const file=`.codex-run/image-proof/downloaded.${format}`;writeFileSync(file,bytes);
    samples.push({format,src:`data:${response.headers.get('content-type')};base64,${readFileSync(file).toString('base64')}`,sha256:hash(bytes),bytes:bytes.length});
  }
  const page=await browser.newPage();
  await page.setContent(`<html><head><title>Downloaded image proof</title></head><body>${samples.map(s=>`<figure><figcaption>${s.format}: ${s.bytes} original bytes</figcaption><img alt="Downloaded ${s.format}" src="${s.src}" style="width:256px;image-rendering:pixelated"></figure>`).join('')}</body></html>`);
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  const decoded=await page.evaluate(()=>[...document.images].map(image=>{const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;const colors=new Set();for(let i=0;i<p.length;i+=4)if(p[i+3]>0)colors.add(`${p[i]},${p[i+1]},${p[i+2]}`);return {width:c.width,height:c.height,colors:colors.size};}));
  decoded.forEach(d=>{if(d.width!==32||d.height!==24||d.colors<20)throw Error('Downloaded image is blank or incorrectly decoded');});
  console.log(JSON.stringify(samples.map((s,i)=>({format:s.format,bytes:s.bytes,sha256:s.sha256,...decoded[i]}))));
  await page.screenshot({path:'.codex-run/image-proof/decoded-downloads.png',fullPage:true});
} finally {await browser.close();rmSync(directory,{recursive:true,force:true});}
