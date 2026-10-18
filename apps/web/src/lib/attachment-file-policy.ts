const fiveMb = 5 * 1024 * 1024;

const allowed: Record<string, Record<string, number>> = {
  'image/jpeg': { jpeg: fiveMb, jpg: fiveMb },
};

export type AttachmentFileValidation = { ok: true } | { ok: false; code: 'ATTACHMENT_REQUIRED' | 'ATTACHMENT_TYPE_BLOCKED' | 'ATTACHMENT_SIZE_EXCEEDED' };

export function normalizeAttachmentMime(fileName: string, mime?: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const lower = (mime || '').trim().toLowerCase();
  if (lower && lower !== 'application/octet-stream') {
    if (lower === 'image/jpg' || lower === 'image/pjpeg') return 'image/jpeg';
    if (lower === 'image/x-png') return 'image/png';
    return lower;
  }
  switch (extension) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'pdf': return 'application/pdf';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'webm': return 'video/webm';
    default: return lower || 'application/octet-stream';
  }
}

export function validateAttachmentFile(file: File | null): AttachmentFileValidation {
  if (!file) return { ok: false, code: 'ATTACHMENT_REQUIRED' };
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = normalizeAttachmentMime(file.name, file.type);
  const limit = allowed[mime]?.[extension];
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
