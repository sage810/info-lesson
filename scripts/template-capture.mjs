#!/usr/bin/env node
// 새 차시 틀을 캡처 — 「수업 활동지」 탭은 부품(카드)별로, 이용 규칙·시간표·급식 탭은 보기마다. Claude Design 에 「지금 구조」 참고 그림으로 준다.
//   node scripts/template-capture.mjs                    → order 틀 → input/claude-design/현재 틀 캡처/
//   node scripts/template-capture.mjs order "<출력 폴더>"
//   node scripts/template-capture.mjs order "<출력 폴더>" --theme summer-sea   → 테마를 입힌 틀(가져온 테마 확인용)
// 프롬프트·쓰는 법: docs/templates/claude-design-prompt.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DIST_DIR, launchBrowser, serveStatic } from './lib/common.mjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--theme');
const theme = ti >= 0 ? args.splice(ti, 2)[1] : '';
const name = args[0] || 'order';
const OUT = path.resolve(args[1] || path.join(ROOT, 'input', 'claude-design', '현재 틀 캡처'));
execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'template-preview.mjs'), name, ...(theme ? ['--theme', theme] : [])], { stdio: 'inherit' });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const srv = await serveStatic(path.join(DIST_DIR, 'pages'));
const url = `${srv.url}/_preview/template-${name}/`;
const browser = await launchBrowser();
async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(800);
  await page.locator('.tab-chip:visible', { hasText: '수업 활동지' }).first().click();
  await page.waitForTimeout(1000);
  return page;
}
const shots = [];
const page = await open(1280, 900);
await page.screenshot({ path: path.join(OUT, '00-첫화면.png') });
shots.push('00-첫화면');
const cards = page.locator('.m-card:visible');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  const c = cards.nth(i);
  const label = ((await c.locator('.m-head .mono').first().innerText({ timeout: 2000 }).catch(() => '')) || `카드${i + 1}`)
    .replace(/\s+/g, '-').replace(/[\\/:*?"<>|]/g, '');
  const f = `${String(i + 1).padStart(2, '0')}-${label}`;
  await c.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await c.screenshot({ path: path.join(OUT, f + '.png') });
  shots.push(f);
}
const pdf = page.getByText('PDF로 저장하기').locator('visible=true').last();
if (await pdf.count()) {
  await pdf.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const b = await pdf.boundingBox();
  const f = `${String(n + 1).padStart(2, '0')}-PDF저장-버튼`;
  await page.screenshot({ path: path.join(OUT, f + '.png'), clip: { x: 140, y: Math.max(0, b.y - 90), width: 1100, height: 220 } });
  shots.push(f);
}
const phone = await open(390, 844);
let k = n + 2;
const fp = `${String(k++).padStart(2, '0')}-폰-첫화면`;
await phone.screenshot({ path: path.join(OUT, fp + '.png') });
shots.push(fp);

// 나머지 3탭 — 이용 규칙 한 장, 시간표·급식은 일간/주간/월간 보기마다 한 장(페이지 전체), 폰은 가장 빡빡한 두 화면
async function tabShot(pg, tab, view, label) {
  await pg.locator('.tab-chip:visible', { hasText: tab }).first().click();
  await pg.waitForTimeout(700);
  if (view) { await pg.getByText(view, { exact: true }).locator('visible=true').first().click(); await pg.waitForTimeout(700); }
  await pg.evaluate(() => window.scrollTo(0, 0));
  const f = `${String(k++).padStart(2, '0')}-${label}`;
  await pg.screenshot({ path: path.join(OUT, f + '.png'), fullPage: true });
  shots.push(f);
}
await tabShot(page, '이용 규칙', '', '이용규칙');
for (const v of ['일간', '주간', '월간']) await tabShot(page, '시간표', v, `시간표-${v}`);
for (const v of ['일간', '주간', '월간']) await tabShot(page, '오늘의 급식', v, `급식-${v}`);
await tabShot(phone, '시간표', '주간', '폰-시간표-주간');
await tabShot(phone, '오늘의 급식', '일간', '폰-급식-일간');
await browser.close();
await srv.close();
console.log(`✔ ${shots.length}장 → ${path.relative(ROOT, OUT).split(path.sep).join('/')}/\n  ${shots.join(' · ')}`);
