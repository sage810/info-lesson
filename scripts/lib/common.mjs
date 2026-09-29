// 공용 도우미 — 빌드/가져오기/검사 스크립트가 함께 쓴다. (외부 패키지 없음)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LESSONS_DIR = path.join(ROOT, 'lessons');
export const SHARED_DIR = path.join(ROOT, 'shared');
export const DIST_DIR = path.join(ROOT, 'dist');
export const MATERIALS_DIR = path.join(ROOT, 'materials');

// 확장자 → data: URI 의 MIME. 가져오기(import) 때 원본 MIME 과 일치하는 경우에만 파일로 뺀다.
export const MIME_BY_EXT = {
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
export const EXT_BY_MIME = {
  'font/woff2': '.woff2', 'font/woff': '.woff', 'font/ttf': '.ttf', 'font/otf': '.otf',
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

// 소스(lesson.html) 안에서 쓰는 표식
//   <script data-msi-src="shared/vendor/x.js"></script>   → 빌드 때 스크립트 본문으로 바뀜
//   msi-asset:shared/fonts/x.woff2 · msi-asset:./assets/y.png → data: URI(embed) 또는 상대 경로(pages)
//   /*NEIS_SNAPSHOT_START*/@msi:neis-snapshot/*NEIS_SNAPSHOT_END*/ → data/neis-snapshot.json 내용
export const SCRIPT_MARKER_RE = /<script data-msi-src="([^"]+)"><\/script>/g;
export const ASSET_MARKER_RE = /msi-asset:([^\s"'()<>]+)/g;
export const SNAPSHOT_MARKER = '/*NEIS_SNAPSHOT_START*/@msi:neis-snapshot/*NEIS_SNAPSHOT_END*/';
export const SNAPSHOT_RE = /\/\*NEIS_SNAPSHOT_START\*\/([\s\S]*?)\/\*NEIS_SNAPSHOT_END\*\//;

export const sha = (buf, n = 8) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, n);
export const readText = (p) => fs.readFileSync(p, 'utf8');
export const writeText = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); };
export const writeBin = (p, b) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); };
export const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// lessons/<unit>/<NN>/lesson.json 이 있는 폴더를 모두 찾는다.
export function listLessons() {
  const out = [];
  if (!fs.existsSync(LESSONS_DIR)) return out;
  for (const unit of fs.readdirSync(LESSONS_DIR).sort()) {
    const ud = path.join(LESSONS_DIR, unit);
    if (!fs.statSync(ud).isDirectory() || unit.startsWith('_')) continue;
    for (const no of fs.readdirSync(ud).sort()) {
      const dir = path.join(ud, no);
      const metaPath = path.join(dir, 'lesson.json');
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(readText(metaPath));
      out.push({ unit, no, id: `${unit}/${no}`, dir, meta, src: path.join(dir, 'lesson.html') });
    }
  }
  return out;
}

// lessons/units.json — 첫 화면의 단원 순서·이름·예정 차시 수. [{ "unit": "ai", "title": "인공지능", "planned": 8 }]
export function loadUnits() {
  const p = path.join(LESSONS_DIR, 'units.json');
  return fs.existsSync(p) ? JSON.parse(readText(p)) : [];
}

// materials/ 의 학습 자료 파일. materials.json 에 적은 순서·제목·설명이 먼저, 안 적은 파일은 파일 이름 순으로 뒤에 붙는다.
//   materials.json: [{ "file": "개념정리.pdf", "title": "데이터 분석 개념 정리", "desc": "1~4차시 핵심" }]
export function listMaterials() {
  if (!fs.existsSync(MATERIALS_DIR)) return [];
  const files = fs.readdirSync(MATERIALS_DIR).sort()
    .filter((f) => f !== 'materials.json' && !f.startsWith('.') && fs.statSync(path.join(MATERIALS_DIR, f)).isFile());
  const metaPath = path.join(MATERIALS_DIR, 'materials.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(readText(metaPath)) : [];
  const out = [];
  for (const m of meta) {
    if (files.includes(m.file)) out.push(m);
    else console.warn(`△ materials.json 에 적은 파일이 materials/ 에 없어요: ${m.file}`);
  }
  for (const f of files) if (!meta.some((m) => m.file === f)) out.push({ file: f });
  return out.map((m) => {
    const src = path.join(MATERIALS_DIR, m.file);
    return { ...m, title: m.title || path.parse(m.file).name, size: fs.statSync(src).size, src };
  });
}

// "06", "data-analysis/06", "data-analysis" 처럼 느슨하게 받은 인자로 차시를 고른다. 비우면 전부.
export function pickLessons(args) {
  const all = listLessons();
  const wanted = args.filter((a) => !a.startsWith('--'));
  if (!wanted.length) return all;
  const picked = all.filter((l) => wanted.some((w) => {
    const x = w.replace(/\\/g, '/').replace(/^lessons\//, '').replace(/\/$/, '');
    return l.id === x || l.no === x || l.no === x.padStart(2, '0') || l.unit === x;
  }));
  if (!picked.length) throw new Error(`차시를 찾지 못했어요: ${wanted.join(', ')} (lessons/ 아래 폴더를 확인하세요)`);
  return picked;
}

// 표식 경로 → 실제 파일 경로. "./" 로 시작하면 그 차시 폴더 기준, 아니면 저장소 루트 기준.
export function resolveMarkerPath(p, lessonDir) {
  return p.startsWith('./') ? path.join(lessonDir, p.slice(2)) : path.join(ROOT, p);
}

export function loadConfig() {
  const p = path.join(ROOT, 'site.config.json');
  return fs.existsSync(p) ? JSON.parse(readText(p)) : {};
}

// 브라우저 실행 — playwright-core 사용. Windows 에서는 설치된 Edge 를 그대로 쓰므로 브라우저를 따로 받을 필요가 없다.
export async function launchBrowser() {
  let pw;
  try { pw = await import('playwright-core'); } catch {
    throw new Error('playwright-core 가 없어요. 저장소 폴더에서 한 번만 `npm install` 을 실행하세요.');
  }
  const { chromium } = pw.default ?? pw;
  const tries = [];
  if (process.env.MSI_BROWSER_PATH) tries.push({ executablePath: process.env.MSI_BROWSER_PATH });
  tries.push({ channel: 'msedge' }, { channel: 'chrome' }, {});
  let lastErr;
  for (const opt of tries) {
    try { return await chromium.launch({ headless: true, ...opt }); } catch (e) { lastErr = e; }
  }
  throw new Error('브라우저를 열지 못했어요. Edge 또는 Chrome 이 설치돼 있는지 확인하거나, '
    + 'MSI_BROWSER_PATH 환경변수로 브라우저 실행 파일 경로를 지정하세요.\n' + lastErr?.message);
}

// dist/pages 를 잠깐 띄우는 정적 서버 (검사용)
export async function serveStatic(dir, port = 0) {
  const http = await import('node:http');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css',
    '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.pdf': 'application/pdf',
    ...MIME_BY_EXT };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r, j) => { server.once('error', j); server.listen(port, '127.0.0.1', r); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}
