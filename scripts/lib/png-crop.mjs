// Schneidet den transparenten Rand eines PNG ab und schreibt es als RGBA zurück.
//
// Warum eigener Code statt einer Bildbibliothek: Das Projekt kommt ohne
// Abhängigkeiten aus (nur express + ws), und dieser Schritt läuft im Build. Eine
// Bildbibliothek nur fürs Zuschneiden wäre ein unverhältnismäßiger Zuwachs —
// `node:zlib` reicht, weil PNG genau das als Kompression benutzt.
//
// Wozu überhaupt: Die Quellbilder haben unterschiedlich viel Luft um das Item.
// Das Overlay zeichnet Icons in einen 28-px-Kasten (`object-fit: contain`), also
// bestimmt der transparente Rand, wie groß das Item darin erscheint — zwei Items
// gleicher Größe wirken sonst unterschiedlich groß. Nach dem Zuschneiden füllt
// jedes Icon seinen Kasten gleich aus, unabhängig von der Quelle.
//
// Unterstützt Bittiefe 8 ohne Interlacing in allen fünf Farbtypen (Graustufen,
// RGB, Palette, Graustufen+Alpha, RGBA). Alles andere wird unverändert
// durchgereicht statt zu raten.

import { inflateSync, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Kanäle je Farbtyp laut PNG-Spezifikation.
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

// Zerlegt das PNG in seine Chunks. Gibt null zurück, wenn es keins ist.
function readChunks(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) return null;
  const chunks = [];
  let pos = 8;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    chunks.push({ type, data });
    pos += len + 12;
    if (type === 'IEND') break;
  }
  return chunks;
}

// Macht die PNG-Zeilenfilter rückgängig (Spezifikation Kapitel 9.2) und liefert
// die rohen Pixel ohne Filterbyte.
function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const type = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prior ? prior[x] : 0;
      const c = prior && x >= bpp ? prior[x - bpp] : 0;
      let v = line[x];
      switch (type) {
        case 0: break;
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          // Paeth-Prädiktor
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default: throw new Error(`unbekannter Zeilenfilter ${type}`);
      }
      cur[x] = v & 0xff;
    }
  }
  return out;
}

// Wandelt die entfilterten Pixel in gleichmäßiges RGBA um.
function toRgba(pixels, width, height, colorType, palette, transparency) {
  const rgba = Buffer.alloc(width * height * 4);
  const ch = CHANNELS[colorType];
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * ch;
    const d = i * 4;
    switch (colorType) {
      case 0: { // Graustufen
        const g = pixels[s];
        rgba[d] = rgba[d + 1] = rgba[d + 2] = g;
        rgba[d + 3] = transparency?.gray === g ? 0 : 255;
        break;
      }
      case 2: { // RGB
        rgba[d] = pixels[s]; rgba[d + 1] = pixels[s + 1]; rgba[d + 2] = pixels[s + 2];
        const t = transparency?.rgb;
        rgba[d + 3] = t && t[0] === pixels[s] && t[1] === pixels[s + 1] && t[2] === pixels[s + 2] ? 0 : 255;
        break;
      }
      case 3: { // Palette
        const idx = pixels[s];
        rgba[d] = palette[idx * 3];
        rgba[d + 1] = palette[idx * 3 + 1];
        rgba[d + 2] = palette[idx * 3 + 2];
        rgba[d + 3] = transparency?.alpha?.[idx] ?? 255;
        break;
      }
      case 4: { // Graustufen + Alpha
        rgba[d] = rgba[d + 1] = rgba[d + 2] = pixels[s];
        rgba[d + 3] = pixels[s + 1];
        break;
      }
      case 6: { // RGBA
        rgba[d] = pixels[s]; rgba[d + 1] = pixels[s + 1];
        rgba[d + 2] = pixels[s + 2]; rgba[d + 3] = pixels[s + 3];
        break;
      }
    }
  }
  return rgba;
}

// Kleinstes Rechteck, das alle nicht vollständig transparenten Pixel enthält.
function alphaBounds(rgba, width, height) {
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] === 0) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function encodeRgba(rgba, width, height) {
  // Ohne Filter (Typ 0) kodieren — deflate erledigt den Rest, und die Icons sind
  // klein genug, dass die paar Prozent Ersparnis den Aufwand nicht lohnen.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // Bittiefe
  ihdr[9] = 6;  // Farbtyp RGBA
  ihdr[10] = 0; // Kompression deflate
  ihdr[11] = 0; // Filtermethode
  ihdr[12] = 0; // kein Interlacing
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Schneidet den transparenten Rand ab und gibt das Bild als RGBA-PNG zurück.
 * Liefert das Original unverändert zurück, wenn es kein zuschneidbares PNG ist
 * (fremdes Format, Interlacing, Bittiefe ≠ 8) oder schon randlos ist.
 *
 * @param {Buffer} buf Bilddaten
 * @returns {{ buffer: Buffer, cropped: boolean, width?: number, height?: number, reason?: string }}
 */
export function cropTransparentBorder(buf) {
  const chunks = readChunks(buf);
  if (!chunks) return { buffer: buf, cropped: false, reason: 'kein PNG' };

  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) return { buffer: buf, cropped: false, reason: 'IHDR fehlt' };
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  const interlace = ihdr.data[12];
  if (bitDepth !== 8) return { buffer: buf, cropped: false, reason: `Bittiefe ${bitDepth}` };
  if (interlace !== 0) return { buffer: buf, cropped: false, reason: 'interlaced' };
  if (!(colorType in CHANNELS)) return { buffer: buf, cropped: false, reason: `Farbtyp ${colorType}` };

  const palette = chunks.find((c) => c.type === 'PLTE')?.data;
  if (colorType === 3 && !palette) return { buffer: buf, cropped: false, reason: 'PLTE fehlt' };

  const trns = chunks.find((c) => c.type === 'tRNS')?.data;
  const transparency = trns
    ? colorType === 3
      ? { alpha: trns }
      : colorType === 0
        ? { gray: trns.readUInt16BE(0) & 0xff }
        : { rgb: [trns.readUInt16BE(0) & 0xff, trns.readUInt16BE(2) & 0xff, trns.readUInt16BE(4) & 0xff] }
    : null;

  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const pixels = unfilter(inflateSync(idat), width, height, CHANNELS[colorType]);
  const rgba = toRgba(pixels, width, height, colorType, palette, transparency);

  const box = alphaBounds(rgba, width, height);
  if (!box) return { buffer: buf, cropped: false, reason: 'vollständig transparent' };
  if (box.width === width && box.height === height) {
    return { buffer: buf, cropped: false, reason: 'kein Rand' };
  }

  const out = Buffer.alloc(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) {
    const from = ((box.top + y) * width + box.left) * 4;
    rgba.copy(out, y * box.width * 4, from, from + box.width * 4);
  }
  return { buffer: encodeRgba(out, box.width, box.height), cropped: true, width: box.width, height: box.height };
}
