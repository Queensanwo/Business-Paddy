// Generates PWA icons with pure Node (no image tools): navy tile, sand chat
// motif. Run: node scripts/gen-icons.mjs (output: public/icons/).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const NAVY = [0x12, 0x3a, 0x8a];
const SAND = [0xe8, 0xc5, 0x6b];
const WHITE = [0xff, 0xff, 0xff];

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([td, data])));
  return Buffer.concat([len, td, data, crc]);
}

function icon(size) {
  const px = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2;
  const bubbleR = size * 0.30;
  const dotR = size * 0.035;
  const dotY = size * 0.47;
  const dotX = [cx - size * 0.11, cx, cx + size * 0.11];
  const corner = size * 0.22;
  let o = 0;
  for (let y = 0; y < size; y++) {
    px[o++] = 0;
    for (let x = 0; x < size; x++) {
      // Rounded-square navy tile.
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      let c = NAVY;
      if (dx < corner && dy < corner) {
        const ox = corner - dx;
        const oy = corner - dy;
        if (ox * ox + oy * oy <= corner * corner) c = NAVY;
        else c = null; // transparent corner
      }
      if (c) {
        // Sand chat circle.
        const ddx = x - cx;
        const ddy = y - size * 0.46;
        if (ddx * ddx + ddy * ddy <= bubbleR * bubbleR) {
          c = SAND;
          for (const dxx of dotX) {
            const qx = x - dxx;
            const qy = y - dotY;
            if (qx * qx + qy * qy <= dotR * dotR) {
              c = WHITE;
              break;
            }
          }
        }
        px[o++] = c[0]; px[o++] = c[1]; px[o++] = c[2]; px[o++] = 255;
      } else {
        px[o++] = 0; px[o++] = 0; px[o++] = 0; px[o++] = 0;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(px)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, icon(size));
  console.log('wrote', file);
}
