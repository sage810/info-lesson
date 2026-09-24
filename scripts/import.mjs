#!/usr/bin/env node
// 완성된 "한 파일짜리" 활동지 HTML(구글 사이트 붙여넣기용, 3~4MB)을 가져와
// lessons/<단원>/<차시>/lesson.html(작은 소스) + shared/(폰트·라이브러리·공용 이미지) 로 나눈다.
// 나눈 뒤 곧바로 다시 합쳐서(raw 빌드) 원본과 바이트 단위로 같은지 확인한다 — 다르면 실패.
//
//   npm run import -- <원본.html> <단원>/<차시> [--title "제목"] [--unit-title "단원 이름"]
//   예) npm run import -- "C:/Users/.../data6.html" data-analysis/06 --title "데이터 시각화 ②"
//
// 이미 있는 차시에 가져오면 lesson.html·assets 만 교체하고 lesson.json·answers.json·spec 은 그대로 둔다.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, LESSONS_DIR, SHARED_DIR, SNAPSHOT_RE, SNAPSHOT_MARKER, EXT_BY_MIME,
  sha, readText, writeText, writeBin, rel, listLessons,
} from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';

// ---- 공용 스크립트 알아보기 --------------------------------------------------------------
// 본문 앞부분에 이 문자열이 있으면 라이브러리로 보고 shared/vendor 로 뺀다.
const VENDOR_SIGNATURES = [
  ['react.production.min.js', 'shared/vendor/react.production.min.js'],
  ['react-dom.production.min.js', 'shared/vendor/react-dom.production.min.js'],
  ['html2canvas 1.4.1', 'shared/vendor/html2canvas.min.js'],
  ['jsPDF - PDF Document creation', 'shared/vendor/jspdf.umd.min.js'],
  ['GENERATED from dc-runtime', 'shared/vendor/dc-runtime.js'],
];
// 여러 활동지가 똑같이 쓰는 동작 스크립트. "완전히 똑같을 때만" 공용으로 뺀다.
const PARTIAL_SIGNATURES = [
  ['var STEP_TEXT', 'shared/partials/seq-order.js'],
  ["SEL_CHIP = '.ca-chip'", 'shared/partials/chip-slot.js'],
  ['function grow(el)', 'shared/partials/autogrow.js'],
  ['paste-empty', 'shared/partials/paste-zone.js'],
];

function findShared(body, table) {
  const head = body.slice(0, 400);
  for (const [sig, p] of table) if (head.includes(sig) || (table === PARTIAL_SIGNATURES && body.includes(sig))) return p;
  return null;
}

// 같은 이름이 이미 있고 내용이 다르면 이름 뒤에 해시를 붙인다(라이브러리 판본 차이 보존).
function placeShared(relPath, content) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) { (Buffer.isBuffer(content) ? writeBin : writeText)(abs, content); return relPath; }
  const cur = fs.readFileSync(abs);
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  if (cur.equals(buf)) return relPath;
  const ext = path.extname(relPath);
  const alt = relPath.slice(0, -ext.length) + '-' + sha(buf) + ext;
  const altAbs = path.join(ROOT, alt);
  if (!fs.existsSync(altAbs)) (Buffer.isBuffer(content) ? writeBin : writeText)(altAbs, content);
  return alt;
}

