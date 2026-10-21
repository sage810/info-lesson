#!/usr/bin/env node
// 새 차시 틀(lessons/_templates/<이름>) 미리보기 — 틀은 사이트에 안 올라가므로(밑줄 폴더) 따로 그린다.
//   npm run template-preview            → order 틀
//   npm run template-preview -- order   → http://127.0.0.1:8080/_preview/template-order/
//   npm run template-preview -- order --theme summer-sea   → 틀에 차시 테마를 입혀 보기(design/themes/<이름>, docs/rules/theme.md)
// 색은 틀 안 <style id="msi-role-tokens"> — design/tokens.json 의 role 을 고쳤으면 먼저 node design/build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LESSONS_DIR, DIST_DIR, readText } from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--theme');
const theme = ti >= 0 ? args.splice(ti, 2)[1] : '';
if (ti >= 0 && !theme) { console.error('✖ --theme 다음에 테마 이름을 적어 주세요'); process.exit(1); }
const name = args[0] || 'order';
const dir = path.join(LESSONS_DIR, '_templates', name);
if (!fs.existsSync(path.join(dir, 'lesson.html'))) { console.error(`✖ 틀이 없어요: lessons/_templates/${name}`); process.exit(1); }
const meta = { ...JSON.parse(readText(path.join(dir, 'lesson.json'))), ...(theme ? { theme } : {}) };
const no = 'template-' + name;
const lesson = { unit: '_preview', no, id: `_preview/${no}`, dir, meta, src: path.join(dir, 'lesson.html') };
let html, copies;
try { ({ html, copies } = renderLesson(lesson, { variant: 'pages', teacher: false, hook: false })); } catch (e) { console.error('✖ ' + e.message); process.exit(1); }
const out = path.join(DIST_DIR, 'pages', '_preview', no);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const c of copies) { const to = path.join(DIST_DIR, 'pages', ...c.to.split('/')); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(c.from, to); }
console.log(`✔ ${theme ? '테마 ' + theme + ' · ' : ''}${path.relative(ROOT, out).replace(/\\/g, '/')}/index.html — http://127.0.0.1:8080/_preview/${no}/`);
