#!/usr/bin/env node
// 수업 PPT 만들기 — 차시 폴더의 ppt.json(장 구성)으로 시안 A「카드」 .pptx 를 만든다. 순서·규칙: docs/rules/ppt.md
//   npm run ppt -- ai/01            → dist/ppt/ai-01/<파일>.pptx
//   npm run ppt -- ai/01 --check    → + PowerPoint 로 그려 render/sNN.png · render/_sheet.png, 글 넘침 검사
//   npm run ppt -- ai/01 --page     → + 내려받기 페이지 site/index.html(PPT·글꼴 꾸러미 넣음) — Claude 가 아티팩트로 게시
// 처음 한 번: npm --prefix scripts/ppt install   (pptxgenjs · fontkit · jszip · wawoff2 · subset-font)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pickLessons, readText, rel } from '../lib/common.mjs';
import { require, SCHOOL } from './theme.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);

try { ['pptxgenjs', 'fontkit', 'jszip', 'wawoff2', 'subset-font'].forEach((p) => require.resolve(p)); } catch {
  console.error('✖ PPT 패키지가 없어요. 저장소 폴더에서 처음 한 번: npm --prefix scripts/ppt install');
  process.exit(1);
}
const { PPT_DIR, renderBackgrounds, renderFigure, contactSheet, thumbnails, silkscreenTtf, fontPack, launchBrowser } = await import('./media.mjs');
const { buildDeck, backgroundOf, figuresOf } = await import('./layouts.mjs');
const { buildPage } = await import('./page.mjs');

// ---------- 차시 ----------
let lesson;
try {
  const picked = pickLessons(args.filter((a) => !a.startsWith('--')));
  if (picked.length !== 1) throw new Error(`차시 하나를 「단원/차시」로 적어 주세요 (예: npm run ppt -- ai/01). 찾은 것: ${picked.map((l) => l.id).join(', ')}`);
  [lesson] = picked;
} catch (e) { console.error(`✖ ${e.message}`); process.exit(1); }
const specFile = path.join(lesson.dir, 'ppt.json');
if (!fs.existsSync(specFile)) { console.error(`✖ ${rel(specFile)} 가 없어요 — 장 구성부터 적어요(docs/rules/ppt.md §3).`); process.exit(1); }
const spec = JSON.parse(readText(specFile));
const meta = {
  school: spec.school || SCHOOL,
  unit: spec.unit || lesson.meta.unitTitle || lesson.unit,
  no: spec.no || `${+lesson.no}차시`,
  tag: spec.tag || `LESSON_${lesson.no}`,
  title: spec.title || lesson.meta.title,
  titleSize: spec.titleSize,   // 장 제목 글자(px) — 비우면 60
};
const outDir = path.join(PPT_DIR, `${lesson.unit}-${lesson.no}`);
const fileName = spec.file || `정보수업_${meta.unit}_${lesson.no}차시.pptx`;
const slides = [...(spec.slides || []), ...(spec.guide === false ? [] : [{ layout: 'guide' }])];

const browser = await launchBrowser();
let failed = false;
try {
  // ---------- 1. 그림: 배경(굽기·캐시) + 활동지 그림 ----------
  const bgs = await renderBackgrounds(slides.map(backgroundOf), browser);
  const figs = {};
  for (const src of [...new Set(slides.flatMap(figuresOf))]) figs[src] = await renderFigure(path.join(lesson.dir, src), path.join(outDir, '_fig'), browser);

  // ---------- 2. PPT ----------
  const { buffer, labels } = await buildDeck({ slides, meta, bgs, figs, docTitle: `${meta.unit} ${meta.no} · ${meta.title}` });
  fs.mkdirSync(outDir, { recursive: true });
  const pptx = path.join(outDir, fileName);
  fs.writeFileSync(pptx, buffer);
  console.log(`✔ ${rel(pptx)} — ${labels.length}장 · ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);

  // ---------- 3. 점검: PowerPoint 로 그리기 + 넘침 ----------
  const renderDir = path.join(outDir, 'render');
  if (flag('--check') || flag('--page')) {
    fs.rmSync(renderDir, { recursive: true, force: true });
    const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(HERE, 'render.ps1'),
      '-Pptx', pptx, '-OutDir', renderDir, '-TempFont', await silkscreenTtf()], { encoding: 'utf8' });
    const outText = (r.stdout || '').trim();
    if (outText) console.log(outText.split(/\r?\n/).map((l) => `  ${l}`).join('\n'));
    if (r.status !== 0) { console.error(r.stderr); throw new Error('PowerPoint 로 그리지 못했어요(PowerPoint 가 깔려 있는지 확인)'); }
    const over = outText.split(/\r?\n/).filter((l) => l.includes('넘침 [')).length;
    console.log(`✔ ${rel(await contactSheet(renderDir, browser))} — 한눈에 보기${over ? ` · ✖ 넘침 ${over}곳: 글을 줄이거나 장을 나누세요` : ' · 넘침 0'}`);
    if (over) failed = true;
  }

  // ---------- 4. 내려받기 페이지 ----------
  if (flag('--page')) {
    const site = path.join(outDir, 'site');
    fs.rmSync(site, { recursive: true, force: true });
    await thumbnails(renderDir, path.join(site, 'thumbs'), browser);
    const zipFile = await fontPack();
    const page = await buildPage({
      siteDir: site, title: `${meta.unit} ${meta.no} 수업 PPT`, school: meta.school, tag: meta.tag, labels,
      pptx: { name: fileName, buf: buffer }, zip: { name: path.basename(zipFile), buf: fs.readFileSync(zipFile) },
    });
    const thumbs = fs.readdirSync(path.join(site, 'thumbs')).sort();
    console.log(`✔ ${rel(page)} ${(fs.statSync(page).size / 1024 / 1024).toFixed(1)}MB — 아티팩트로 게시(docs/rules/ppt.md §5):`);
    console.log(JSON.stringify({ file_path: page, root: site, capabilities: { downloads: true }, icon: 'slides',
      files: Object.fromEntries(thumbs.map((t) => [`thumbs/${t}`, `thumbs/${t}`])) }));
  }
} catch (e) {
  console.error(`✖ ${e.message}`);
  failed = true;
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
