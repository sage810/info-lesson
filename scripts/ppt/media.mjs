// 수업 PPT 그림 — 배경(모눈 책상 + 카드 틀) 굽기 · 활동지 그림 → PNG · 미리보기 모음 · 글꼴 꾸러미.
// 캔바가 PPT 를 가져올 때 그라데이션·그림자를 잃지 않게 꾸밈은 그림에 굽고, 글·칸은 PPT 요소로 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DIST_DIR, launchBrowser, sha } from '../lib/common.mjs';
import { FRAME, HEAD_H, BORDER, RADIUS, role, require, FONTS, fontFile } from './theme.mjs';

export const PPT_DIR = path.join(DIST_DIR, 'ppt');
const INK = '#4b3b6b';

// ---------- 배경 ----------
const full = (bg) => `<div style="position:absolute;left:0;top:0;width:1920px;height:1080px;background:${bg}"></div>`;
const glow = (x, y, rgb, a, r) => full(`radial-gradient(ellipse at ${x}% ${y}%, rgba(${rgb},${a}) 0%, rgba(${rgb},0) ${r}%)`);
// 활동지 바깥 배경(order.md §2-0-8): 라벤더 책상 + 오로라 빛 3 + 흰 서리 막 + 모눈(40px)
const DESK = [
  glow(6, 4, '247,179,214', 0.6, 40), glow(96, 6, '159,211,247', 0.58, 40), glow(50, 100, '196,178,247', 0.5, 46),
  full('linear-gradient(150deg, rgba(255,255,255,.45) 0%, rgba(255,255,255,.08) 55%, rgba(255,255,255,.35) 100%)'),
  full('repeating-linear-gradient(90deg, rgba(216,210,238,.75) 0px, rgba(216,210,238,.75) 2px, rgba(216,210,238,0) 2px, rgba(216,210,238,0) 40px)'),
  full('repeating-linear-gradient(180deg, rgba(216,210,238,.75) 0px, rgba(216,210,238,.75) 2px, rgba(216,210,238,0) 2px, rgba(216,210,238,0) 40px)'),
].join('');
// 유리 머리(order.md §2-0-7): 윗면 흰 빛 + 위 흰 선 + 아래 속광
const glassHead = (c) => (c.startsWith('linear') ? c : `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 72%), ${c}`);

// 배경 이름: 'cover' | 'dialog-<역할>' | 'card-<역할>' (역할 = theme.ROLES 열쇠, act 는 1~4)
export function bgHtml(name) {
  const [kind, rk] = name === 'cover' ? ['cover', 'topic'] : name.split('-');
  const shape = kind === 'card' ? 'full' : kind;
  const f = FRAME[shape], r = role(rk);
  if (!f) throw new Error(`배경 이름이 이상해요: ${name}`);
  const body = shape === 'cover' ? 'radial-gradient(ellipse at 50% 120%, rgba(196,178,247,.42) 0%, rgba(196,178,247,0) 62%), #fffdf7' : r.bodyCss;
  return `<div class="bg" style="position:relative;width:1920px;height:1080px;overflow:hidden;background:#e7e3f7">${DESK}
<div style="position:absolute;left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;box-sizing:border-box;border:${BORDER}px solid ${INK};border-radius:${RADIUS}px;background:${body};box-shadow:12px 12px 0 rgba(75,59,107,.22);overflow:hidden">
<div style="height:${HEAD_H}px;background:${glassHead(r.css)};border-bottom:${BORDER}px solid ${INK};box-shadow:inset 0 3px 0 rgba(255,255,255,.95), inset 0 -12px 16px -12px rgba(255,255,255,.95)"></div>
</div></div>`;
}

// 필요한 배경만 JPEG 로 굽는다. 디자인 값이 같으면 dist/ppt/_bg 에 있는 것을 다시 쓴다(이름에 해시).
export async function renderBackgrounds(names, browser) {
  const dir = path.join(PPT_DIR, '_bg');
  fs.mkdirSync(dir, { recursive: true });
  const out = {};
  let page;
  for (const name of [...new Set(names)]) {
    const html = bgHtml(name);
    const file = path.join(dir, `${name}-${sha(Buffer.from(html))}.jpg`);
    if (!fs.existsSync(file)) {
      page ||= await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      await page.setContent(`<!doctype html><body style="margin:0">${html}</body>`);
      await page.locator('.bg').screenshot({ path: file, type: 'jpeg', quality: 92 });
    }
    out[name] = file;
  }
  if (page) await page.close();
  return out;
}

