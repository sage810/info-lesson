#!/usr/bin/env node
// 빌드 결과를 실제 브라우저로 열어 확인한다. (수정할 때마다 돌리는 "자동 검수")
//
//   npm run check              → 모든 차시
//   npm run check -- 06        → 6차시만
//   npm run check -- 06 --no-build   → 빌드는 건너뛰고 지금 dist 로만 확인
//   npm run check -- 06 --find "이상치"  → 그 글자가 있는 곳을 화면 캡처(dist/check/…-find.png) — 고친 부분 눈으로 확인용
//
// 확인하는 것
//   ✖ 실패: 스크립트 문법 오류 · 페이지 실행 오류 · 화면에 {{ }} 가 그대로 보임 · 링크된 파일(폰트/그림/스크립트) 404
//           · 교사용 화면에 진행률 위젯이 보임
//   △ 참고: 콘솔 오류(학교망 밖 NEIS 호출 실패 등 외부 원인일 수 있음)
// 결과 화면은 dist/check/ 에 저장된다: 전체(…-pages.png) + 세로로 자른 조각(…-pages-01.png …) — 조각을 열어 눈으로 확인.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { DIST_DIR, pickLessons, launchBrowser, serveStatic, rel } from './lib/common.mjs';
import { build } from './build.mjs';

const args = process.argv.slice(2);
const findIdx = args.indexOf('--find');
const findText = findIdx >= 0 ? args.splice(findIdx, 2)[1] : null;
const lessons = pickLessons(args);
if (!args.includes('--no-build')) build(lessons.map((l) => l.id));

// 1) 인라인 스크립트 문법 (embed 판 기준 — 모든 스크립트가 들어 있으므로)
function syntaxErrors(file) {
  const html = fs.readFileSync(file, 'utf8');
  const errs = [];
  // HTML 주석·<style> 안에 적힌 "<script>" 글자는 건너뛴다(앞에서부터 차례로 소비)
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<style\b[\s\S]*?<\/style>|<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (!m[0].startsWith('<script')) continue;
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs) || /type="application\/(json|ld\+json)"/.test(attrs)) continue;
    try { new vm.Script(m[2], { filename: path.basename(file) }); } catch (e) {
      const line = html.slice(0, m.index).split('\n').length;
      errs.push(`스크립트 문법 오류 (${line}번째 줄 부근): ${e.message}`);
    }
  }
  return errs;
}

async function inspect(browser, url, { teacher, origin }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fails = []; const notes = [];
  page.on('pageerror', (e) => fails.push('실행 오류: ' + e.message.split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/fetch at 'file:|ERR_FAILED/.test(t) || /favicon/.test(m.location()?.url || '')) return; // file:// 로 열 때만 생기는 기존 경고 · 파비콘 없음
    notes.push('콘솔: ' + t.slice(0, 160));
  });
  page.on('response', (r) => {
    if (origin && r.url().startsWith(origin) && r.status() >= 400) fails.push(`파일 없음 ${r.status()}: ${decodeURIComponent(r.url().slice(origin.length))}`);
  });
  page.on('requestfailed', (r) => {
    if (origin && r.url().startsWith(origin)) fails.push('불러오기 실패: ' + decodeURIComponent(r.url().slice(origin.length)));
  });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  // 탭이 있는 활동지는 "수업 활동지" 탭으로
  const tab = page.getByText('수업 활동지', { exact: false }).first();
  if (await tab.count() && !(await page.locator('#sheetPrintArea').count())) { await tab.click().catch(() => {}); await page.waitForTimeout(800); }
  const info = await page.evaluate(() => {
    const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    return {
      leak: (document.body.innerText.match(/\{\{[^}]{0,40}\}\}/) || [null])[0],
      blanks: document.querySelectorAll('textarea.blank').length,
      progressVisible: vis(document.querySelector('.sheet-progress')),
      hasPdfBtn: !!document.querySelector('#pdfBtn'),
    };
  });
  if (info.leak) fails.push(`화면에 템플릿 표식이 그대로 보여요: ${info.leak}`);
  if (teacher && info.progressVisible) fails.push('교사용인데 진행률 위젯이 보여요');
  return { page, fails, notes, info };
}

const browser = await launchBrowser();
const server = await serveStatic(path.join(DIST_DIR, 'pages'));
const shotDir = path.join(DIST_DIR, 'check');
fs.mkdirSync(shotDir, { recursive: true });
let failed = 0;
try {
  for (const l of lessons) {
    const embed = path.join(DIST_DIR, 'embed', `${l.unit}-${l.no}.html`);
    const results = [];
    results.push({ name: '문법', fails: syntaxErrors(embed), notes: [] });
    const targets = [
      { name: 'pages', url: `${server.url}/${l.unit}/${l.no}/`, origin: server.url },
      { name: 'pages-교사용', url: `${server.url}/${l.unit}/${l.no}/teacher.html`, origin: server.url, teacher: true },
      { name: 'embed', url: pathToFileURL(embed).href },
    ];
    for (const t of targets) {
      const r = await inspect(browser, t.url, t);
      const shot = path.join(shotDir, `${l.unit}-${l.no}-${t.name}.png`);
      if (t.name !== 'pages-교사용') await r.page.screenshot({ path: shot, fullPage: true }).catch(() => {});
      if (t.name === 'pages') {
        // 세로로 잘라 저장 (긴 화면도 한 장씩 열어 볼 수 있게)
        for (const f of fs.readdirSync(shotDir)) if (f.startsWith(`${l.unit}-${l.no}-pages-`) && /-\d\d\.png$/.test(f)) fs.rmSync(path.join(shotDir, f));
        const h = await r.page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0, i = 1; y < h && i <= 20; y += 1400, i++) {
          await r.page.screenshot({ path: path.join(shotDir, `${l.unit}-${l.no}-pages-${String(i).padStart(2, '0')}.png`),
            fullPage: true, clip: { x: 0, y, width: 1280, height: Math.min(1400, h - y) } }).catch(() => {});
        }
        if (findText) {
          const hit = r.page.getByText(findText, { exact: false }).first();
          if (await hit.count()) {
            await hit.scrollIntoViewIfNeeded();
            await r.page.evaluate(() => window.scrollBy(0, -120));
            await r.page.screenshot({ path: path.join(shotDir, `${l.unit}-${l.no}-find.png`) });
            r.notes.push(`"${findText}" 부분 캡처: ${rel(path.join(shotDir, `${l.unit}-${l.no}-find.png`))}`);
          } else r.notes.push(`"${findText}" 글자를 화면에서 찾지 못했어요`);
        }
      }
      await r.page.close();
      results.push({ name: t.name, fails: r.fails, notes: r.notes, info: r.info, shot });
    }
    const bad = results.some((r) => r.fails.length);
    if (bad) failed++;
    const inf = results.find((r) => r.info)?.info || {};
    console.log(`${bad ? '✖' : '✔'} ${l.id}  (${l.meta.title}) — 빈칸 ${inf.blanks ?? '?'}개${inf.hasPdfBtn ? ' · PDF 버튼 있음' : ''}`);
    for (const r of results) {
      for (const f of [...new Set(r.fails)]) console.log(`    ✖ [${r.name}] ${f}`);
      for (const n of [...new Set(r.notes)].slice(0, 3)) console.log(`    △ [${r.name}] ${n}`);
    }
  }
  console.log(`\n화면 캡처: ${rel(shotDir)}/`);
} finally {
  await browser.close();
  await server.close();
}
if (failed) { console.log(`\n✖ ${failed}개 차시에 문제가 있어요.`); process.exit(1); }
console.log('✔ 모두 통과');
