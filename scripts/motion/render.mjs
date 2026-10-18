#!/usr/bin/env node
// 수업용 모션그래픽(lessons/<단원>/<차시>/motion/index.html) → 장면 캡처 · 한눈에 보기 · MP4
//
//   npm run motion -- ai/01 --snap 0,3.5,12          장면 PNG(초) → dist/motion/<단원>-<차시>/snap/t003.50.png
//   npm run motion -- ai/01 --sheet 5                 5초마다 한 장씩 격자 → sheet.png
//   npm run motion -- ai/01 --mp4 [--fps 30] [--qp 24] [--from 0 --to 20] [--out 파일]
//
// 원리: 페이지의 모든 움직임이 WAAPI 한 시계(window.__motion.seek)에 걸려 있어 프레임마다 시각을 정해 캡처한다(실시간 녹화 아님 → 프레임 빠짐 없음).
// MP4 는 같은 브라우저의 인코더 페이지(enc.html)가 WebCodecs H.264 + mp4-muxer 로 만든다 — 이 PC 에 ffmpeg 가 없어도 된다.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { ROOT as ROOT_DIR, DIST_DIR, SHARED_DIR, launchBrowser } from '../lib/common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const id = args.find(a => !a.startsWith('--'));
if (!id || !/^[\w-]+\/[\w-]+$/.test(id)) { console.error('쓰는 법: npm run motion -- <단원>/<차시> --snap 0,5 | --sheet 5 | --mp4'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const has = k => args.includes(k);
const [unit, no] = id.split('/');
const motionDir = path.join(ROOT_DIR, 'lessons', unit, no, 'motion');
if (!fs.existsSync(path.join(motionDir, 'index.html'))) { console.error('없음:', path.join(motionDir, 'index.html')); process.exit(1); }
const outDir = path.join(DIST_DIR, 'motion', `${unit}-${no}`);
fs.mkdirSync(outDir, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f;
  if (u === '/__enc.html') f = path.join(HERE, 'enc.html');
  else if (u === '/__mp4-muxer.js') f = path.join(HERE, 'vendor', 'mp4-muxer.js');
  else if (u.startsWith('/fonts/')) f = path.join(SHARED_DIR, 'fonts', u.slice(7));
  else f = path.join(motionDir, u === '/' ? 'index.html' : u.slice(1));
  if (!f.startsWith(ROOT_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('페이지 오류:', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('콘솔 오류:', m.text()); });
await page.goto(`${base}/?render=1`, { waitUntil: 'load' });
await page.evaluate(() => window.__motion.ready);
const duration = await page.evaluate(() => window.__motion.duration);
const fontsOk = await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.weight}:${f.status}`));
console.log(`길이 ${(duration / 1000).toFixed(1)}초 · 글꼴 ${fontsOk.filter(s => s.endsWith('loaded')).length}/${fontsOk.length} 로드`);
const bad = fontsOk.filter(s => !s.endsWith('loaded')); if (bad.length) console.warn('글꼴 안 됨:', bad.join(', '));
const cdp = await ctx.newCDPSession(page);
async function frameAt(ms) {
  await page.evaluate(ms => window.__motion.seek(ms), ms);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return data;   // base64
}
const tName = s => `t${s.toFixed(2).padStart(6, '0')}`;

if (has('--snap')) {
  const dir = path.join(outDir, 'snap'); fs.mkdirSync(dir, { recursive: true });
  for (const s of opt('--snap', '0').split(',').map(Number)) {
    const f = path.join(dir, `${tName(s)}.png`); fs.writeFileSync(f, Buffer.from(await frameAt(s * 1000), 'base64')); console.log('장면', s + '초 →', path.relative(ROOT_DIR, f));
  }
}

if (has('--sheet')) {
  const step = Number(opt('--sheet', '5')) || 5, cols = Number(opt('--cols', '4')) || 4;
  const times = []; for (let s = 0; s < duration / 1000; s += step) times.push(s);
  const encPage = await ctx.newPage(); await encPage.goto(`${base}/__enc.html`);
  await encPage.evaluate(([n, c]) => window.sheet.start(n, c, 480, 270), [times.length, cols]);
  for (const s of times) { const b64 = await frameAt(s * 1000); await encPage.evaluate(([b, l]) => window.sheet.add(b, l), [b64, s + 's']); }
  const f = path.join(outDir, 'sheet.png'); await encPage.locator('#sheet').screenshot({ path: f });
  console.log(`한눈에 보기(${times.length}장, ${step}초마다) →`, path.relative(ROOT_DIR, f)); await encPage.close();
}

if (has('--mp4')) {
  const fps = Number(opt('--fps', '30')) || 30, qp = Number(opt('--qp', '24')) || 0, bitrate = Number(opt('--bitrate', '0')) || 0;
  const from = Number(opt('--from', '0')) || 0, to = Math.min(duration / 1000, Number(opt('--to', '1e9')) || duration / 1000);
  const total = Math.max(1, Math.round((to - from) * fps));
  const out = path.resolve(ROOT_DIR, opt('--out', path.join(outDir, `정보수업_${unit}_${no}차시_모션그래픽.mp4`)));
  const encPage = await ctx.newPage(); await encPage.goto(`${base}/__enc.html`);
  encPage.on('pageerror', e => console.error('인코더 오류:', e.message));
  const cfg = await encPage.evaluate(o => window.enc.start(o), { width: 1920, height: 1080, fps, qp, bitrate });
  console.log(`MP4 만들기: ${from}~${to.toFixed(1)}초 · ${fps}fps · ${total}장 · ${cfg.bitrateMode === 'quantizer' ? 'QP ' + qp : (cfg.bitrate) + 'bps ' + cfg.bitrateMode} · ${cfg.codec} · ${cfg.hardwareAcceleration || 'hw/sw 자동'}`);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const b64 = await frameAt((from + i / fps) * 1000);
    await encPage.evaluate(b => window.enc.add(b), b64);
    if (i % (fps * 5) === 0 && i) { const el = (Date.now() - t0) / 1000; process.stdout.write(`  ${i}/${total} (${(i / el).toFixed(1)} 장/초, 남은 ${((total - i) / (i / el) / 60).toFixed(1)}분)\n`); }
  }
  const bytes = await encPage.evaluate(() => window.enc.finish());
  const CH = 4 * 1024 * 1024; const parts = [];
  for (let o = 0; o < bytes; o += CH) parts.push(Buffer.from(await encPage.evaluate(([o, n]) => window.enc.chunk(o, n), [o, CH]), 'base64'));
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.concat(parts));
  console.log(`MP4 → ${path.relative(ROOT_DIR, out)} (${(bytes / 1024 / 1024).toFixed(1)}MB, ${((Date.now() - t0) / 60000).toFixed(1)}분 걸림)`);
  await encPage.close();
}

await browser.close(); srv.close();

/* ── 받는 링크용 페이지(아티팩트): 문서 껍데기(doctype·html·head·body)를 걷어 낸 본문 + 글꼴은 딸린 파일로 ── */
if (has('--page')) {
  const siteDir = path.join(outDir, 'site'); fs.mkdirSync(siteDir, { recursive: true });
  let html = fs.readFileSync(path.join(motionDir, 'index.html'), 'utf8');
  html = html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
    .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
    .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
  const siteFile = path.join(siteDir, 'index.html'); fs.writeFileSync(siteFile, html);
  const fonts = ['GangwonEdu-400', 'CookieRun-400', 'CookieRun-700', 'Maplestory-300', 'Maplestory-700', 'Silkscreen-400', 'Silkscreen-700'];
  const files = {}; for (const f of fonts) files[`fonts/${f}.woff2`] = `shared/fonts/${f}.woff2`;
  /* --with motion.mp4=dist/motion/ai-01/….mp4  → 딸린 파일(올린 이름=경로). MP4 는 15MB 아래여야 올라간다 */
  let withMp4 = false;
  for (const extra of (opt('--with', '') ? opt('--with', '').split(',') : [])) {
    const [name, src] = extra.includes('=') ? extra.split('=') : [path.basename(extra), extra];
    const abs = path.resolve(ROOT_DIR, src); if (!fs.existsSync(abs)) { console.error('없음:', src); continue; }
    const mb = fs.statSync(abs).size / 1024 / 1024; if (mb > 15) { console.error(`${src} 는 ${mb.toFixed(1)}MB — 딸린 파일 한도(15MB)를 넘어 못 올림`); continue; }
    files[name] = path.relative(ROOT_DIR, abs).split(path.sep).join('/'); if (name === 'motion.mp4') withMp4 = true;
  }
  console.log('받는 링크 페이지 →', path.relative(ROOT_DIR, siteFile));
  const pub = { file_path: path.relative(ROOT_DIR, siteFile).split(path.sep).join('/'), files, icon: 'film' };
  if (withMp4) pub.capabilities = { downloads: true };
  console.log('Artifact 게시:', JSON.stringify(pub, null, 1));
}
