#!/usr/bin/env node
// 소스(lessons/…/lesson.html)를 배포용 파일로 만든다.
//
//   npm run build                 → 모든 차시
//   npm run build -- 06           → 6차시만 (여러 개: 05 06)
//   npm run build -- --pages      → GitHub Pages 용만 (--embed 는 구글 사이트 붙여넣기용만)
//
// 결과
//   dist/pages/index.html                         첫 화면: 수업 활동지(차시 목록) · 학습 자료
//   dist/pages/<단원>/<차시>/index.html · teacher.html   학생용 · 교사용(진행률 위젯 숨김)
//   dist/pages/materials/<파일>                    학습 자료 (materials/ 그대로 복사)
//   dist/embed/<단원>-<차시>.html · .teacher.html        한 파일짜리 (구글 사이트 "삽입할 코드"용)
import fs from 'node:fs';
import path from 'node:path';
import { DIST_DIR, SHARED_DIR, pickLessons, listLessons, loadUnits, listMaterials, writeText, rel } from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';
import { renderIndex } from './lib/index-page.mjs';

export function build(args = []) {
  const lessons = pickLessons(args);
  const onlyPages = args.includes('--pages');
  const onlyEmbed = args.includes('--embed');
  const doPages = !onlyEmbed;
  const doEmbed = !onlyPages;
  const rows = [];

  for (const l of lessons) {
    const out = { id: l.id };
    if (doEmbed) {
      for (const teacher of [false, true]) {
        const { html } = renderLesson(l, { variant: 'embed', teacher });
        const f = path.join(DIST_DIR, 'embed', `${l.unit}-${l.no}${teacher ? '.teacher' : ''}.html`);
        writeText(f, html);
        out[teacher ? 'embedTeacher' : 'embed'] = { file: rel(f), kb: Math.round(Buffer.byteLength(html) / 1024) };
      }
    }
    if (doPages) {
      for (const teacher of [false, true]) {
        const { html, copies } = renderLesson(l, { variant: 'pages', teacher });
        const f = path.join(DIST_DIR, 'pages', l.unit, l.no, teacher ? 'teacher.html' : 'index.html');
        writeText(f, html);
        for (const c of copies) {
          const to = path.join(DIST_DIR, 'pages', ...c.to.split('/'));
          fs.mkdirSync(path.dirname(to), { recursive: true });
          fs.copyFileSync(c.from, to);
        }
        out[teacher ? 'pagesTeacher' : 'pages'] = { file: rel(f), kb: Math.round(Buffer.byteLength(html) / 1024) };
      }
    }
    rows.push(out);
  }

  if (doPages) {
    // 목록 페이지는 항상 전체 차시 기준으로 다시 만든다
    const pagesDir = path.join(DIST_DIR, 'pages');
    const materials = listMaterials();
    writeText(path.join(pagesDir, 'index.html'), renderIndex(listLessons(), loadUnits(), materials));
    for (const m of materials) {
      const to = path.join(pagesDir, 'materials', m.file);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(m.src, to);
    }
    writeText(path.join(pagesDir, '.nojekyll'), '');
    for (const f of ['CookieRun-700.woff2', 'Maplestory-300.woff2', 'Maplestory-700.woff2']) {
      const src = path.join(SHARED_DIR, 'fonts', f);
      const to = path.join(pagesDir, 'shared', 'fonts', f);
      if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(src, to); }
    }
  }
  return rows;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'build.mjs') {
  try {
    const rows = build(process.argv.slice(2));
    for (const r of rows) {
      const parts = [];
      if (r.pages) parts.push(`pages ${r.pages.kb}KB`);
      if (r.embed) parts.push(`embed ${r.embed.kb}KB`);
      console.log(`✔ ${r.id.padEnd(18)} ${parts.join(' · ')}  (+ 교사용)`);
    }
    console.log('→ dist/pages (GitHub Pages) · dist/embed (구글 사이트 붙여넣기용)');
  } catch (e) {
    console.error('✖ ' + e.message);
    process.exit(1);
  }
}
