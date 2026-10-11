#!/usr/bin/env node
// tokens.json(원본) → tokens.css. 값을 고칠 땐 tokens.json 만 고치고 `node design/build.mjs` 를 돌린다.
// 이름: color.ink → --msi-ink · font.body → --msi-font-body · font-size.body → --msi-fs-body · radius.card → --msi-radius-card …
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
const PREFIX = {
  color: '', font: 'font-', 'font-size': 'fs-', 'line-height': 'lh-', space: 'space-', size: 'size-',
  'border-width': 'bw-', radius: 'radius-', shadow: 'shadow-', gradient: 'gradient-', focus: 'focus-', duration: 'duration-',
};
const varName = (group, name) => `--msi-${PREFIX[group]}${name}`;
const alias = (v) => String(v).replace(/\{([\w-]+)\.([\w-]+)\}/g, (_, g, n) => `var(${varName(g, n)})`);

function cssValue(type, v) {
  if (type === 'fontFamily') return v.map((f) => (/^(sans-serif|serif|monospace)$/.test(f) ? f : `'${f}'`)).join(',');   // 일반 이름만 따옴표 없이
  if (type === 'shadow') {
    const z = (x) => (x === '0px' ? '0' : x);
    return `${v.offsetX} ${v.offsetY} ${z(v.blur)}${v.spread && v.spread !== '0px' ? ' ' + v.spread : ''} ${alias(v.color)}`;
  }
  if (type === 'gradient') return `linear-gradient(90deg,${v.map((s) => `${alias(s.color)} ${Math.round(s.position * 100)}%`).join(',')})`;
  return alias(v);
}

const lines = [];
for (const [group, body] of Object.entries(tokens)) {
  if (group.startsWith('$')) continue;
  if (!(group in PREFIX)) throw new Error('모르는 묶음: ' + group);
  lines.push(`  /* ${group} */`);
  for (const [name, t] of Object.entries(body)) {
    if (name.startsWith('$')) continue;
    const note = t.$description ? `   /* ${t.$description} */` : '';
    lines.push(`  ${varName(group, name)}: ${cssValue(body.$type, t.$value)};${note}`);
  }
}

const fonts = [
  ['GangwonEdu', 400, 'GangwonEdu-400'], ['CookieRun', 400, 'CookieRun-400'], ['CookieRun', 700, 'CookieRun-700'],
  ['Maplestory', 300, 'Maplestory-300'], ['Maplestory', 700, 'Maplestory-700'],
  ['Silkscreen', 400, 'Silkscreen-400', 'U+0000-00FF,U+2000-206F'], ['Silkscreen', 700, 'Silkscreen-700', 'U+0000-00FF,U+2000-206F'],
].map(([fam, w, file, range]) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;${range ? `unicode-range:${range};` : ''}src:url('fonts/${file}.woff2') format('woff2');}`);

const css = `/* 신현중 정보 수업 활동지 디자인 토큰 — 자동 생성(design/build.mjs). 직접 고치지 말고 tokens.json 을 고친다.
   원본 규칙: docs/rules/design.md · 쓰는 법: design/README.md
   폰트 경로는 이 파일 기준 fonts/ — 다른 곳에 두면 url() 을 맞춘다. */

${fonts.join('\n')}

:root{
${lines.join('\n')}
}

