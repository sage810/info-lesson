// 틀 밖 차시(예전에 틀을 복사한 차시)의 모양 숫자 → --msi-shape-* 변수 — 틀(_templates/order)과 똑같이
//   node .claude/skills/lesson-theme/references/to-vars.mjs <단원/차시> [--dry] [--file present.html]
//   --file present.html: 수업용 화면 — 틀과 같은 줄이 거의 없어 2) 규칙으로 바뀐다. 틀에 없는 크기(테두리 2.5px · 모서리 18·22px 등)는 숫자 그대로 남는다.
//   1) 틀의 각 줄을 숫자로 되돌려(bwN→Npx · rN→Npx · shN→"Npx Npx 0" · rgb-ink→75,59,107) 차시 줄과 똑같으면 틀 줄로 바꾼다
//      → data-ic(아이콘 이름표) · span.app-ic(🏫) 도 틀 줄을 따라 함께 들어온다
//   2) 남은 줄(차시에만 있는 줄)은 같은 규칙으로 바꾼다  3) 그래도 남은 숫자 모양을 알린다(손으로 확인)
// 먼저 lesson.html 을 scratchpad 에 복사해 두고, 바꾼 뒤 style-compare.mjs 로 「테마 없이 전후 같음」을 확인한다.
// 토큰 블록(<style id="msi-role-tokens">)에 --msi-shape-* 가 없으면 `node design/build.mjs` 먼저(표식 있는 차시만 채움).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const fi = args.indexOf('--file');
const fileName = fi >= 0 ? args.splice(fi, 2)[1] : 'lesson.html';
const id = args.find((a) => !a.startsWith('--'));
if (!id) { console.error('사용법: node to-vars.mjs <단원/차시> [--dry] [--file present.html]'); process.exit(1); }
const aiFile = path.join(ROOT, 'lessons', id, fileName);
const tplFile = path.join(ROOT, 'lessons', '_templates', 'order', 'lesson.html');
const ai = fs.readFileSync(aiFile, 'utf8'), tpl = fs.readFileSync(tplFile, 'utf8');
if (!/--msi-shape-r10:/.test(ai)) { console.error('✖ 토큰 블록에 --msi-shape-* 가 없어요 — node design/build.mjs 먼저'); process.exit(1); }
const EOL = ai.includes('\r\n') ? '\r\n' : '\n';
const denorm = (l) => l
  .replace(/ data-ic="[^"]*"/g, '').replace(/<span class="app-ic">🏫<\/span>/g, '🏫')
  .replace(/var\(--msi-shape-bw(\d)\)/g, '$1px')
  .replace(/var\(--msi-shape-r-pill\)/g, '999px')
  .replace(/var\(--msi-shape-r(\d+)\)/g, '$1px')
  .replace(/var\(--msi-shape-sh(\d)\)/g, '$1px $1px 0')
  .replace(/rgba\(var\(--msi-rgb-ink\),/g, 'rgba(75,59,107,');
const map = new Map();
for (const t of tpl.split(/\r?\n/)) { const k = denorm(t); if (k === t) continue; if (!map.has(k)) map.set(k, new Set()); map.get(k).add(t); }
let byTpl = 0, amb = 0, byRule = 0;
const RADII = new Set([2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20]);   // design/tokens.json shape 에 있는 것만
const SH = new Set([1, 2, 3, 4, 5, 6, 8]);
const out = ai.split(/\r?\n/).map((l) => {
  const s = map.get(l);
  if (s && s.size === 1) { byTpl++; return [...s][0]; }
  if (s) amb++;
  if (/^\s*--msi-/.test(l)) return l;
  let n = l;
  n = n.replace(/((?:border(?:-top|-bottom|-left|-right)?|border(?:Top|Bottom|Left|Right)?)\s*:\s*)([1-4])px(\s+(?:solid|dashed|dotted))/g, (m, a, w, b) => `${a}var(--msi-shape-bw${w})${b}`);
  n = n.replace(/((?:border-width|borderWidth)\s*:\s*)([1-4])px/g, (m, a, w) => `${a}var(--msi-shape-bw${w})`);
  n = n.replace(/((?:border-radius|borderRadius)\s*:\s*)(\d+)px(?=\s*[;"!}]|\s*$)/g, (m, a, r) => r === '999' ? `${a}var(--msi-shape-r-pill)` : RADII.has(+r) ? `${a}var(--msi-shape-r${r})` : m);
  n = n.replace(/(\d)px \1px 0(?:px)? (rgba\(75,59,107,|var\(--msi-role-base-night-sky-ink\))/g, (m, d, c) => SH.has(+d) ? `var(--msi-shape-sh${d}) ${c}` : m);
  n = n.replace(/rgba\(75,59,107,/g, 'rgba(var(--msi-rgb-ink),');
  if (n !== l) byRule++;
  return n;
});
let s = out.join(EOL);
// 아이콘 이름표 — 틀 줄로 안 들어온 자리(차시에만 있는 카드 등)
let ic = 0;
s = s.replace(/<div class="m-badge" style="([^"]*)">([^<]+)<\/div>/g, (m, st, e) => { ic++; return `<div class="m-badge" data-ic="${e}" style="${st}">${e}</div>`; });
if (!dry) fs.writeFileSync(aiFile, s);
const left = s.split(/\r?\n/).map((l, i) => [i + 1, l]).filter(([, l]) => !/^\s*--msi-/.test(l) &&
  /(border(?:-top|-bottom|-left|-right|Top|Bottom|Left|Right)?\s*:\s*[1-4]px\s+(solid|dashed|dotted))|(border-?[rR]adius\s*:\s*\d+px)|(\dpx \dpx 0 rgba)|rgba\(75,59,107,/.test(l));
console.log(`${dry ? '(--dry) ' : ''}${id}: 틀 줄로 ${byTpl} · 규칙으로 ${byRule} · 애매(틀에 같은 줄 여러 모양) ${amb} · 카드 아이콘 이름표 ${ic}`);
for (const [n, l] of left) console.log(`  남은 숫자 ${n}: ${l.trim().slice(0, 140)}`);
console.log(left.length ? '△ 남은 숫자는 손으로 확인' : '✔ 남은 숫자 모양 없음');
