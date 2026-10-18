// 활동지 그림(SVG)의 글자를 CookieRun Bold 로 — <img> 로 넣은 SVG 는 페이지 글꼴을 못 빌려 써서,
// 그림에 나오는 글자만 남긴 작은 글꼴(woff2)을 SVG 안 <style id="svg-font"> 에 넣는다(다시 돌리면 바꿔 끼움).
// 원본 글꼴: design/fonts/CookieRun-700.woff2 (줄이지 않은 것). PDF 저장(html2canvas)에서도 그대로 보인다.
// 실행(subset-font 는 scratchpad 에만 — 이 PC 엔 Python 이 없어 scripts/font-subset.py 를 못 씀):
//   cd <scratchpad>/font && npm init -y && npm i subset-font
//   cp .claude/skills/lesson-new/references/svg-font.mjs <scratchpad>/font/
//   node <scratchpad>/font/svg-font.mjs "<저장소>" lessons/ai/01/assets/a1-neural.svg …
import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const [repo, ...files] = process.argv.slice(2);
const FAMILY = 'CookieRunSvg';
const src = fs.readFileSync(path.join(repo, 'design/fonts/CookieRun-700.woff2'));
for (const rel of files) {
  const f = path.join(repo, rel);
  let svg = fs.readFileSync(f, 'utf8').replace(/<style id="svg-font">[\s\S]*?<\/style>\s*/, '');
  const text = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join('') + '0123456789%!?';
  const font = await subsetFont(src, text, { targetFormat: 'woff2' });
  const style = `<style id="svg-font">@font-face{font-family:'${FAMILY}';font-weight:100 900;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2')}</style>`;
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1\n  ${style}`);
  svg = svg.replace(/(<svg\b[^>]*?)font-family="[^"]*"(?: font-weight="700")?/,`$1font-family="${FAMILY}, Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-weight="700"`);
  fs.writeFileSync(f, svg);
  console.log(`✔ ${rel} — 글자 ${new Set(text).size}개, 글꼴 ${(font.length / 1024).toFixed(1)}KB`);
}
