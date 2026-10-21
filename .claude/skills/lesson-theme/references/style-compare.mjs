// 「테마 없이 바꾸기 전후 같음」 확인 — 차시를 바꾸기 전 사본 · 지금 파일로 각각 그려 4탭 × 1280/390 에서
// 보이는 모든 요소의 계산 스타일(테두리·모서리·그림자·크기·색·글자 크기, ::before/::after 그림자)을 비교한다.
//   node .claude/skills/lesson-theme/references/style-compare.mjs <단원/차시> "<바꾸기 전 lesson.html 사본>"
//   node .claude/skills/lesson-theme/references/style-compare.mjs <단원/차시> "<바꾸기 전 present.html 사본>" --present
//     → 수업용 화면: 1600×900 에서 모든 장을 정답 가림 · 모두 열림 두 번씩 비교(window.__present)
//   서버가 켜져 있어야 한다: node scripts/serve.mjs (127.0.0.1:8080). 그린 사본은 dist/pages/_preview/ 에 잠깐 두고 지운다.
// 이름표만 붙인 칸(span.app-ic)은 요소 수가 달라지므로 비교에서 뺀다. 움직임은 reducedMotion 으로 끈다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const PRESENT = argv.includes('--present');
const [id, BEFORE] = argv.filter((a) => !a.startsWith('--'));
if (!id || !BEFORE) { console.error('사용법: node style-compare.mjs <단원/차시> "<바꾸기 전 사본>" [--present]'); process.exit(1); }
const { renderLesson, renderPage } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/render.mjs')).href);
const { launchBrowser, DIST_DIR } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/common.mjs')).href);
const dir = path.join(ROOT, 'lessons', id);
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'lesson.json'), 'utf8')); delete meta.theme;
const tag = id.replace(/\W+/g, '-');
const PAGE = PRESENT ? 'present.html' : 'index.html';
const builds = [[`cmp-${tag}-after`, path.join(dir, PRESENT ? 'present.html' : 'lesson.html')], [`cmp-${tag}-before`, path.resolve(BEFORE)]];
for (const [no, src] of builds) {
  const lesson = { unit: '_preview', no, id: '_preview/' + no, dir, meta, src };
  const { html, copies } = PRESENT ? renderPage(lesson, src) : renderLesson(lesson, { variant: 'pages', hook: false });
  const out = path.join(DIST_DIR, 'pages', '_preview', no); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, PAGE), html);
  for (const c of copies) { const to = path.join(DIST_DIR, 'pages', ...c.to.split('/')); fs.mkdirSync(path.dirname(to), { recursive: true }); if (!fs.existsSync(to)) fs.copyFileSync(c.from, to); }
}
const PROPS = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'width', 'height', 'backgroundColor', 'color', 'fontSize', 'outlineWidth'];
const b = await launchBrowser();
const grab = (p) => p.evaluate((PROPS) => {
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('[data-msi-memo]') || e.classList.contains('app-ic')) continue;
      const cs = getComputedStyle(e); if (cs.display === 'none') continue;
      const a = getComputedStyle(e, '::after'), bf = getComputedStyle(e, '::before');
      out.push(e.tagName + '.' + (typeof e.className === 'string' ? e.className : '') + ' ' + PROPS.map((k) => cs[k]).join('|')
        + ' ::a ' + a.boxShadow + a.borderRadius + ' ::b ' + bf.boxShadow + bf.borderRadius + bf.borderTopWidth);
    }
    return out;
  }, PROPS);
if (PRESENT) {
  const open = async (no) => {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' });
    await p.goto(`http://127.0.0.1:8080/_preview/${no}/present.html`, { waitUntil: 'load' }); await p.waitForTimeout(900);
    return p;
  };
  const A = await open(builds[0][0]), B = await open(builds[1][0]);
  const n = await A.evaluate(() => window.__present.count);
  let bad = 0;
  for (let i = 0; i < n; i++) for (const reveal of [false, true]) {
    const sa = [], sb = [];
    for (const [p, arr] of [[A, sa], [B, sb]]) {
      await p.evaluate(([i, r]) => { window.__present.go(i); if (r) window.__present.revealAll(true); }, [i, reveal]);
      await p.waitForTimeout(250); arr.push(...await grab(p));
    }
    const d = sa.length !== sb.length ? [`요소 수 ${sa.length} vs ${sb.length}`] : sa.map((x, k) => x === sb[k] ? null : `#${k}\n     후 ${x.slice(0, 220)}\n     전 ${sb[k].slice(0, 220)}`).filter(Boolean);
    if (d.length) { console.log(`${i + 1}장 ${reveal ? '모두 열림' : '가림'}: 다름 ${d.length}`); d.slice(0, 3).forEach((x) => console.log('   ' + x)); bad += d.length; }
  }
  console.log(`수업용 화면 ${n}장 × 가림/열림 비교 끝`);
  await b.close();
  for (const [no] of builds) fs.rmSync(path.join(DIST_DIR, 'pages', '_preview', no), { recursive: true, force: true });
  console.log(bad ? '✖ 다른 곳 있음' : '✔ 전후 계산 스타일 같음');
  process.exit(bad ? 1 : 0);
}
async function collect(no, w, tab) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(`http://127.0.0.1:8080/_preview/${no}/`, { waitUntil: 'load' }); await p.waitForTimeout(900);
  await p.locator('.tab-chip:visible', { hasText: tab }).first().click(); await p.waitForTimeout(900);
  const r = await grab(p);
  await p.close(); return r;
}
let bad = 0;
for (const w of [1280, 390]) for (const tab of ['이용 규칙', '시간표', '오늘의 급식', '수업 활동지']) {
  const A = await collect(builds[0][0], w, tab), B = await collect(builds[1][0], w, tab);
  const diffs = [];
  if (A.length !== B.length) diffs.push(`요소 수 ${A.length} vs ${B.length}`);
  for (let i = 0; i < Math.min(A.length, B.length); i++) if (A[i] !== B[i]) diffs.push(`#${i}\n     후 ${A[i].slice(0, 260)}\n     전 ${B[i].slice(0, 260)}`);
  console.log(`${w}px ${tab}: 요소 ${A.length}개 — ${diffs.length ? '다름 ' + diffs.length : '모두 같음'}`);
  diffs.slice(0, 3).forEach((d) => console.log('   ' + d)); bad += diffs.length;
}
await b.close();
for (const [no] of builds) fs.rmSync(path.join(DIST_DIR, 'pages', '_preview', no), { recursive: true, force: true });
console.log(bad ? '✖ 다른 곳 있음 — 앞쪽 몇 개가 한 칸씩 밀렸으면 요소가 하나 더 생긴 것' : '✔ 전후 계산 스타일 같음');
process.exit(bad ? 1 : 0);
