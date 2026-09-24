#!/usr/bin/env node
// 빌드 결과(dist/pages)를 내 컴퓨터에서 GitHub Pages 처럼 열어 보기.
//   npm run build && npm run serve   → 브라우저에서 표시되는 주소를 연다 (끄려면 Ctrl + C)
import path from 'node:path';
import fs from 'node:fs';
import { DIST_DIR, serveStatic } from './lib/common.mjs';

const dir = path.join(DIST_DIR, 'pages');
if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error('✖ dist/pages 가 없어요. 먼저 `npm run build` 를 실행하세요.');
  process.exit(1);
}
const s = await serveStatic(dir, 8080).catch(() => serveStatic(dir)); // 8080 이 쓰는 중이면 빈 포트로
console.log(`▶ ${s.url}/  (끄려면 Ctrl + C)`);
