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
