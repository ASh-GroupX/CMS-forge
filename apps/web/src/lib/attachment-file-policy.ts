const tenMb = 10 * 1024 * 1024;
const fiftyMb = 50 * 1024 * 1024;

const allowed: Record<string, Record<string, number>> = {
  'image/jpeg': { jpeg: tenMb, jpg: tenMb },
  'image/png': { png: tenMb },
  'image/webp': { webp: tenMb },
  'application/pdf': { pdf: tenMb },
  'audio/mpeg': { mp3: fiftyMb },
  'audio/wav': { wav: fiftyMb },
  'audio/ogg': { ogg: fiftyMb },
  'video/mp4': { mp4: fiftyMb },
  'video/quicktime': { mov: fiftyMb },
  'video/webm': { webm: fiftyMb },
};

export type AttachmentFileValidation = { ok: true } | { ok: false; code: 'ATTACHMENT_REQUIRED' | 'ATTACHMENT_TYPE_BLOCKED' | 'ATTACHMENT_SIZE_EXCEEDED' };

export function validateAttachmentFile(file: File | null): AttachmentFileValidation {
  if (!file) return { ok: false, code: 'ATTACHMENT_REQUIRED' };
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const limit = allowed[file.type.toLowerCase()]?.[extension];
  if (!limit) return { ok: false, code: 'ATTACHMENT_TYPE_BLOCKED' };
  return file.size > limit ? { ok: false, code: 'ATTACHMENT_SIZE_EXCEEDED' } : { ok: true };
}

export async function attachmentFileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  return btoa(binary);
}
