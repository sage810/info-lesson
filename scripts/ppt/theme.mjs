// 수업 PPT 디자인 값 — 시안 A「카드」(선생님 선택 2026-10-18). 활동지 틀의 역할 색·글꼴·잉크 선 그대로, 새 색 없음.
// 좌표는 1920×1080 px 기준(1px = 1/144 in, 글자 px × 0.5 = pt). 규칙·순서: docs/rules/ppt.md
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from '../lib/common.mjs';

export const require = createRequire(import.meta.url);   // scripts/ppt/node_modules 에서 찾는다

// ---------- 색 ----------
export const INK = '4B3B6B', SOFT = '5A4A86', MUTED = '6B5B93', CREAM = 'FFFDF7';
export const PILL = 'ECE4FF';   // 오로라 유리 알약의 가운데 색(그라데이션은 캔바가 잃기 쉬워 한 색)
export const SCHOOL = '신현중학교 정보';

// 카드 한 벌(머리·몸통) — docs/rules/color-map.md 의 역할 색. css = 배경 그림에 굽는 값, head/body = PPT 요소용 hex
export const ROLES = {
  topic:   { css: 'linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)', bodyCss: '#f6f8fd', body: 'F6F8FD', name: 'TODAY_TOPIC' },
  goals:   { css: '#e8c4c4', bodyCss: '#fcf5f5', head: 'E8C4C4', body: 'FCF5F5', coin: 'F0D6D6', name: 'TODAY_GOALS' },
  warmup:  { css: '#c9e4dc', bodyCss: '#f3faf7', head: 'C9E4DC', body: 'F3FAF7', chip: '도입', name: 'WARM_UP' },
  intro:   { css: '#d8f0c4', bodyCss: '#f7fcf2', head: 'D8F0C4', body: 'F7FCF2', chip: '도입', name: 'TODAY_TOPIC' },
  act1:    { css: '#c4d8f7', bodyCss: '#f4f8fe', head: 'C4D8F7', body: 'F4F8FE', chip: '전개' },
  act2:    { css: '#bfe9dd', bodyCss: '#f1fbf7', head: 'BFE9DD', body: 'F1FBF7', chip: '전개' },
  act3:    { css: 'linear-gradient(90deg,#f1f8b8 0%,#d6f0a8 100%)', bodyCss: '#fbfdf0', head: 'E4F4B0', body: 'FBFDF0', chip: '전개' },
  act4:    { css: '#d6c4f5', bodyCss: '#f8f4fe', head: 'D6C4F5', body: 'F8F4FE', chip: '전개' },
  summary: { css: '#f7bfb2', bodyCss: '#fff4f1', head: 'F7BFB2', body: 'FFF4F1', th: 'F6E6E6', chip: '정리', name: 'KEY_SUMMARY' },
  checkup: { css: '#eec6ea', bodyCss: '#fdf5fc', head: 'EEC6EA', body: 'FDF5FC', coin: 'F4D5F0', chip: '정리', name: 'CHECK_UP' },
  help:    { css: '#e8d9b8', bodyCss: '#fffdf7', head: 'E8D9B8', body: 'FFFDF7', name: 'HOW_TO_USE' },
};
// role('act5') → 활동 1~4 색을 돌려 쓰고 이름은 ACTIVITY_5
export function role(key = 'act1') {
  const m = /^act(\d+)$/.exec(key);
  if (m) {
    const n = +m[1], base = `act${((n - 1) % 4) + 1}`;
    return { ...ROLES[base], key, bgKey: base, name: `ACTIVITY_${n}` };
  }
  if (!ROLES[key]) throw new Error(`role 「${key}」 이 없어요 — ${Object.keys(ROLES).join(' · ')} · act<번호>`);
  return { ...ROLES[key], key, bgKey: key };
}
// 단계 → PowerPoint 구역 이름
export const sectionOf = (r) => (r.chip || (r.key === 'goals' ? '표지·목표' : '마무리·안내'));