// ---------- 활동지 그림 → PNG(캔바·PowerPoint 가 똑같이 보이게, SVG 는 3배로) ----------
export async function renderFigure(src, outDir, browser) {
  if (!fs.existsSync(src)) throw new Error(`그림 파일이 없어요: ${src}`);
  fs.mkdirSync(outDir, { recursive: true });
  const ext = path.extname(src).toLowerCase();
  const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext];
  if (!mime) throw new Error(`그림은 svg·png·jpg·webp 만 돼요: ${src}`);
  const uri = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  try {
    await page.setContent(`<body style="margin:0"><img id="i" src="${uri}"></body>`);
    await page.waitForFunction(() => document.getElementById('i').complete);
    let { w, h } = await page.evaluate(() => { const i = document.getElementById('i'); return { w: i.naturalWidth, h: i.naturalHeight }; });
    if (ext !== '.svg') {   // 사진·캡처는 그대로 복사
      const out = path.join(outDir, path.basename(src));
      fs.copyFileSync(src, out);
      return { file: out, w, h };
    }
    const vb = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(fs.readFileSync(src, 'utf8'));
    if (vb) { w = +vb[1]; h = +vb[2]; }
    if (!w || !h) throw new Error(`그림 크기를 못 읽었어요(viewBox): ${src}`);
    const out = path.join(outDir, path.basename(src, ext) + '.png');
    const p2 = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: 3 });
    await p2.setContent(`<body style="margin:0;background:#fffdf7"><img id="i" src="${uri}" style="display:block;width:${w}px;height:${h}px"></body>`);
    await p2.waitForFunction(() => document.getElementById('i').complete);
    await p2.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
    await p2.close();
    return { file: out, w, h };
  } finally { await page.close(); }
}

// ---------- 점검 그림 ----------
// render/sNN.png 를 한 장으로(4열) → render/_sheet.png
export async function contactSheet(renderDir, browser, cols = 4, cw = 480) {
  const files = fs.readdirSync(renderDir).filter((f) => /^s\d+\.png$/.test(f)).sort();
  const page = await browser.newPage({ viewport: { width: cols * (cw + 6) + 6, height: 800 } });
  const cells = files.map((f) => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(path.join(renderDir, f)).toString('base64')}" style="display:block;width:${cw}px;height:${cw * 9 / 16}px"><b style="position:absolute;left:4px;top:4px;background:#fff;font:bold 14px sans-serif;padding:0 4px">${f.slice(1, 3)}</b></div>`).join('');
  await page.setContent(`<body style="margin:0;background:#888"><div id="g" style="display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:6px;padding:6px;width:max-content">${cells}</div></body>`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  const out = path.join(renderDir, '_sheet.png');
  await page.locator('#g').screenshot({ path: out });
  await page.close();
  return out;
}
// render/sNN.png → 960×540 JPEG(내려받기 페이지 미리보기)
export async function thumbnails(renderDir, outDir, browser) {
  fs.mkdirSync(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const files = fs.readdirSync(renderDir).filter((f) => /^s\d+\.png$/.test(f)).sort();
  for (const f of files) {
    await page.setContent(`<body style="margin:0"><img src="data:image/png;base64,${fs.readFileSync(path.join(renderDir, f)).toString('base64')}" style="display:block;width:960px;height:540px"></body>`);
    await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
    await page.screenshot({ path: path.join(outDir, f.replace('.png', '.jpg')), type: 'jpeg', quality: 86 });
  }
  await page.close();
  return files.length;
}

// ---------- 글꼴 ----------
// Silkscreen 은 PC 에 없어도 되게 저장소 woff2 를 ttf 로 풀어 둔다(PowerPoint 점검·꾸러미용)
export async function silkscreenTtf() {
  const out = path.join(PPT_DIR, '_fonts', FONTS.p.file);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const wawoff = require('wawoff2');
    fs.writeFileSync(out, Buffer.from(await wawoff.decompress(fs.readFileSync(fontFile('p')))));
  }
  return out;
}
const FONT_README = `정보 수업 PPT — 글꼴 꾸러미

PPT 에 쓴 글꼴 5개예요.
- 강원교육튼튼 (GangwonEduPower) : 표지·간지의 큰 제목
- CookieRun Bold                 : 제목·이름표·단추
- Maplestory Light / Bold        : 본문 / 강조
- Silkscreen                     : 영문 픽셀 라벨(TODAY_GOALS, ACTIVITY_1 …)

[캔바]
1) 왼쪽 메뉴 '브랜드'(브랜드 키트) → 글꼴 → '글꼴 업로드'에서 .ttf 5개를 올려요(캔바 교육용·Pro 계정).
2) 그다음 .pptx 를 올려요(홈의 '업로드' 또는 파일을 홈 화면에 끌어다 놓기).
3) 글꼴이 다르게 보이는 글은 골라서 글꼴 목록의 브랜드 글꼴 중 같은 이름으로 바꿔요.

[PowerPoint 로 발표할 PC]
.ttf 파일을 두 번 눌러 '설치'.

[저작권]
모두 무료 글꼴이고 저작권은 만든 곳에 있어요 — 강원교육튼튼(강원특별자치도교육청), 쿠키런(데브시스터즈),
메이플스토리(넥슨), Silkscreen(Jason Kottke, SIL Open Font License 1.1).
`;
// 글꼴 꾸러미 zip(한 번 만들어 dist/ppt/_fonts 에 둔다)
export async function fontPack() {
  const out = path.join(PPT_DIR, '_fonts', '정보수업_글꼴꾸러미.zip');
  if (fs.existsSync(out)) return out;
  const JSZip = require('jszip');
  const zip = new JSZip();
  for (const k of ['d', 't', 'b', 'bb']) zip.file(`글꼴/${FONTS[k].file}`, fs.readFileSync(fontFile(k)));
  zip.file(`글꼴/${FONTS.p.file}`, fs.readFileSync(await silkscreenTtf()));
  zip.file('글꼴/읽어 보세요.txt', '﻿' + FONT_README);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }));
  return out;
}

export { launchBrowser, pathToFileURL };
