// 테마 아이콘 그림 만들기 — 받은 그림(PNG·JPG) → (불투명 단색 바탕이면 가장자리에서 이어진 바탕을 투명하게)
//   → 내용만 정사각형으로 자르기 → 단계적으로 줄이기(기본 128px)
//   node .claude/skills/lesson-theme/references/icon-make.mjs "<입력>" "design/themes/<이름>/icons/<이름>.png" [크기=128]
// 받은 파일은 먼저 scratchpad 의 빈 폴더로 복사해서 넘긴다. 결과는 Read 로 열어(색 바탕 위에서) 테두리에 바탕색이 남았는지 본다.
// 바탕 지우기: 바탕색과 거리 18 미만이면서 가장자리와 이어진 화소만 투명 → 바탕과 닿은 테두리(거리 80 미만)는 반투명 + 색 되돌리기.
//   얼굴처럼 바탕과 비슷한 흰색(분홍 바탕과 거리 ≈29)이 안쪽에 있어도 테두리 선으로 막혀 있으면 지워지지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const [SRC, OUT, SIZE = '128'] = process.argv.slice(2);
if (!SRC || !OUT) { console.error('사용법: node icon-make.mjs "<입력>" "<출력.png>" [크기=128]'); process.exit(1); }
const { launchBrowser } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/common.mjs')).href);
const b = await launchBrowser(); const p = await b.newPage();
const mime = /\.png$/i.test(SRC) ? 'image/png' : /\.webp$/i.test(SRC) ? 'image/webp' : 'image/jpeg';
const b64 = fs.readFileSync(SRC).toString('base64');
const res = await p.evaluate(async ({ b64, mime, size }) => {
  const img = new Image(); img.src = `data:${mime};base64,${b64}`; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, W, H); const d = id.data;
  let removed = 0;
  if (d[3] === 255) {
    const br = d[8], bg = d[9], bb = d[10];
    const dist = (i) => Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb);
    const T1 = 18, T2 = 80;
    const mark = new Uint8Array(W * H); const q = [];
    for (let xx = 0; xx < W; xx++) q.push(xx, (H - 1) * W + xx);
    for (let yy = 0; yy < H; yy++) q.push(yy * W, yy * W + W - 1);
    while (q.length) {
      const k = q.pop(); if (mark[k] || dist(k * 4) >= T1) continue;
      mark[k] = 1; removed++;
      const xx = k % W, yy = (k / W) | 0;
      if (xx > 0) q.push(k - 1); if (xx < W - 1) q.push(k + 1); if (yy > 0) q.push(k - W); if (yy < H - 1) q.push(k + W);
    }
    for (let k = 0; k < W * H; k++) if (mark[k]) d[k * 4 + 3] = 0;
    for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) {
      const k = yy * W + xx; if (mark[k] || !(mark[k - 1] || mark[k + 1] || mark[k - W] || mark[k + W])) continue;
      const i = k * 4, dd = dist(i); if (dd >= T2) continue;
      const a = Math.max(0.05, (dd - T1) / (T2 - T1));
      d[i] = Math.max(0, Math.min(255, (d[i] - br * (1 - a)) / a));
      d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - bg * (1 - a)) / a));
      d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - bb * (1 - a)) / a));
      d[i + 3] = Math.round(a * 255);
    }
    x.putImageData(id, 0, 0);
  }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4 + 3] > 24) {
    if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
  }
  const side = Math.round(Math.max(maxX - minX, maxY - minY) * 1.04);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const s = document.createElement('canvas'); s.width = side; s.height = side;
  s.getContext('2d').drawImage(c, cx - side / 2, cy - side / 2, side, side, 0, 0, side, side);
  let cur = s;
  while (cur.width / 2 >= size) {
    const n = document.createElement('canvas'); n.width = Math.round(cur.width / 2); n.height = n.width;
    const nx = n.getContext('2d'); nx.imageSmoothingQuality = 'high'; nx.drawImage(cur, 0, 0, n.width, n.height); cur = n;
  }
  const f = document.createElement('canvas'); f.width = size; f.height = size;
  const fx = f.getContext('2d'); fx.imageSmoothingQuality = 'high'; fx.drawImage(cur, 0, 0, size, size);
  return { W, H, removed, url: f.toDataURL('image/png') };
}, { b64, mime, size: Number(SIZE) });
await b.close();
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(res.url.split(',')[1], 'base64'));
console.log(`✔ ${path.basename(OUT)} ${SIZE}px · 원본 ${res.W}×${res.H} · 바탕 ${res.removed ? '지움' : '원래 투명'} · ${fs.statSync(OUT).size}B`);
