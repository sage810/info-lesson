// PDF 쪽마다 글자(있으면)와 그림(PNG)을 뽑는다 — 이 PC 에는 Python·poppler 가 없어서 pdf.js(Node)로 읽는다.
// 저장소 빌드와 상관없는 도구라, pdf.js 는 scratchpad 에만 설치해서 쓴다 (from-pdf.md §1 참고).
//
//   cd <scratchpad>/pdf && npm init -y && npm i pdfjs-dist@4
//   cp ".claude/skills/lesson-new/references/pdf-pages.mjs" <scratchpad>/pdf/
//   node pdf-pages.mjs "<PDF 경로>" "<출력 접두어>" 1400
//     → <접두어>.txt (쪽별 글자·그림 수) · <접두어>-1.png, -2.png … (쪽의 가장 큰 그림을 가로 1400px 이하로)
//
// 한계: 쪽 전체가 그림 한 장(스캔·저장본)인 PDF 에 맞춘 도구. 글자·도형으로 된 쪽은 .txt 로 글자만 나오고
// 그림으로 "렌더링"하지는 않는다(캔버스 없음).
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const [file, prefix, maxWArg] = process.argv.slice(2);
if (!file || !prefix) { console.error('사용법: node pdf-pages.mjs <PDF> <출력 접두어> [최대 폭=1400]'); process.exit(1); }
const maxW = Number(maxWArg || 1400);

function crcTable() { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; }
const CRC = crcTable();
const crc = (b) => { let r = 0xffffffff; for (const x of b) r = CRC[(r ^ x) & 0xff] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
// 원본 그림(RGB/RGBA/회색)을 RGBA 로 바꾸면서 가로 maxW 이하로 줄인다(박스 평균)
function toPng(img) {
  const { width: W, height: H, kind, data: src } = img;
  const ch = kind === 3 ? 4 : kind === 2 ? 3 : 1;
  const s = Math.max(1, W / maxW), w = Math.round(W / s), h = Math.round(H / s);
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.floor(x * s), x1 = Math.max(x0 + 1, Math.floor((x + 1) * s));
    const y0 = Math.floor(y * s), y1 = Math.max(y0 + 1, Math.floor((y + 1) * s));
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const p = (yy * W + xx) * ch;
      if (ch === 1) { r += src[p]; g += src[p]; b += src[p]; } else { r += src[p]; g += src[p + 1]; b += src[p + 2]; }
      n++;
    }
    const o = (y * w + x) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
  }
  return { w, h, buf: png(w, h, out), W, H };
}

const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
let txt = `쪽 수: ${doc.numPages}\n`;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const lines = []; let lastY = null;
  for (const it of tc.items) {
    if (!('str' in it)) continue;
    const y = Math.round(it.transform[5]);
    if (lastY === null || Math.abs(y - lastY) > 3) { lines.push(''); lastY = y; }
    lines[lines.length - 1] += it.str;
  }
  const ops = await page.getOperatorList();
  const names = ops.fnArray.map((f, k) => (f === pdfjs.OPS.paintImageXObject ? ops.argsArray[k][0] : null)).filter(Boolean);
  let best = null;
  for (const name of names) {
    const img = await new Promise((res) => page.objs.get(name, res));
    if (img && img.data && (!best || img.width * img.height > best.width * best.height)) best = img;
  }
  let note = '';
  if (best) { const r = toPng(best); fs.writeFileSync(`${prefix}-${i}.png`, r.buf); note = ` · 그림 ${r.W}x${r.H} → ${prefix}-${i}.png (${r.w}x${r.h})`; }
  txt += `\n===== ${i}쪽 (${Math.round(vp.width)}x${Math.round(vp.height)}, 글자 조각 ${tc.items.length}, 그림 ${names.length}${note}) =====\n`
    + lines.map((l) => l.trim()).filter(Boolean).join('\n') + '\n';
}
fs.writeFileSync(`${prefix}.txt`, txt, 'utf8');
console.log(txt.split('\n').filter((l) => l.startsWith('=====') || l.startsWith('쪽 수')).join('\n'));
