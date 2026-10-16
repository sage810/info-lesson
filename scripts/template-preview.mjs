#!/usr/bin/env node
// 새 차시 틀(lessons/_templates/<이름>) 미리보기 — 틀은 사이트에 안 올라가므로(밑줄 폴더) 따로 그린다.
//   npm run template-preview            → order 틀
//   npm run template-preview -- order   → http://127.0.0.1:8080/_preview/template-order/
// 색은 틀 안 <style id="msi-role-tokens"> — design/tokens.json 의 role 을 고쳤으면 먼저 node design/build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LESSONS_DIR, DIST_DIR, readText } from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';

const name = process.argv[2] || 'order';
const dir = path.join(LESSONS_DIR, '_templates', name);
if (!fs.existsSync(path.join(dir, 'lesson.html'))) { console.error(`✖ 틀이 없어요: lessons/_templates/${name}`); process.exit(1); }
const meta = JSON.parse(readText(path.join(dir, 'lesson.json')));
const no = 'template-' + name;
const lesson = { unit: '_preview', no, id: `_preview/${no}`, dir, meta, src: path.join(dir, 'lesson.html') };
const { html, copies } = renderLesson(lesson, { variant: 'pages', teacher: false, hook: false });
const out = path.join(DIST_DIR, 'pages', '_preview', no);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const c of copies) { const to = path.join(DIST_DIR, 'pages', ...c.to.split('/')); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(c.from, to); }
console.log(`✔ ${path.relative(ROOT, out).replace(/\\/g, '/')}/index.html — http://127.0.0.1:8080/_preview/${no}/`);