// ---------- 틀 자리(px) ----------
export const FRAME = {
  full:   { x: 64, y: 52, w: 1780, h: 964 },    // 내용 장: 모눈 책상 위 카드 한 장
  dialog: { x: 310, y: 250, w: 1300, h: 580 },  // 간지: 가운데 창 카드
  cover:  { x: 220, y: 300, w: 1480, h: 620 },  // 표지·마무리: TODAY_TOPIC 카드
};
export const HEAD_H = 84, BORDER = 6, RADIUS = 32;
export const C = { x0: 126, x1: 1782, y0: 188, y1: 966, w: 1656 };   // full 카드 안 내용 칸

// ---------- 단위 ----------
export const I = (px) => +(px / 144).toFixed(4);
export const PT = (px) => +(px * 0.5).toFixed(2);
const hex2 = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
// 흐림 0 어긋난 그림자를 "뒤에 깐 도형"으로 그릴 때의 색(바탕 위 잉크 a 만큼) — 캔바가 효과를 잃어도 남는다
export const blend = (bg, a, fg = INK) => {
  const B = hex2(bg), F = hex2(fg);
  return B.map((v, i) => Math.round(v * (1 - a) + F[i] * a).toString(16).padStart(2, '0')).join('').toUpperCase();
};

// ---------- 글꼴(PowerPoint·캔바가 이름으로 찾는다 — 설치된 글꼴의 이름 그대로) ----------
// 큰 제목 = 강원교육튼튼: 활동지의 'GangwonEdu' 파일(design/fonts/GangwonEdu-400.woff2)이 실제로 이 글꼴이다.
// 쿠키런은 굵기마다 이름이 따로("CookieRun Bold")라 굵게 표시를 켜지 않는다(켜면 두 번 굵어짐).
export const FONTS = {
  d:  { face: 'GangwonEduPower', file: '강원교육튼튼.ttf', label: '강원교육튼튼' },
  t:  { face: 'CookieRun Bold', file: 'CookieRun Bold.ttf', label: '쿠키런 Bold' },
  b:  { face: 'Maplestory', file: 'Maplestory Light.ttf', label: '메이플스토리 Light' },
  bb: { face: 'Maplestory', file: 'Maplestory Bold.ttf', bold: true, label: '메이플스토리 Bold' },
  p:  { face: 'Silkscreen', file: 'Silkscreen-Regular.ttf', woff2: 'design/fonts/Silkscreen-400.woff2', label: 'Silkscreen' },
};
const FONT_DIRS = [
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'Fonts'),
  path.join(process.env.WINDIR || 'C:/Windows', 'Fonts'),
];
// 글꼴 파일 위치 — Silkscreen 은 저장소의 woff2 를 쓴다(이 PC 에 안 깔려 있어도 됨)
export function fontFile(k) {
  const f = FONTS[k];
  if (f.woff2) return path.join(ROOT, f.woff2);
  const hit = FONT_DIRS.map((d) => path.join(d, f.file)).find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`이 PC 에 「${f.label}」 글꼴(${f.file})이 없어요 — 글꼴 꾸러미의 .ttf 를 두 번 눌러 설치하세요.`);
  return hit;
}
const fontCache = {};
// 한 줄 글 폭(px). PowerPoint 는 글꼴 표보다 4~8% 넓게 그려서 1.08 배로 잡는다(렌더 점검 2026-10-18).
export function measure(k, text, px, cs = 0) {
  const fontkit = require('fontkit');
  const font = (fontCache[k] ||= fontkit.openSync(fontFile(k)));
  return (font.layout(String(text)).advanceWidth / font.unitsPerEm * px + cs * [...String(text)].length) * 1.08;
}

// ---------- 글 표기 ----------
// "**굵게**" → 메이플스토리 Bold, "\n" → 줄바꿈. 본문(메이플스토리) 글에만 쓴다.
export function runs(text) {
  const out = [];
  String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).forEach((part) => {
    const bold = /^\*\*[^*]+\*\*$/.test(part);
    const t = bold ? part.slice(2, -2) : part;
    t.split('\n').forEach((line, i, arr) => {
      if (line) out.push({ text: line, options: bold ? { fontFace: FONTS.bb.face, bold: true } : {} });
      if (i < arr.length - 1) {
        if (out.length) out[out.length - 1].options.breakLine = true;
        else out.push({ text: '', options: { breakLine: true } });
      }
    });
  });
  return out.length ? out : [{ text: '', options: {} }];
}
