// 수업 PPT 내려받기 페이지 — page.html 을 채워 site/index.html 로. 게시는 Claude 가 Artifact 도구로(docs/rules/ppt.md §5).
// .pptx·.zip 은 아티팩트에 딸린 파일로 못 올려서(규칙) 페이지 맨 아래 데이터 칸(base64)에 넣고, 받기 단추가 downloads 기능으로 저장한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../lib/common.mjs';
import { require } from './theme.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 페이지 글꼴 — 활동지와 같은 웹 글꼴(design/fonts 원본)에서 이 페이지에 나오는 글자만 남긴다
const WEB_FONTS = [
  ['GangwonEdu', 400, 'GangwonEdu-400.woff2'], ['CookieRun', 700, 'CookieRun-700.woff2'],
  ['Maplestory', 300, 'Maplestory-300.woff2'], ['Maplestory', 700, 'Maplestory-700.woff2'], ['Silkscreen', 400, 'Silkscreen-400.woff2'],
];
async function fontFaceCss(text) {
  const subset = require('subset-font');
  const out = [];
  for (const [family, weight, file] of WEB_FONTS) {
    const buf = await subset(fs.readFileSync(path.join(ROOT, 'design/fonts', file)), text, { targetFormat: 'woff2' });
    out.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`);
  }
  return out.join('\n');
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)}MB`;

// siteDir 안에 thumbs/sNN.jpg 가 이미 있어야 한다(index.mjs 가 만든다)
export async function buildPage({ siteDir, title, school, tag, labels, pptx, zip }) {
  const thumbs = labels.map((l, i) => {
    const n = String(i + 1).padStart(2, '0');
    return `<figure class="shot"><button type="button" class="frame" data-i="${i}" aria-label="${n}. ${esc(l)} 크게 보기"><img src="thumbs/s${n}.jpg" alt="" width="960" height="540"></button><figcaption><span class="num">${i + 1}</span>${esc(l)}</figcaption></figure>`;
  }).join('\n');
  // 치환 값은 함수로 넘긴다($ 같은 글자가 치환 규칙으로 읽히지 않게)
  const fill = (s, map) => Object.entries(map).reduce((acc, [k, v]) => acc.replaceAll(k, () => v), s);
  const body = fill(fs.readFileSync(path.join(HERE, 'page.html'), 'utf8'), {
    '{{TITLE}}': esc(title), '{{SCHOOL}}': esc(school), '{{TAG}}': esc(tag), '{{COUNT}}': String(labels.length),
    '{{THUMBS}}': thumbs, '{{LABELS}}': JSON.stringify(labels),
    '{{PPTX_NAME}}': esc(pptx.name), '{{PPTX_SIZE}}': mb(pptx.buf.length), '{{ZIP_NAME}}': esc(zip.name), '{{ZIP_SIZE}}': mb(zip.buf.length),
  });
  const text = [...new Set(body.replace(/<[^>]+>/g, ' ') + labels.join(''))].join('') + '0123456789·◀▶✕';
  const html = fill(body, {
    '/*FONTS*/': await fontFaceCss(text), '{{PPTX_B64}}': pptx.buf.toString('base64'), '{{ZIP_B64}}': zip.buf.toString('base64'),
  });
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('page.html 에 채우지 못한 {{…}} 가 남았어요');
  const file = path.join(siteDir, 'index.html');
  fs.writeFileSync(file, html);
  return file;
}