@keyframes msi-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
`;
fs.writeFileSync(path.join(dir, 'tokens.css'), css);
console.log(`✔ design/tokens.css — 변수 ${lines.filter((l) => l.includes('--msi-')).length}개`);

// ── 미리보기(preview.html) — 색 견본은 tokens.json 에서 바로 만들어 토큰과 어긋나지 않게 ──
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const swatches = Object.entries(tokens.color).filter(([n]) => !n.startsWith('$') && !/^shadow|^divider/.test(n))
  .map(([n, t]) => `<div class="sw"><i style="background:var(${varName('color', n)})"></i><b>${n}</b><code>${esc(t.$value)}</code></div>`).join('\n');
const sizes = Object.entries(tokens['font-size']).filter(([n]) => !n.startsWith('$'))
  .map(([n, t]) => `<div style="font-size:var(${varName('font-size', n)})"><code>${n} · ${t.$value}</code> 데이터로 생각해요</div>`).join('\n');
const preview = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>디자인 토큰 미리보기</title>
<link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="components.css">
<style>/* 미리보기 전용 */
.sw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.sw{display:grid;gap:2px;font-size:12px}.sw i{display:block;height:44px;border:3px solid var(--msi-ink);border-radius:9px}
.sw b{font-family:var(--msi-font-round)}.sw code{color:var(--msi-muted-2)}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
</style></head>
<body style="margin:0">
<!-- 자동 생성(design/build.mjs). 고칠 땐 tokens.json · components.css 를 고치고 node design/build.mjs -->
<div class="msi-page"><div class="msi-wrap">
<div class="msi-window">
  <div class="msi-titlebar"><div class="msi-win-title">🏫 디자인 토큰 미리보기</div><div class="msi-spacer"></div>
    <span class="msi-tag" style="background:var(--msi-purple)">DESIGN_TOKENS</span>
    <div class="msi-win-btns"><span>_</span><span>□</span><span class="x">X</span></div></div>
  <div class="msi-win-body">
    <section class="msi-topic"><div class="msi-topic-bar">TODAY_TOPIC</div>
      <div class="msi-topic-in"><div class="msi-eyebrow">INFO · DESIGN</div><h1 class="msi-h1">레트로 프로그램 창 디자인</h1>
      <p style="margin:0">두꺼운 남보라 테두리 + 블러 없는 하드 섀도우 + 파스텔 격자 배경.</p></div></section>

    <section class="msi-card" style="--accent:var(--msi-accent-1)"><div class="msi-card-head"><span>COLORS</span><span class="r">--msi-*</span></div>
      <div class="msi-card-body"><div class="sw-grid">
${swatches}
      </div></div></section>

    <section class="msi-card" style="--accent:var(--msi-accent-2)"><div class="msi-card-head"><span>TYPE</span><span class="r">FONT · SIZE</span></div>
      <div class="msi-card-body">
        <div style="font-family:var(--msi-font-display);font-size:30px">Display — 강원교육 제목체</div>
        <div style="font-family:var(--msi-font-round);font-weight:700;font-size:20px">Round — 쿠키런 소제목·버튼</div>
        <div>Body — 메이플스토리 본문. 친근한 해요체로 써요.</div>
        <div style="font-family:var(--msi-font-pixel)">PIXEL — SILKSCREEN LABEL_01</div>
        <hr style="border:0;border-top:2px dashed var(--msi-divider);width:100%">
${sizes}
      </div></section>

    <section class="msi-card" style="--accent:var(--msi-accent-3)"><div class="msi-card-head"><span>ACTIVITY_1</span><span class="r">COMPONENTS</span></div>
      <div class="msi-card-body">
        <div class="msi-act-line"><div class="msi-num">1</div><h2 class="msi-h2">부품 모음</h2></div>
        <p class="msi-small" style="margin:0">카드 accent 는 style="--accent:var(--msi-accent-1~8)" 로 돌려 써요.</p>
        <div class="row"><button class="msi-btn" type="button">주요 버튼</button><button class="msi-btn secondary" type="button">보조 버튼</button>
          <button class="msi-chip" type="button" aria-pressed="false">칩</button><button class="msi-chip" type="button" aria-pressed="true">고른 칩</button>
          <span class="msi-tag">READ_ME</span></div>
        <div class="row"><span class="msi-status past">완료</span><span class="msi-status live">진행 중</span><span class="msi-status upcoming">예정</span></div>
        <label class="msi-label">이름<input class="msi-field" placeholder="이름을 적어요"></label>
        <textarea class="msi-field" placeholder="여기에 적어요"></textarea>
        <div class="msi-check-row is-on"><span class="box">✓</span>체크 행(고른 상태)</div>
        <div class="msi-hint-grid">
          <div class="msi-hint-box"><span class="k">HINT_01</span><span class="t">힌트 제목</span><span class="d">설명 글.</span></div>
          <div class="msi-hint-box" style="background:var(--msi-green)"><span class="k">HINT_02</span><span class="t">힌트 제목</span><span class="d">상자마다 색을 돌려 써요.</span></div>
        </div>
        <div class="msi-note"><span class="k">NOTE</span><div>NOTE 상자 — 짧은 안내.</div></div>
        <div class="msi-table-scroll"><table class="msi-table"><tr><th>교시</th><th>과목</th></tr><tr><td>1</td><td>정보</td></tr><tr><td>2</td><td>수학</td></tr></table></div>
      </div></section>

    <div class="row">${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<section class="msi-card" style="--accent:var(--msi-accent-${i});flex:1 1 90px"><div class="msi-card-head"><span>ACCENT_${i}</span></div><div class="msi-card-body" style="padding:10px"> </div></section>`).join('')}</div>
  </div>
</div>
<div class="msi-foot"><span class="msi-floaty">✨</span><span>design/ — tokens.css · components.css</span></div>
</div></div>
</body></html>
`;
fs.writeFileSync(path.join(dir, 'preview.html'), preview);
console.log('✔ design/preview.html');
