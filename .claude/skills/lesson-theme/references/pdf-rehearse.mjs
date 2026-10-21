// PDF 저장 리허설 — 이름 칸 채우기 · O/X 하나 · 이름표 하나 놓기 → 「PDF로 저장하기」 → 받은 PDF + 끝난 버튼 캡처
//   node .claude/skills/lesson-theme/references/pdf-rehearse.mjs "<주소>" "<출력 폴더>"
//   주소 예: http://127.0.0.1:8080/ai/01/ · http://127.0.0.1:8080/_preview/template-order/  (서버: node scripts/serve.mjs — file:// 은 Tainted canvas)
// 쪽 그림 보기: .claude/skills/lesson-new/references/pdf-pages.mjs (pdf.js 는 scratchpad 에 설치)
// 콘솔의 404 한 줄(브라우저가 찾는 favicon)은 테마와 상관없다.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const [URL, OUT] = process.argv.slice(2);
if (!URL || !OUT) { console.error('사용법: node pdf-rehearse.mjs "<주소>" "<출력 폴더>"'); process.exit(1); }
const { launchBrowser } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/common.mjs')).href);
fs.mkdirSync(OUT, { recursive: true });
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.addInitScript(() => { window.__MSI_ANSWER_SHEET = true; });   // 진행률 확인 넘기기
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.locator('.tab-chip:visible', { hasText: '수업 활동지' }).first().click();
await page.waitForTimeout(800);
await page.locator('#sheetPrintArea [placeholder*="이름"]:visible').first().fill('홍길동');
await page.locator('#sheetPrintArea .ai-ox .q:visible').first().locator("button.glass-chip:text-is('O')").click().catch((e) => errs.push('O/X ' + e.message));
await page.locator('#sheetPrintArea .ca-tray .ca-chip:visible').first().click().catch((e) => errs.push('이름표 ' + e.message));
await page.locator('#sheetPrintArea .ca-slot:visible').first().click().catch((e) => errs.push('칸 ' + e.message));
await page.waitForTimeout(300);
await page.locator('#pdfBtn').scrollIntoViewIfNeeded();
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.locator('#pdfBtn').click()]);
const pdf = path.join(OUT, 'rehearse.pdf');
await dl.saveAs(pdf);
await page.waitForTimeout(500);
await page.locator('.pdf-glass').screenshot({ path: path.join(OUT, 'pdf-btn-done.png') });
await browser.close();
console.log(`✔ PDF ${fs.statSync(pdf).size}B → ${pdf}` + (errs.length ? '\n△ 콘솔: ' + errs.join(' | ') : ''));
