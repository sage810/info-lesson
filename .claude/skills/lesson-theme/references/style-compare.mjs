// 「테마 없이 바꾸기 전후 같음」 확인 — 차시를 바꾸기 전 사본 · 지금 파일로 각각 그려 4탭 × 1280/390 에서
// 보이는 모든 요소의 계산 스타일(테두리·모서리·그림자·크기·색·글자 크기, ::before/::after 그림자)을 비교한다.
//   node .claude/skills/lesson-theme/references/style-compare.mjs <단원/차시> "<바꾸기 전 lesson.html 사본>"
//   서버가 켜져 있어야 한다: node scripts/serve.mjs (127.0.0.1:8080). 그린 사본은 dist/pages/_preview/ 에 잠깐 두고 지운다.
// 이름표만 붙인 칸(span.app-ic)은 요소 수가 달라지므로 비교에서 뺀다. 움직임은 reducedMotion 으로 끈다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const [id, BEFORE] = process.argv.slice(2);
if (!id || !BEFORE) { console.error('사용법: node style-compare.mjs <단원/차시> "<바꾸기 전 사본>"'); process.exit(1); }
const { renderLesson } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/render.mjs')).href);
const { launchBrowser, DIST_DIR } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/common.mjs')).href);
const dir = path.join(ROOT, 'lessons', id);
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'lesson.json'), 'utf8')); delete meta.theme;
const tag = id.replace(/\W+/g, '-');
const builds = [[`cmp-${tag}-after`, path.join(dir, 'lesson.html')], [`cmp-${tag}-before`, path.resolve(BEFORE)]];
for (const [no, src] of builds) {
  const { html, copies } = renderLesson({ unit: '_preview', no, id: '_preview/' + no, dir, meta, src }, { variant: 'pages', hook: false });
  const out = path.join(DIST_DIR, 'pages', '_preview', no); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  for (const c of copies) { const to = path.join(DIST_DIR, 'pages', ...c.to.split('/')); fs.mkdirSync(path.dirname(to), { recursive: true }); if (!fs.existsSync(to)) fs.copyFileSync(c.from, to); }
}
const PROPS = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'width', 'height', 'backgroundColor', 'color', 'fontSize', 'outlineWidth'];
const b = await launchBrowser();
async function collect(no, w, tab) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(`http://127.0.0.1:8080/_preview/${no}/`, { waitUntil: 'load' }); await p.waitForTimeout(900);
  await p.locator('.tab-chip:visible', { hasText: tab }).first().click(); await p.waitForTimeout(900);
  const r = await p.evaluate((PROPS) => {
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
