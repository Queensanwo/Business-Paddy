import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { InboxApiError } from '@/server/inboxStore';

// Local file storage for this phase (Cloudflare R2 later via adapter).
// Files live under ./data/uploads (gitignored). Malware scanning and
// periodic orphan cleanup are later hardening steps.
const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads');
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
]);

export interface StoredFile {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

function safeExtension(fileName: string, mimeType: string): string {
  const ext = extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 8);
  if (ext) return ext;
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'audio/mpeg') return '.mp3';
  if (mimeType === 'audio/webm') return '.webm';
  return '.bin';
}

export async function saveUpload(file: File): Promise<StoredFile> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new InboxApiError(400, 'File type not allowed.');
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new InboxApiError(400, 'File must be between 1 byte and 10 MB.');
  }
  const key = `${Date.now()}_${randomBytes(8).toString('hex')}${safeExtension(file.name, file.type)}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), Buffer.from(await file.arrayBuffer()));
  const fileName = file.name.replace(/[\\/]/g, '').slice(0, 120) || 'file';
  return { storageKey: key, fileName, mimeType: file.type, sizeBytes: file.size };
}

export function uploadPath(storageKey: string): string {
  if (!/^[A-Za-z0-9_.-]{1,80}$/.test(storageKey)) {
    throw new InboxApiError(400, 'Invalid file reference.');
  }
  return join(UPLOAD_DIR, storageKey);
}

export function validateUploadContent(bytes: Buffer, mimeType: string): boolean {
  const ascii = (start: number, end: number) => bytes.toString('ascii', start, end);
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mimeType === 'image/gif') return ['GIF87a', 'GIF89a'].includes(ascii(0, 6));
  if (mimeType === 'image/webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (mimeType === 'application/pdf') return ascii(0, 5) === '%PDF-';
  if (mimeType === 'audio/wav') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
  if (mimeType === 'audio/webm') return bytes.subarray(0, 4).equals(Buffer.from([26,69,223,163]));
  if (mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a') return ascii(4, 8) === 'ftyp';
  if (mimeType === 'audio/mpeg') return ascii(0, 3) === 'ID3' || (bytes.length > 1 && bytes[0] === 255 && (bytes[1] & 224) === 224);
  if (mimeType === 'text/plain') {
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return !bytes.some((b) => b < 32 && ![9,10,13].includes(b)); } catch { return false; }
  }
  return false;
}