// input/ 아래 원본 이미지와 내용이 같으면 그 이름을 그대로 쓴다.
let inputIndex = null;
function inputNameFor(buf) {
  if (!inputIndex) {
    inputIndex = new Map();
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      for (const n of fs.readdirSync(d)) {
        const p = path.join(d, n);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (/\.(png|jpe?g|gif|webp)$/i.test(n) && st.size < 20e6) inputIndex.set(sha(fs.readFileSync(p), 40), n);
      }
    };
    walk(path.join(ROOT, 'input'));
  }
  return inputIndex.get(sha(buf, 40)) || null;
}
const safeName = (n) => n.normalize('NFC').replace(/[\s()'"<>]+/g, '_');

// 다른 차시(또는 shared/images)에 이미 같은 그림이 있는지
function existingSharedImage(buf) {
  const d = path.join(SHARED_DIR, 'images');
  if (!fs.existsSync(d)) return null;
  for (const n of fs.readdirSync(d)) if (fs.readFileSync(path.join(d, n)).equals(buf)) return `shared/images/${n}`;
  return null;
}

/**
 * @param srcFile   가져올 원본 HTML
 * @param lessonId  "data-analysis/06"
 * @param meta      lesson.json 에 넣을 값(처음 만들 때만)
 * @param sharedImageHashes  여러 파일을 한꺼번에 가져올 때 "두 번 이상 쓰인 그림" 목록
 */
export function importLesson(srcFile, lessonId, meta = {}, sharedImageHashes = new Set()) {
  const original = readText(srcFile);
  const [unit, no] = lessonId.split('/');
  if (!unit || !no) throw new Error('차시는 "<단원>/<번호>" 형식으로 적어요. 예: data-analysis/06');
  const dir = path.join(LESSONS_DIR, unit, no);
  const report = { vendor: [], partials: [], fonts: 0, images: { shared: 0, local: 0 }, snapshot: false };

  // 0) 스크립트 블록부터 (라이브러리 안에 들어있는 작은 data: 이미지가 따로 빠지지 않도록 먼저 처리)
  let html = original.replace(/<script>([\s\S]*?)<\/script>/g, (m, body) => {
    const v = findShared(body, VENDOR_SIGNATURES);
    if (v) { const p = placeShared(v, body); report.vendor.push(p); return `<script data-msi-src="${p}"></script>`; }
    const pp = findShared(body, PARTIAL_SIGNATURES);
    if (pp) {
      const abs = path.join(ROOT, pp);
      // 공용 조각은 "이미 있는 것과 완전히 같을 때" 또는 "아직 없을 때"만 연결. 다르면 그 차시 안에 그대로 둔다.
      if (!fs.existsSync(abs)) { writeText(abs, body); report.partials.push(pp); return `<script data-msi-src="${pp}"></script>`; }
      if (readText(abs) === body) { report.partials.push(pp); return `<script data-msi-src="${pp}"></script>`; }
    }
    return m;
  });

  // 1) NEIS 스냅샷 (시간표·급식 미리 받아둔 데이터) → data/neis-snapshot.json 하나로
  const snap = html.match(SNAPSHOT_RE);
  if (snap) {
    const snapFile = path.join(ROOT, 'data', 'neis-snapshot.json');
    const cur = fs.existsSync(snapFile) ? readText(snapFile).replace(/\s+$/, '') : null;
    if (cur === null) writeText(snapFile, snap[1]);
    if (cur === null || cur === snap[1]) { html = html.replace(snap[0], () => SNAPSHOT_MARKER); report.snapshot = true; }
  }

  // 2) 스크립트 밖의 data: 파일 (폰트·이미지)
  const oldAssets = path.join(dir, 'assets');
  const newAssets = [];
  html = html.replace(/data:([a-z]+\/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g, (m, mime, b64, offset) => {
    const ext = EXT_BY_MIME[mime];
    if (!ext) return m;
    const buf = Buffer.from(b64, 'base64');
    if (buf.toString('base64') !== b64) return m; // 표준 형식이 아니면 그대로 둔다(되돌렸을 때 달라지므로)
    if (mime.startsWith('font/')) {
      const before = html.slice(Math.max(0, offset - 600), offset);
      const face = before.slice(before.lastIndexOf('@font-face'));
      const fam = (face.match(/font-family:\s*['"]?([^'";]+)/) || [])[1] || 'font';
      const wt = (face.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
      report.fonts++;
      return 'msi-asset:' + placeShared(`shared/fonts/${safeName(fam)}-${wt}${ext}`, buf);
    }
    const already = existingSharedImage(buf);
    const name = safeName(inputNameFor(buf)?.replace(/\.[^.]+$/, '') || `img-${sha(buf)}`) + ext;
    if (already) { report.images.shared++; return 'msi-asset:' + already; }
    if (sharedImageHashes.has(sha(buf, 40))) { report.images.shared++; return 'msi-asset:' + placeShared(`shared/images/${name}`, buf); }
    // 차시 안의 assets/ — 이름이 겹치면 해시를 붙인다
    let fname = name;
    const clash = newAssets.find((a) => a.name === fname && !a.buf.equals(buf));
    if (clash) fname = fname.replace(ext, `-${sha(buf)}${ext}`);
    if (!newAssets.some((a) => a.name === fname)) newAssets.push({ name: fname, buf });
    report.images.local++;
    return `msi-asset:./assets/${fname}`;
  });

  // 3) 쓰기 — 기존 assets 는 새로 만든 것으로 교체
  fs.rmSync(oldAssets, { recursive: true, force: true });
  for (const a of newAssets) writeBin(path.join(oldAssets, a.name), a.buf);
  writeText(path.join(dir, 'lesson.html'), html);
  const metaPath = path.join(dir, 'lesson.json');
  if (!fs.existsSync(metaPath)) {
    writeText(metaPath, JSON.stringify({
      unit, unitTitle: meta.unitTitle || unit, no, title: meta.title || `${no}차시`,
      shell: meta.shell || guessShell(original), status: 'live',
      importedFrom: meta.importedFrom || path.basename(srcFile),
    }, null, 2) + '\n');
  }

  // 4) 되돌려 보기 — 원본과 1바이트라도 다르면 실패
  const lesson = listLessons().find((l) => l.id === lessonId);
  const { html: rebuilt } = renderLesson(lesson, { variant: 'embed', raw: true });
  if (rebuilt !== original) {
    let i = 0; while (i < rebuilt.length && rebuilt[i] === original[i]) i++;
    throw new Error(`[${lessonId}] 되돌린 결과가 원본과 달라요 (위치 ${i}): ...${JSON.stringify(original.slice(i, i + 80))}`);
  }
  report.size = { original: Buffer.byteLength(original), source: Buffer.byteLength(html) };
  return report;
}

function guessShell(html) {
  if (html.includes('id="neis-snapshot"') || html.includes('NEIS_SNAPSHOT_START')) return 'portal';
  if (html.includes('data-dc-script')) return 'sheet';
  return 'standalone';
}

// ---- 명령줄 ----------------------------------------------------------------------------
function parseArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { opt[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
    else pos.push(a);
  }
  return { pos, opt };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('import.mjs')) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  try {
    let jobs;
    if (opt.batch) {
      // { "jobs": [ { "file": "...", "lesson": "data-analysis/04", "title": "...", "unitTitle": "..." } ] }
      jobs = JSON.parse(readText(path.resolve(opt.batch))).jobs;
    } else {
      if (pos.length < 2) {
        console.log('사용법: npm run import -- <원본.html> <단원>/<차시> [--title "제목"] [--unit-title "단원 이름"]');
        process.exit(1);
      }
      jobs = [{ file: pos[0], lesson: pos[1], title: opt.title, unitTitle: opt['unit-title'] }];
    }
    // 두 개 이상의 파일에 똑같이 들어있는 그림은 shared/images 로
    const counts = new Map();
    for (const j of jobs) {
      const seen = new Set();
      for (const m of readText(path.resolve(ROOT, j.file)).matchAll(/data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/=]+)/g)) {
        const h = sha(Buffer.from(m[1], 'base64'), 40);
        if (!seen.has(h)) { seen.add(h); counts.set(h, (counts.get(h) || 0) + 1); }
      }
    }
    const shared = new Set([...counts].filter(([, n]) => n > 1).map(([h]) => h));
    for (const j of jobs) {
      const file = path.resolve(ROOT, j.file);
      const r = importLesson(file, j.lesson, { title: j.title, unitTitle: j.unitTitle, importedFrom: rel(file) }, shared);
      const kb = (n) => (n / 1024).toFixed(0) + 'KB';
      console.log(`✔ ${j.lesson}  ${kb(r.size.original)} → 소스 ${kb(r.size.source)}  `
        + `(라이브러리 ${r.vendor.length} · 공용조각 ${r.partials.length} · 폰트 ${r.fonts} · 그림 공용 ${r.images.shared}/차시 ${r.images.local}`
        + `${r.snapshot ? ' · NEIS 스냅샷' : ''}) — 원본과 바이트 단위로 동일 확인`);
    }
  } catch (e) {
    console.error('✖ ' + e.message);
    process.exit(1);
  }
}
