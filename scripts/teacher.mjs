#!/usr/bin/env node
// 정답지 PDF 만들기 — answers.json 의 정답을 빈칸에 채우고, 활동지에 들어있는 "PDF로 저장하기" 버튼을 눌러 받는다.
// (교사용 HTML 은 `npm run build` 가 자동으로 만든다: 진행률 위젯만 숨긴 화면)
//
//   npm run teacher -- 06          → dist/answers/data-analysis-06-정답지.pdf
//
// answers.json 모양 (lessons/<단원>/<차시>/answers.json)
// {
//   "name": "교사용 정답지",                       ← 이름 칸에 들어갈 글자(PDF 파일 이름에도 쓰임)
//   "fill": { "<빈칸 aria-label>": "정답", ... },   ← textarea/input 의 aria-label 기준
//   "click": [                                      ← 객관식·퀴즈처럼 눌러야 하는 것
//     { "near": "1. 우리 반 친구들이", "text": "구성 분석" },   ← near 글자 근처에서 text 와 똑같은 버튼을 누름
//     "#someButton"                                  ← 또는 CSS/Playwright 선택자
//   ]
// }
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DIST_DIR, pickLessons, launchBrowser, readText, writeText, rel } from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';

const lessons = pickLessons(process.argv.slice(2));
const browser = await launchBrowser();
let failed = 0;
try {
  for (const l of lessons) {
    const ansPath = path.join(l.dir, 'answers.json');
    if (!fs.existsSync(ansPath)) {
      console.log(`– ${l.id}: answers.json 이 없어 건너뜀 (정답을 적어 두면 정답지 PDF 를 만들 수 있어요)`);
      continue;
    }
    const ans = JSON.parse(readText(ansPath));
    // 제출 훅 없이(=선생님 드라이브로 가지 않게), 학생용 화면 그대로 만든다
    const { html } = renderLesson(l, { variant: 'embed', hook: false });
    const tmp = path.join(DIST_DIR, 'answers', `.${l.unit}-${l.no}.answer.html`);
    writeText(tmp, html);

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    const alerts = [];
    page.on('dialog', (d) => { alerts.push(d.message()); d.accept(); });
    // 정답지 모드 표시 — 서술형 정답이 없어 진행률이 낮은 차시도 PDF 를 받을 수 있게,
    // 활동지의 "70% 넘어야 저장" 확인이 이 표시를 보면 건너뛴다(학생 화면에는 없음)
    await page.addInitScript(() => { window.__MSI_ANSWER_SHEET = true; });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1500);
    if (!(await page.locator('#pdfBtn').count())) {
      const tab = page.getByText('수업 활동지', { exact: false }).first();
      if (await tab.count()) { await tab.click(); await page.waitForTimeout(800); }
    }

    // 이름
    const nameBox = page.locator('textarea[placeholder="이름을 적어요"], input[placeholder="이름을 적어요"]').first();
    if (ans.name && await nameBox.count()) await nameBox.fill(ans.name);

    // 빈칸
    const missing = []; let filled = 0;
    for (const [label, value] of Object.entries(ans.fill || {})) {
      const box = page.locator(`textarea[aria-label="${label.replace(/"/g, '\\"')}"], input[aria-label="${label.replace(/"/g, '\\"')}"]`);
      const n = await box.count();
      if (!n) { missing.push(label); continue; }
      for (let i = 0; i < n; i++) await box.nth(i).fill(String(value));
      filled++;
    }
    // 정답이 안 적힌 빈칸
    const unanswered = await page.evaluate((known) => [...document.querySelectorAll('textarea.blank[aria-label]')]
      .map((t) => t.getAttribute('aria-label')).filter((a) => !known.includes(a)), Object.keys(ans.fill || {}));

    // 클릭
    const clickFails = [];
    for (const c of ans.click || []) {
      if (typeof c === 'string') {
        try { await page.locator(c).first().click({ timeout: 3000 }); } catch { clickFails.push(c); }
        continue;
      }
      const ok = await page.evaluate(({ near, text }) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let best = null;
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.nodeValue.includes(near)) continue;
          let el = node.parentElement;
          for (let hop = 0; el && hop < 5; hop++, el = el.parentElement) {
            const hit = [...el.querySelectorAll('*')].find((x) => x.children.length === 0
              && x.textContent.trim() === text && x.getClientRects().length);
            if (hit) { if (!best || hop < best.hop) best = { hit, hop }; break; }
          }
        }
        if (!best) return false;
        best.hit.click();
        return true;
      }, c);
      if (!ok) clickFails.push(`${c.near} → ${c.text}`);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(600);

    // PDF 저장 버튼
    const out = path.join(DIST_DIR, 'answers', `${l.unit}-${l.no}-정답지.pdf`);
    let ok = false;
    if (await page.locator('#pdfBtn').count()) {
      try {
        const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.locator('#pdfBtn').click()]);
        await dl.saveAs(out);
        ok = true;
      } catch (e) {
        console.log(`✖ ${l.id}: PDF 를 받지 못했어요${alerts.length ? ` — 안내창: "${alerts.join(' / ')}"` : ''}`);
      }
    } else {
      await page.pdf?.({ path: out, format: 'A4', printBackground: true }).then(() => { ok = true; }).catch(() => {});
      if (!ok) console.log(`✖ ${l.id}: 이 활동지에는 PDF 저장 버튼이 없어요`);
    }
    await page.close();
    fs.rmSync(tmp, { force: true });
    if (!ok) { failed++; continue; }

    console.log(`✔ ${l.id}: ${rel(out)} — 빈칸 ${filled}개 채움`);
    if (missing.length) console.log(`    △ answers.json 에만 있고 활동지에는 없는 빈칸 ${missing.length}개: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ' …' : ''}`);
    if (unanswered.length) console.log(`    △ 정답이 안 적힌 빈칸 ${unanswered.length}개: ${unanswered.slice(0, 4).join(', ')}${unanswered.length > 4 ? ' …' : ''}`);
    if (clickFails.length) console.log(`    △ 누르지 못한 버튼: ${clickFails.join(' / ')}`);
  }
} finally {
  await browser.close();
}
if (failed) process.exit(1);
