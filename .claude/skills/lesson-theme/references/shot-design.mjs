// Claude Design 견본 HTML 캡처 — 우리 틀 캡처(template-capture)와 나란히 비교하려고
//   node .claude/skills/lesson-theme/references/shot-design.mjs "<견본.html>" "<출력 폴더>"
//   → design-top.png(1280×900 첫 화면) · design-full.png(전체) · design-phone.png(390 첫 화면)
// 견본은 zip 을 scratchpad 의 빈 폴더에 풀어서 그 경로를 넘긴다(저장소 안에서 열지 않는다).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) { console.error('사용법: node shot-design.mjs "<견본.html>" "<출력 폴더>"'); process.exit(1); }
const { launchBrowser } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/common.mjs')).href);
fs.mkdirSync(OUT, { recursive: true });
const b = await launchBrowser();
for (const [w, h, name, full] of [[1280, 900, 'design-top', false], [1280, 900, 'design-full', true], [390, 844, 'design-phone', false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(pathToFileURL(path.resolve(SRC)).href, { waitUntil: 'load' });
  await p.waitForTimeout(1500);   // 글꼴(사이트 주소에서 받음)
  await p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
  await p.close();
}
await b.close();
console.log('✔ 견본 캡처 3장 →', OUT);
