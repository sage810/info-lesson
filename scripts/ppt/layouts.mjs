// 수업 PPT 장 모양 — ppt.json 의 slides[].layout 하나가 함수 하나. 새 모양을 더하면 docs/rules/ppt.md 표에도 한 줄.
// 배경(모눈 책상·카드 틀)은 media.mjs 가 구운 그림, 여기서는 글·이름표·칸·표처럼 고칠 수 있는 요소만 얹는다.
import { INK, SOFT, MUTED, CREAM, PILL, FRAME, HEAD_H, BORDER, C, I, PT, blend, measure, FONTS, role, runs, sectionOf, require } from './theme.mjs';

// ---------- 부품 ----------
// 상자: CSS 테두리처럼 바깥 크기 안쪽에 선을 그린다(PowerPoint 선은 가운데에 걸리므로 반만큼 안으로).
// 그림자는 흐림 0 어긋난 그림자를 뒤에 깐 도형으로(over = 그림자가 떨어지는 바탕색).
function box(s, { x, y, w, h, r = 0, fill, lw = 0, lc = INK, shadow, over, name, dash }) {
  const shape = r ? 'roundRect' : 'rect';
  const rad = r === 'pill' ? Math.min(w, h) / 2 : r;
  if (shadow) s.addShape(shape, { x: I(x + shadow), y: I(y + shadow), w: I(w), h: I(h), fill: { color: blend(over, 0.2) }, line: { type: 'none' }, rectRadius: rad ? I(rad) : undefined, objectName: `${name || '상자'} 그림자` });
  s.addShape(shape, {
    x: I(x + lw / 2), y: I(y + lw / 2), w: I(w - lw), h: I(h - lw),
    fill: fill ? { color: fill } : { type: 'none' },
    line: lw ? { color: lc, width: PT(lw), dashType: dash || 'solid' } : { type: 'none' },
    rectRadius: rad ? I(Math.max(rad - lw / 2, 0)) : undefined, objectName: name,
  });
}
// 글상자. 본문(f='b')은 "**굵게**"·줄바꿈을 읽는다.
function tx(s, text, { x, y, w, h, f = 'b', size, color = INK, align = 'left', valign = 'top', lh = 1, cs, name, bullet, paraSpaceAfter }) {
  const F = FONTS[f];
  const body = f === 'b' ? runs(text) : String(text);
  // 글머리표는 줄의 첫 조각에만(굵은 글 조각마다 붙이면 줄이 쪼개진다)
  if (bullet && Array.isArray(body)) body.forEach((r, i) => { if (i === 0 || body[i - 1].options.breakLine) r.options.bullet = true; });
  s.addText(body, {
    x: I(x), y: I(y), w: I(w), h: I(h), fontFace: F.face, fontSize: PT(size), color, bold: !!F.bold,
    align, valign, margin: 0, lineSpacingMultiple: lh, charSpacing: cs ? PT(cs) : undefined, paraSpaceAfter,
    isTextBox: true, objectName: name, lang: 'ko-KR',
  });
}
// 글이 든 도형(이름표·알약·동전). link 는 도형에 건다(글에 걸면 밑줄 — 그래도 생기는 밑줄은 deck 후처리가 걷음).
function label(s, text, { x, y, w, h, r = 12, fill = CREAM, lw = 4, lc = INK, f = 't', size, color = INK, shadow, over, name, shape, link }) {
  const kind = shape === 'oval' ? 'ellipse' : 'roundRect';
  const rad = r === 'pill' ? Math.min(w, h) / 2 : r;
  if (shadow) s.addShape(kind, { x: I(x + shadow), y: I(y + shadow), w: I(w), h: I(h), fill: { color: blend(over, 0.25) }, line: { type: 'none' }, rectRadius: kind === 'roundRect' ? I(rad) : undefined, objectName: `${name || text} 그림자` });
  const F = FONTS[f];
  s.addText(String(text), {
    shape: kind, x: I(x + lw / 2), y: I(y + lw / 2), w: I(w - lw), h: I(h - lw),
    hyperlink: link ? { url: link, tooltip: link } : undefined,
    fill: { color: fill }, line: lw ? { color: lc, width: PT(lw) } : { type: 'none' },
    rectRadius: kind === 'roundRect' ? I(Math.max(rad - lw / 2, 0)) : undefined,
    fontFace: F.face, fontSize: PT(size), color, bold: !!F.bold, align: 'center', valign: 'middle', margin: 0,
    objectName: name || String(text), lang: 'ko-KR',
  });
}
const chipW = (t, size = 28) => Math.ceil(measure('t', t, size) + 34 + 8);
const coin = (s, n, x, y, d, fill, over, size) => label(s, String(n), { x, y, w: d, h: d, shape: 'oval', fill, lw: 4, size: size || Math.round(d * 0.45), shadow: 4, over, name: `번호 ${n}` });

// 카드 머리: 단계 이름표(흰) + 픽셀 이름 — 진행 지도 줄 대신 이것으로 단계를 알린다(order.md)
function head(s, frame, { chip, name }) {
  const cy = frame.y + BORDER + HEAD_H / 2;
  let x = frame.x + BORDER + 36;
  if (chip) { const w = chipW(chip); label(s, chip, { x, y: cy - 24, w, h: 48, r: 12, fill: CREAM, lw: 4, size: 28, name: `단계 이름표 ${chip}` }); x += w + 18; }
  if (name) tx(s, name, { x, y: cy - 22, w: measure('p', name, 26, 3) + 40, h: 44, f: 'p', size: 26, cs: 3, valign: 'middle', name: '픽셀 이름' });
}
const headOf = (sp, r) => ({ chip: sp.chip ?? r.chip, name: sp.name ?? r.name });
let TITLE_PX = 60;   // 장 제목 글자(px) — ppt.json 의 titleSize 로 차시마다 바꿀 수 있다(buildDeck 이 정함)
const title = (s, t) => tx(s, t, { x: C.x0, y: C.y0, w: C.w, h: 86, f: 't', size: TITLE_PX, valign: 'middle', name: '제목' });

// 그림 칸: 틀 안에 비율 그대로 넣는다(가운데)
function figureIn(s, fig, { x, y, w, h, over, alt }) {
  box(s, { x, y, w, h, r: 26, fill: CREAM, lw: 4, shadow: 6, over, name: '그림 칸' });
  const iw = w - 48, ih = h - 52, k = Math.min(iw / fig.w, ih / fig.h);
  const fw = fig.w * k, fh = fig.h * k;
  s.addImage({ path: fig.file, x: I(x + 24 + (iw - fw) / 2), y: I(y + 26 + (ih - fh) / 2), w: I(fw), h: I(fh), altText: alt || '', objectName: '그림' });
}
function steps(s, items, { x, y, w, fill, over }) {
  const n = items.length, few = n <= 3;
  const gap = few ? 18 : 14, d = few ? 66 : 62, size = few ? 34 : 32;
  const rowH = few ? 96 : Math.min(106, Math.floor((900 - y - (n - 1) * gap) / n));
  items.forEach((t, i) => {
    const ry = y + i * (rowH + gap);
    coin(s, i + 1, x, ry + (rowH - d) / 2, d, fill, over, Math.round(d * 0.46));
    tx(s, t, { x: x + d + 26, y: ry, w: w - d - 26, h: rowH, size, lh: 1.05, valign: 'middle', name: `단계 ${i + 1}` });
  });
}
function linkCard(s, { x, y, w, h, over, pixel, name, sub, button, url }) {
  box(s, { x, y, w, h, r: 26, fill: CREAM, lw: 4, shadow: 6, over, name: '열기 카드' });
  if (pixel) tx(s, pixel, { x: x + 36, y: y + 30, w: w - 72, h: 40, f: 'p', size: 24, cs: 3, color: MUTED, valign: 'middle', name: '픽셀 이름' });
  tx(s, name, { x: x + 36, y: y + 80, w: w - 72, h: 64, f: 't', size: 42, valign: 'middle', name: '사이트 이름' });
  if (sub) tx(s, sub, { x: x + 36, y: y + 148, w: w - 72, h: 44, size: 28, color: MUTED, valign: 'middle', name: '사이트 설명' });
  if (button) label(s, button, { x: x + 36, y: y + h - 104, w: chipW(button, 32) + 40, h: 70, r: 'pill', fill: PILL, lw: 3, size: 32, shadow: 4, over: CREAM, name: '열기 버튼', link: url });
}
const TONE = { ask: 'FFF6E6', tip: 'F3EEFE', warn: 'FDF0EE', reason: 'EEF9F3' };   // ui-callout-* 역할 색
function callout(s, { x, y, w, h, over, tag, text, tone = 'ask', size = 34 }) {
  box(s, { x, y, w, h, r: 26, fill: TONE[tone] || tone, lw: 4, shadow: 6, over, name: `${tag} 상자` });
  label(s, tag, { x: x + 34, y: y + 30, w: chipW(tag, 26), h: 46, r: 12, fill: CREAM, lw: 3, size: 26, name: `${tag} 이름표` });
  tx(s, text, { x: x + 36, y: y + 96, w: w - 100, h: h - 120, size, lh: 1.1, valign: 'top', name: `${tag} 글` });
}

// ---------- 정답 맞히기 부품 — 안내 1장 + 답 1개씩(캔바엔 「클릭하면 하나씩 나타나기」가 없어 장을 나눈다) ----------
const OK_INK = '3D7F6C', OK_CHIP = 'A8E6CF', FOCUS = 'EE9DBF';   // 역할 색: ui-feedback-ok-ink · chip-ok(한 색) · ui-focus-pink
const circ = (n) => '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮'[n - 1] || `(${n})`;
// 글 조각: "**굵게**"·"\n"·"{정답}". 정답 칸은 next() 로 번호를 매기고, step 번까지는 정답(초록 굵게 · asize 로 크게), step 번째는 밑줄까지.
// f='t'(쿠키런)는 이미 굵은 글꼴이라 **굵게** 를 그냥 글로 둔다(메이플스토리 Bold 로 바뀌지 않게).
function blankRuns(text, { f = 'b', next, step, asize }) {
  const F = FONTS[f], out = [];
  const push = (t, o) => t.split('\n').forEach((line, i, arr) => {
    if (line) out.push({ text: line, options: { ...o } });
    if (i < arr.length - 1) { if (out.length) out[out.length - 1].options.breakLine = true; else out.push({ text: '', options: { breakLine: true } }); }
  });
  String(text).split(/(\*\*[^*]+\*\*|\{[^}]+\})/).filter(Boolean).forEach((part) => {
    if (/^\{[^}]+\}$/.test(part)) {
      const n = next();
      if (n <= step) push(part.slice(1, -1), { fontFace: f === 't' ? F.face : FONTS.bb.face, bold: f !== 't', color: OK_INK, ...(asize ? { fontSize: PT(asize) } : {}), ...(n === step ? { underline: { style: 'sng', color: OK_INK } } : {}) });
      else push(`(  ${circ(n)}  )`, { fontFace: F.face, bold: !!F.bold, color: MUTED });
    } else if (/^\*\*[^*]+\*\*$/.test(part)) push(part.slice(2, -2), f === 't' ? {} : { fontFace: FONTS.bb.face, bold: true });
    else push(part, {});
  });
  return out.length ? out : [{ text: '', options: {} }];
}
const answersIn = (texts) => texts.flatMap((t) => [...String(t ?? '').matchAll(/\{([^}]+)\}/g)].map((m) => m[1]));
const runText = (s, rs, { x, y, w, h, f = 'b', size, lh = 1.08, valign = 'top', align = 'left', name }) => s.addText(rs, {
  x: I(x), y: I(y), w: I(w), h: I(h), fontFace: FONTS[f].face, fontSize: PT(size), color: INK, bold: false,
  align, valign, margin: 0, lineSpacingMultiple: lh, isTextBox: true, objectName: name, lang: 'ko-KR',
});
// 위쪽: 제목 + 오른쪽 알약(안내 장 = 할 일, 정답 장 = 「정답 k / N」) + 할 일 줄(+ 이름표 보기 — 활동지와 같은 순서)
function revealTop(s, sp, r, step, total) {
  head(s, FRAME.full, headOf(sp, r));
  const pill = step ? `정답 ${step} / ${total}` : (sp.pill || '활동지에 해요'), pw = chipW(pill, 30) + 28;
  tx(s, sp.title, { x: C.x0, y: C.y0, w: C.w - pw - 40, h: 86, f: 't', size: TITLE_PX, valign: 'middle', name: '제목' });
  label(s, pill, { x: C.x1 - 6 - pw, y: C.y0 + 12, w: pw, h: 62, r: 'pill', fill: step ? OK_CHIP : PILL, lw: 3, size: 30, shadow: 4, over: r.body, name: step ? '정답 순서' : '할 일' });
  let bw = 0;
  if (sp.bank?.length) {
    const ws = sp.bank.map((t) => chipW(t, 26) + 6);
    bw = ws.reduce((a, b) => a + b, 0) + (ws.length - 1) * 12;
    let x = C.x1 - 6 - bw;
    sp.bank.forEach((t, i) => { label(s, t, { x, y: 292, w: ws[i], h: 52, r: 'pill', fill: PILL, lw: 3, size: 26, shadow: 3, over: r.body, name: `이름표 ${t}` }); x += ws[i] + 12; });
    bw += 30;
  }
  const task = step ? (sp.check || '내 답과 비교하며, 왜 그 답인지 같이 이야기해 봐요.') : sp.task;
  if (task) tx(s, task, { x: C.x0, y: 290, w: C.w - 6 - bw, h: 56, size: 30, color: MUTED, valign: 'middle', name: '할 일 안내' });
}
// 아래 상자: 정답 장 = 「왜 그럴까?」(lead = 정답 — 초록 굵게 크게, text = 이유), 안내 장 = 도움말(hint)이 있을 때만
function revealBottom(s, r, { tag, lead, text, tone = 'reason', y = 842, h = 116 }) {
  box(s, { x: C.x0, y, w: C.w - 6, h, r: 24, fill: TONE[tone] || tone, lw: 4, shadow: 6, over: r.body, name: `${tag} 상자` });
  const tw = chipW(tag, 28);
  label(s, tag, { x: C.x0 + 30, y: y + (h - 52) / 2, w: tw, h: 52, r: 12, fill: CREAM, lw: 3, size: 28, name: `${tag} 이름표` });
  const x = C.x0 + 30 + tw + 26, box2 = { x, y: y + 8, w: C.x0 + C.w - 6 - 30 - x, h: h - 16, size: 30, lh: 1.08, valign: 'middle', name: `${tag} 글` };
  if (!lead) return tx(s, text, box2);
  runText(s, [{ text: lead, options: { fontFace: FONTS.bb.face, bold: true, color: OK_INK, fontSize: PT(36) } }, { text: '  ', options: {} }, ...runs(text)], box2);
}
// 빈 칸(점선) · 채운 칸(초록 이름표) · 방금 채운 칸(분홍 테두리)
function slot(s, { x, y, w, h, text, state, f = 't', size, name }) {
  if (state === 'empty') return box(s, { x, y, w, h, r: 14, fill: CREAM, lw: 3, dash: 'dash', name: `${name} 빈 칸` });
  label(s, text, { x, y, w, h, r: 14, fill: OK_CHIP, lw: state === 'now' ? 6 : 3, lc: state === 'now' ? FOCUS : INK, f, size, name: `${name} 정답` });
}
// 한 묶음을 「안내 1장 + 답 1개씩」으로 펼친다. answers: [{ a, why, short? }], draw(s, step, r)
function revealSlides(ctx, sp, answers, draw) {
  const r = role(sp.role), N = answers.length;
  for (let step = 0; step <= N; step++) {
    const cur = answers[step - 1];
    const notes = step
      ? [`정답 맞히기 ${step}/${N} — ${cur.short || cur.a}`, cur.why].filter(Boolean).join('\n')
      : [sp.notes, `안내 장 — 학생들이 이 장을 보며 활동지에 해요. 다음 장부터 정답이 하나씩 나와요(${N}개).`].filter(Boolean).join('\n');
    const s = ctx.add({ ...sp, notes }, { tag: `${LABEL[sp.layout]} · ${step ? `정답 ${step}/${N}` : '안내'}` });
    revealTop(s, sp, r, step, N);
    draw(s, step, r);
    if (step) revealBottom(s, r, { tag: '왜 그럴까?', lead: `${N > 1 ? `${circ(step)} ` : ''}${cur.short || cur.a}`, text: cur.why });
    else if (sp.hint) revealBottom(s, r, { tone: 'ask', ...sp.hint });
  }
}

// ---------- 장 모양 ----------
// 배경 이름(media.bgHtml)·필요한 그림·미리보기 이름표
export function backgroundOf(sp) {
  if (sp.layout === 'cover' || sp.layout === 'end') return 'cover';
  if (sp.layout === 'guide') return 'card-help';
  const r = role(sp.role || DEFAULT_ROLE[sp.layout] || 'act1');
  return `${sp.layout === 'divider' ? 'dialog' : 'card'}-${r.bgKey}`;
}
export const figuresOf = (sp) => (sp.figure ? [sp.figure] : []);
const DEFAULT_ROLE = { goals: 'goals', topic: 'intro', table: 'summary', quiz: 'checkup', guide: 'help' };
export const LABEL = {
  cover: '표지', goals: '학습 목표', divider: '간지', activity: '활동 안내', topic: '학습주제 제시', concept: '개념 + 그림',
  compare: '2단 비교', cards3: '개념 3카드', table: '표 · 핵심 정리', quiz: '형성평가 O/X', bullets: '글 목록', image: '그림 크게',
  end: '마무리', guide: '쓰는 법(선생님용)',
  fill: '빈칸 맞히기', fillcards: '빈칸 카드 맞히기', order: '순서 맞히기', match: '이름표 맞히기', choice: '고르기 맞히기',
};

function schoolRow(s, meta) {
  const nameW = Math.ceil(measure('d', meta.school, 50)) + 8, tagW = Math.ceil(measure('p', meta.tag, 24, 3)) + 36;
  const x = Math.round(960 - (nameW + 22 + tagW) / 2);
  tx(s, meta.school, { x, y: 196, w: nameW, h: 70, f: 'd', size: 50, valign: 'middle', name: '학교 이름' });
  label(s, meta.tag, { x: x + nameW + 22, y: 208, w: tagW, h: 46, r: 10, fill: 'D6C4F5', lw: 3, f: 'p', size: 24, name: '차시 태그' });
}

const L = {
  cover(ctx, sp) {
    const { meta } = ctx, f = FRAME.cover;
    const s = ctx.add(sp, { number: false });
    schoolRow(s, meta);
    tx(s, sp.pixel || 'TODAY_TOPIC', { x: f.x + BORDER + 36, y: f.y + BORDER + HEAD_H / 2 - 22, w: 360, h: 44, f: 'p', size: 26, cs: 3, valign: 'middle', name: '픽셀 이름' });
    const unit = sp.unit || meta.unit, no = sp.no || meta.no;
    const uW = Math.ceil(measure('t', unit, 54)), nW = Math.ceil(measure('t', `· ${no}`, 36));
    const ux = Math.round(960 - (uW + 16 + nW) / 2);
    s.addShape('rect', { x: I(ux - 8), y: I(500), w: I(uW + 16), h: I(30), fill: { color: 'D6C4F5' }, line: { type: 'none' }, objectName: '단원 형광펜' });
    tx(s, unit, { x: ux, y: 456, w: uW + 4, h: 80, f: 't', size: 54, valign: 'bottom', name: '단원 이름' });
    tx(s, `· ${no}`, { x: ux + uW + 16, y: 462, w: nW + 8, h: 70, f: 't', size: 36, color: MUTED, valign: 'bottom', name: '차시' });
    tx(s, sp.title || meta.title, { x: f.x + 60, y: 544, w: f.w - 120, h: 228, f: 'd', size: 176, align: 'center', valign: 'middle', name: '수업 제목' });
    if (sp.sub) tx(s, sp.sub, { x: f.x + 60, y: 776, w: f.w - 120, h: 64, size: 42, color: SOFT, align: 'center', valign: 'middle', name: '한 줄 소개' });
  },

  goals(ctx, sp) {
    const r = role('goals'), s = ctx.add(sp);
    head(s, FRAME.full, { name: sp.name || r.name });
    title(s, sp.title || '오늘의 목표');
    (sp.goals || []).forEach((g, i) => {
      const y = 304 + i * 206;
      box(s, { x: C.x0, y, w: C.w - 6, h: 170, r: 24, fill: CREAM, lw: 4, shadow: 6, over: r.body, name: `목표 ${i + 1} 칸` });
      coin(s, i + 1, C.x0 + 48, y + 39, 92, r.coin, CREAM);
      tx(s, g, { x: C.x0 + 176, y: y + 10, w: C.w - 6 - 224, h: 150, size: 48, valign: 'middle', name: `목표 ${i + 1}` });
    });
  },

  divider(ctx, sp) {
    const r = role(sp.role), f = FRAME.dialog, s = ctx.add(sp);
    head(s, f, headOf(sp, r));
    const lines = Array.isArray(sp.lines) ? sp.lines : [sp.title];
    tx(s, lines.join('\n'), { x: f.x + 86, y: f.y + 152, w: f.w - 172, h: 264, f: 'd', size: 104, lh: 1.05, valign: 'top', name: '간지 제목' });
    if (sp.time) label(s, sp.time, { x: f.x + 86, y: f.y + 446, w: chipW(sp.time, 30) + 16, h: 62, r: 'pill', fill: PILL, lw: 3, size: 30, shadow: 4, over: r.body, name: '걸리는 시간' });
  },

  activity(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    const side = sp.link || sp.callout, w = side ? 940 : C.w;
    let y = 300;
    if (sp.intro) { tx(s, sp.intro, { x: C.x0, y: 302, w, h: 150, size: 36, lh: 1.15, name: '활동 소개' }); y = 492; }
    steps(s, sp.steps || [], { x: C.x0, y, w: side ? w : C.w, fill: r.head, over: r.body });
    let ry = 302;
    if (sp.link) { linkCard(s, { x: 1150, y: ry, w: 632, h: 330, over: r.body, ...sp.link }); ry = 672; }
    if (sp.callout) callout(s, { x: 1150, y: ry, w: 632, h: ry === 302 ? 330 : 252, over: r.body, ...sp.callout });
  },

  topic(ctx, sp) {
    const r = role(sp.role || 'intro'), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    if (sp.lead) tx(s, sp.lead, { x: C.x0, y: 300, w: C.w, h: 160, size: 38, lh: 1.15, name: '주제 소개' });
    tx(s, sp.label || '오늘 알아볼 것', { x: C.x0, y: 500, w: 600, h: 50, f: 't', size: 32, color: MUTED, valign: 'middle', name: '소제목' });
    const kws = sp.keywords || [], n = kws.length || 1, cw = (C.w - (n - 1) * 40 - 8) / n;
    kws.forEach(([k, sub], i) => {
      const x = C.x0 + i * (cw + 40), y = 572;
      box(s, { x, y, w: cw, h: 300, r: 26, fill: CREAM, lw: 4, shadow: 8, over: r.body, name: `알아볼 것 ${i + 1}` });
      coin(s, i + 1, x + 36, y + 34, 70, r.head, CREAM);
      tx(s, k, { x: x + 36, y: y + 128, w: cw - 72, h: 70, f: 't', size: 44, valign: 'middle', name: `알아볼 것 ${i + 1} 낱말` });
      if (sub) tx(s, sub, { x: x + 36, y: y + 204, w: cw - 72, h: 60, size: 30, color: MUTED, valign: 'middle', name: `알아볼 것 ${i + 1} 질문` });
    });
  },

  concept(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    figureIn(s, ctx.fig(sp.figure), { x: C.x0, y: 304, w: 1000, h: 472, over: r.body, alt: sp.figureAlt });
    if (sp.caption) tx(s, sp.caption, { x: C.x0, y: 796, w: 1000, h: 44, size: 26, color: MUTED, valign: 'middle', name: '그림 설명' });
    (sp.terms || []).slice(0, 4).forEach(([k, v], i) => {
      const y = 300 + i * 158, x = 1180;
      box(s, { x, y: y + 15, w: 28, h: 28, r: 'pill', fill: r.head, lw: 3, name: `낱말 ${i + 1} 점` });
      tx(s, k, { x: x + 46, y, w: 556, h: 58, f: 't', size: 38, valign: 'middle', name: `낱말 ${i + 1}` });
      tx(s, v, { x: x + 46, y: y + 62, w: 540, h: 88, size: 30, lh: 1.05, valign: 'top', name: `낱말 ${i + 1} 뜻` });
    });
  },

  compare(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    if (sp.lead) tx(s, sp.lead, { x: C.x0, y: 300, w: C.w, h: 58, size: 38, valign: 'middle', name: '기준' });
    const COLS = [{ color: 'C4D8F7', tint: 'F4F8FE' }, { color: 'BFE9DD', tint: 'F1FBF7' }];   // 하늘 · 민트(활동지 비교 그림과 같은 짝)
    const cw = (C.w - 48 - 8) / 2;
    (sp.columns || []).slice(0, 2).forEach((c, i) => {
      const col = { ...COLS[i], ...c }, x = C.x0 + i * (cw + 48), y = 396, h = 514;
      box(s, { x, y, w: cw, h, r: 28, fill: CREAM, lw: 4, shadow: 8, over: r.body, name: `${col.name} 칸` });
      label(s, col.name, { x: x + 36, y: y + 34, w: chipW(col.name, 36) + 24, h: 66, r: 16, fill: col.color, lw: 3, size: 36, name: `${col.name} 이름` });
      if (col.desc) tx(s, col.desc, { x: x + 36, y: y + 128, w: cw - 96, h: 124, size: 34, lh: 1.05, valign: 'top', name: `${col.name} 설명` });
      tx(s, sp.label || '이런 게 있어요', { x: x + 36, y: y + 272, w: 400, h: 44, f: 't', size: 28, color: MUTED, valign: 'middle', name: `${col.name} 예 제목` });
      let ex = x + 36, ey = y + 332;
      (col.examples || []).forEach((t) => {
        const w = Math.ceil(measure('b', t, 30)) + 48;
        if (ex + w > x + cw - 36) { ex = x + 36; ey += 78; }
        label(s, t, { x: ex, y: ey, w, h: 64, r: 14, fill: col.tint, lw: 3, f: 'b', size: 30, name: `예 ${t}` });
        ex += w + 16;
      });
    });
  },

  cards3(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    const cards = (sp.cards || []).slice(0, 3), n = cards.length || 1, cw = (C.w - (n - 1) * 36 - 8) / n;
    cards.forEach((c, i) => {
      const x = C.x0 + i * (cw + 36), y = 304, h = 520;
      box(s, { x, y, w: cw, h, r: 28, fill: CREAM, lw: 4, shadow: 8, over: r.body, name: `${c.term} 칸` });
      label(s, c.term, { x: x + 34, y: y + 34, w: chipW(c.term, 36) + 24, h: 66, r: 'pill', fill: r.head, lw: 3, size: 36, name: `${c.term} 이름` });
      tx(s, c.text, { x: x + 36, y: y + 128, w: cw - 92, h: 200, size: 33, lh: 1.1, valign: 'top', name: `${c.term} 뜻` });
      if (c.analogy) {
        box(s, { x: x + 28, y: y + h - 156, w: cw - 56, h: 124, r: 18, fill: 'F1ECFB', name: `${c.term} 빗대기 칸` });
        tx(s, sp.analogyLabel || '빗대어 보면?', { x: x + 52, y: y + h - 142, w: cw - 104, h: 40, f: 't', size: 26, color: MUTED, valign: 'middle', name: `${c.term} 빗대기 제목` });
        tx(s, c.analogy, { x: x + 52, y: y + h - 98, w: cw - 104, h: 56, f: 't', size: 36, valign: 'middle', name: `${c.term} 빗대기` });
      }
    });
    if (sp.foot) tx(s, sp.foot, { x: C.x0, y: 858, w: C.w, h: 60, size: 30, color: MUTED, valign: 'middle', name: '덧붙임' });
  },

  table(ctx, sp) {
    const r = role(sp.role || 'summary'), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    const rows = sp.rows || [], many = rows.length > 6;
    const size = many ? 26 : 29, rowH = many ? 58 : 68;
    const cell = { fontSize: PT(size), color: INK, valign: 'middle', margin: [5, 9, 5, 9] };
    const pct = sp.colW || (sp.header || rows[0] || []).map(() => 100 / (sp.header || rows[0]).length);
    const hdr = (sp.header || []).map((t) => ({ text: t, options: { ...cell, fontFace: FONTS.t.face, fill: { color: r.th || 'F6E6E6' } } }));
    const body = rows.map((row) => row.map((t, j) => ({ text: t, options: { ...cell, fontFace: j === 0 ? FONTS.t.face : FONTS.b.face, fill: { color: CREAM } } })));
    s.addTable(hdr.length ? [hdr, ...body] : body, { x: I(C.x0), y: I(300), w: I(C.w), colW: pct.map((p) => I(C.w * p / 100)), rowH: I(rowH), border: { type: 'solid', pt: 1.5, color: INK }, autoPage: false });
    if (sp.key) {
      const ky = 300 + (rows.length + (hdr.length ? 1 : 0)) * rowH + 46;
      box(s, { x: C.x0, y: ky, w: C.w - 6, h: 100, r: 22, fill: CREAM, lw: 4, shadow: 6, over: r.body, name: '한 줄 정리 칸' });
      tx(s, sp.key, { x: C.x0 + 36, y: ky + 4, w: C.w - 80, h: 90, size: 33, valign: 'middle', name: '한 줄 정리' });
    }
  },

  quiz(ctx, sp) {
    const r = role(sp.role || 'checkup'), items = sp.items || [], per = sp.perSlide || 3;
    for (let start = 0; start < items.length; start += per) {
      const part = items.slice(start, start + per);
      const notes = [sp.notes, `정답: ${part.map((q, k) => `${start + k + 1}번 ${q.a}${q.why ? `(${q.why})` : ''}`).join(' / ')}`].filter(Boolean).join('\n');
      const s = ctx.add({ ...sp, notes });
      head(s, FRAME.full, headOf(sp, r));
      title(s, sp.title || '형성평가 · O / X');
      tx(s, sp.guide || '문장마다 O 또는 X를 골라요.', { x: C.x0, y: 300, w: 900, h: 50, size: 30, color: MUTED, valign: 'middle', name: '안내' });
      part.forEach((q, k) => {
        const y = 378 + k * 196, h = 170, rx = C.x0 + C.w - 6, n = start + k + 1;
        box(s, { x: C.x0, y, w: C.w - 6, h, r: 24, fill: CREAM, lw: 4, shadow: 6, over: r.body, name: `문제 ${n} 칸` });
        coin(s, n, C.x0 + 36, y + (h - 76) / 2, 76, r.coin || r.head, CREAM);
        const qx = C.x0 + 142;
        tx(s, q.q, { x: qx, y: y + 10, w: rx - 40 - 216 - 22 - 36 - qx, h: h - 20, size: 34, lh: 1.05, valign: 'middle', name: `문제 ${n}` });
        (sp.choices || ['O', 'X']).forEach((t, j) => label(s, t, { x: rx - 40 - (2 - j) * 108 - (1 - j) * 22, y: y + (h - 84) / 2, w: 108, h: 84, r: 'pill', fill: PILL, lw: 3, size: 40, shadow: 4, over: CREAM, name: `문제 ${n} ${t}` }));
      });
    }
  },

  bullets(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    const w = sp.figure ? 900 : C.w;
    tx(s, (sp.items || []).join('\n'), { x: C.x0, y: 300, w, h: 620, size: 36, lh: 1.15, bullet: true, paraSpaceAfter: 14, name: '글 목록' });
    if (sp.figure) figureIn(s, ctx.fig(sp.figure), { x: 1060, y: 300, w: 722, h: 520, over: r.body, alt: sp.figureAlt });
  },

  image(ctx, sp) {
    const r = role(sp.role), s = ctx.add(sp);
    head(s, FRAME.full, headOf(sp, r));
    title(s, sp.title);
    const fig = ctx.fig(sp.figure), maxW = C.w, maxH = sp.caption ? 560 : 620;
    const k = Math.min((maxW - 48) / fig.w, (maxH - 52) / fig.h), fw = Math.round(fig.w * k) + 48, fh = Math.round(fig.h * k) + 52;
    figureIn(s, fig, { x: Math.round(960 - fw / 2), y: 300, w: fw, h: fh, over: r.body, alt: sp.figureAlt });
    if (sp.caption) tx(s, sp.caption, { x: C.x0, y: 300 + fh + 20, w: C.w, h: 50, size: 28, color: MUTED, align: 'center', valign: 'middle', name: '그림 설명' });
  },

  // ---------- 정답 맞히기 묶음 — 한 장을 적으면 「안내 1장 + 답 1개씩」으로 펼쳐진다(revealSlides) ----------
  // 빈칸 표(+ 표 아래 문장): 칸 글의 {정답} 을 차례로 채운다. bank = 이름표 보기(이름표 활동일 때)
  fill(ctx, sp) {
    const rows = sp.rows || [], after = sp.after || [];
    const answers = answersIn([...rows.flat(), ...after]).map((a, i) => ({ a, why: (sp.why || [])[i] || '' }));
    const many = rows.length > 4, size = sp.size || (many ? 26 : 28), asize = size + 8;   // 정답은 본문보다 8px 크게
    const rowHs = [...(sp.header ? [many ? 48 : 52] : []), ...rows.map(() => sp.rowH || (many ? 52 : 92))];
    const pct = sp.colW || (sp.header || rows[0]).map(() => 100 / (sp.header || rows[0]).length);
    revealSlides(ctx, sp, answers, (s, step, r) => {
      let k = 0; const next = () => ++k;
      const cell = { fontSize: PT(size), color: INK, valign: 'middle', margin: [1, 9, 1, 9] };   // 위아래 여백 1pt — 큰 정답 글자에도 줄이 늘어나지 않게(첫 값이 1 아래면 인치로 읽힌다)
      const hdr = (sp.header || []).map((t) => ({ text: t, options: { ...cell, fontFace: FONTS.t.face, align: 'center', fill: { color: r.th || r.head } } }));
      const body = rows.map((row) => row.map((t, j) => ({ text: blankRuns(t, { f: j === 0 ? 't' : 'b', next, step, asize }), options: { ...cell, fontFace: FONTS[j === 0 ? 't' : 'b'].face, align: j === 0 ? 'center' : 'left', fill: { color: CREAM } } })));
      s.addTable(hdr.length ? [hdr, ...body] : body, { x: I(C.x0), y: I(362), w: I(C.w), colW: pct.map((p) => I(C.w * p / 100)), rowH: rowHs.map(I), border: { type: 'solid', pt: 1.5, color: INK }, autoPage: false });
      if (after.length) {
        const ay = 362 + rowHs.reduce((a, b) => a + b, 0) + 14;
        const rs = after.flatMap((t, i) => { const part = blankRuns(t, { next, step, asize: 38 }); if (i < after.length - 1) part[part.length - 1].options.breakLine = true; return part; });
        runText(s, rs, { x: C.x0, y: ay, w: C.w, h: 840 - ay, size: 30, lh: 1.05, name: '정리 문장' });
      }
    });
  },

  // 빈칸 카드 3장: 카드 뜻(text)·빗대기(ex)의 {정답} 을 차례로 채운다
  fillcards(ctx, sp) {
    const cards = (sp.cards || []).slice(0, 3);
    const answers = answersIn(cards.flatMap((c) => [c.text, c.ex])).map((a, i) => ({ a, why: (sp.why || [])[i] || '' }));
    revealSlides(ctx, sp, answers, (s, step, r) => {
      let k = 0; const next = () => ++k;
      const n = cards.length || 1, cw = (C.w - (n - 1) * 36 - 8) / n, y = 362, h = 456;
      cards.forEach((c, i) => {
        const x = C.x0 + i * (cw + 36);
        box(s, { x, y, w: cw, h, r: 28, fill: CREAM, lw: 4, shadow: 8, over: r.body, name: `${c.term} 칸` });
        label(s, c.term, { x: x + 32, y: y + 28, w: chipW(c.term, 34) + 20, h: 62, r: 'pill', fill: r.head, lw: 3, size: 34, name: `${c.term} 이름` });
        runText(s, blankRuns(c.text, { next, step, asize: 38 }), { x: x + 26, y: y + 112, w: cw - 44, h: 196, size: 30, lh: 1.1, name: `${c.term} 뜻` });
        box(s, { x: x + 26, y: y + h - 132, w: cw - 52, h: 106, r: 18, fill: 'F1ECFB', name: `${c.term} 빗대기 칸` });
        tx(s, sp.exLabel || '빗대어 보면?', { x: x + 48, y: y + h - 124, w: cw - 96, h: 38, f: 't', size: 26, color: MUTED, valign: 'middle', name: `${c.term} 빗대기 제목` });
        runText(s, blankRuns(c.ex || '', { f: 't', next, step, asize: 40 }), { x: x + 48, y: y + h - 86, w: cw - 96, h: 58, f: 't', size: 32, valign: 'middle', name: `${c.term} 빗대기` });
      });
    });
  },

  // 순서 배열: 섞인 카드(왼쪽, 활동지에 보이는 순서)를 ①~④ 자리(오른쪽)에 하나씩. order = 정답 순서(카드 번호, 0부터)
  order(ctx, sp) {
    const cards = sp.cards || [], seq = sp.order || [];
    const answers = seq.map((ci, i) => ({ a: cards[ci], short: (sp.short || [])[i], why: (sp.why || [])[i] || '' }));
    revealSlides(ctx, sp, answers, (s, step, r) => {
      const n = cards.length, gap = 16, rowH = Math.min(100, Math.floor((800 - 362 - (n - 1) * gap) / n));
      const lw = 790, d = 56, rx = C.x0 + lw + 50, sx = rx + d + 18, sw = C.x0 + C.w - 6 - sx;
      cards.forEach((t, i) => {
        const y = 362 + i * (rowH + gap), at = seq.indexOf(i), done = at >= 0 && at < step;
        box(s, { x: C.x0, y, w: lw, h: rowH, r: 18, fill: CREAM, lw: 3, shadow: done ? 0 : 5, over: r.body, dash: done ? 'dash' : undefined, name: `카드 ${i + 1}` });
        tx(s, t, { x: C.x0 + 20, y: y + 6, w: lw - 36 - (done ? 64 : 0), h: rowH - 12, size: 28, lh: 1.05, color: done ? MUTED : INK, valign: 'middle', name: `카드 ${i + 1} 글` });
        if (done) coin(s, at + 1, C.x0 + lw - 24 - 48, y + (rowH - 48) / 2, 48, OK_CHIP, CREAM, 24);
      });
      seq.forEach((ci, i) => {
        const y = 362 + i * (rowH + gap);
        coin(s, i + 1, rx, y + (rowH - d) / 2, d, r.head, r.body);
        slot(s, { x: sx, y, w: sw, h: rowH, text: cards[ci], state: i < step ? (i === step - 1 ? 'now' : 'done') : 'empty', f: 'bb', size: 28, name: `${i + 1}번 자리` });
      });
    });
  },

  // 이름표 끌어 놓기: 문장 줄마다 오른쪽 칸을 하나씩 채운다. items: [{ t, a, why }]
  match(ctx, sp) {
    const items = sp.items || [];
    const answers = items.map((it) => ({ a: it.a, why: it.why || '' }));
    const n = items.length, few = n <= 3, mid = n <= 5;
    const gap = few ? 22 : mid ? 12 : 6, size = few ? 32 : mid ? 30 : 26, rowH = few ? 104 : mid ? 82 : 49;
    const d = Math.min(rowH - 14, 60), ss = few ? 36 : mid ? 32 : 28;   // 칸에 들어가는 정답 이름표는 문장보다 크게
    const sw = Math.max(...(sp.bank || answers.map((x) => x.a)).map((t) => chipW(t, ss))) + 24;
    const sx = C.x0 + C.w - 6 - sw, cw = sx - 20 - C.x0;
    revealSlides(ctx, sp, answers, (s, step, r) => {
      items.forEach((it, i) => {
        const y = 362 + i * (rowH + gap), tx0 = C.x0 + 14 + d + 18;
        box(s, { x: C.x0, y, w: cw, h: rowH, r: few ? 20 : 14, fill: CREAM, lw: 3, shadow: few ? 5 : 0, over: r.body, name: `문장 ${i + 1} 칸` });
        coin(s, i + 1, C.x0 + 14, y + (rowH - d) / 2, d, r.head, CREAM, Math.round(d * 0.46));
        tx(s, it.t, { x: tx0, y: y + 3, w: C.x0 + cw - 18 - tx0, h: rowH - 6, size, lh: 1.05, valign: 'middle', name: `문장 ${i + 1}` });
        slot(s, { x: sx, y: y + 3, w: sw, h: rowH - 6, text: it.a, state: i < step ? (i === step - 1 ? 'now' : 'done') : 'empty', size: ss, name: `${i + 1}번 칸` });
      });
    });
  },

  // 하나 고르기: 정답 장에서 맞는 보기를 초록 + 「정답」, 틀린 보기 옆엔 까닭(w — 활동지 문장)
  choice(ctx, sp) {
    const opts = sp.opts || [];
    revealSlides(ctx, sp, [{ a: sp.a, short: sp.short, why: sp.why || '' }], (s, step, r) => {
      box(s, { x: C.x0, y: 362, w: C.w - 6, h: 150, r: 24, fill: CREAM, lw: 4, shadow: 6, over: r.body, name: '문제 칸' });
      coin(s, 'Q', C.x0 + 30, 362 + 37, 76, r.head, CREAM, 34);
      tx(s, sp.q, { x: C.x0 + 132, y: 372, w: C.w - 6 - 132 - 36, h: 130, size: 34, lh: 1.08, valign: 'middle', name: '문제' });
      opts.forEach((o, i) => {
        const state = !step ? 'ask' : o === sp.a ? 'ok' : 'no', fs = state === 'ok' ? 38 : 32;   // 정답 보기는 크게
        const y = 540 + i * 98, w = chipW(o, fs) + 48;
        label(s, o, { x: C.x0, y, w, h: 80, r: 'pill', fill: state === 'ok' ? OK_CHIP : state === 'no' ? CREAM : PILL, lw: state === 'ok' ? 6 : 3, lc: state === 'ok' ? FOCUS : INK, size: fs, color: state === 'no' ? MUTED : INK, shadow: state === 'no' ? 0 : 4, over: r.body, name: `보기 ${i + 1}` });
        if (state === 'ok') label(s, '정답', { x: C.x0 + w + 24, y: y + 13, w: chipW('정답', 28) + 8, h: 54, r: 12, fill: CREAM, lw: 3, size: 28, color: OK_INK, name: '정답 표시' });
        if (state === 'no' && sp.w?.[o]) tx(s, sp.w[o], { x: C.x0 + w + 28, y, w: C.w - 6 - w - 28, h: 80, size: 26, color: MUTED, valign: 'middle', name: `보기 ${i + 1} 까닭` });
      });
    });
  },

  end(ctx, sp) {
    const { meta } = ctx, f = FRAME.cover, s = ctx.add(sp, { number: false });
    schoolRow(s, meta);
    tx(s, sp.pixel || 'SEE_YOU', { x: f.x + BORDER + 36, y: f.y + BORDER + HEAD_H / 2 - 22, w: 360, h: 44, f: 'p', size: 26, cs: 3, valign: 'middle', name: '픽셀 이름' });
    tx(s, sp.title || '오늘도 수고했어요!', { x: f.x + 60, y: 440, w: f.w - 120, h: 190, f: 'd', size: 140, align: 'center', valign: 'middle', name: '마무리 제목' });
    if (sp.sub) tx(s, sp.sub, { x: f.x + 60, y: 642, w: f.w - 120, h: 64, size: 42, color: SOFT, align: 'center', valign: 'middle', name: '마무리 안내' });
    if (sp.button) { const pw = chipW(sp.button, 34) + 60; label(s, sp.button, { x: 960 - pw / 2, y: 752, w: pw, h: 80, r: 'pill', fill: PILL, lw: 4, size: 34, shadow: 6, over: CREAM, name: '단추 그림' }); }
  },

  guide(ctx, sp) {
    const s = ctx.add({ ...sp, notes: sp.notes || '선생님용 안내 장 — 발표 전에 지우세요.' });
    head(s, FRAME.full, { name: 'HOW_TO_USE' });
    title(s, '이 템플릿 쓰는 법');
    tx(s, '선생님용 안내예요. 발표 전에 이 장은 지워 주세요.', { x: C.x0, y: 270, w: 1200, h: 46, size: 28, color: MUTED, valign: 'middle', name: '안내' });
    tx(s, '카드 머리 색 = 활동지 카드 머리 색', { x: C.x0, y: 336, w: 800, h: 52, f: 't', size: 32, valign: 'middle', name: '색 제목' });
    const sw = [['goals', '목표'], ['warmup', '도입 · 동기유발'], ['intro', '도입 · 학습주제'], ['act1', '전개 · 활동 1'], ['act2', '전개 · 활동 2'],
      ['act3', '전개 · 활동 3'], ['act4', '전개 · 활동 4'], ['summary', '정리 · 핵심 정리'], ['checkup', '정리 · 형성평가']];
    sw.forEach(([k, n], i) => {
      const y = 404 + i * 58, rr = role(k);
      box(s, { x: C.x0, y: y + 4, w: 44, h: 44, r: 10, fill: rr.head, lw: 3, name: `${n} 색` });
      tx(s, n, { x: C.x0 + 64, y, w: 330, h: 52, size: 28, valign: 'middle', name: `${n} 이름` });
      tx(s, rr.name, { x: C.x0 + 400, y, w: 300, h: 52, f: 'p', size: 22, cs: 2, color: MUTED, valign: 'middle', name: `${n} 라벨` });
    });
    const rx = 1000;
    tx(s, '글꼴 네 개', { x: rx, y: 336, w: 700, h: 52, f: 't', size: 32, valign: 'middle', name: '글꼴 제목' });
    [['d', '강원교육튼튼', '표지·간지의 큰 제목'], ['t', '쿠키런 Bold', '제목·이름표·단추'], ['b', '메이플스토리', '본문(Light) · 강조(Bold)'], ['p', 'Silkscreen', '영문 픽셀 라벨만']].forEach(([f, n, u], i) => {
      const y = 400 + i * 62;
      tx(s, n, { x: rx, y, w: 330, h: 58, f, size: f === 'p' ? 30 : 36, valign: 'middle', name: `글꼴 ${n}` });
      tx(s, u, { x: rx + 340, y, w: 440, h: 58, size: 28, color: MUTED, valign: 'middle', name: `글꼴 ${n} 쓰임` });
    });
    tx(s, '쓰는 법', { x: rx, y: 668, w: 700, h: 52, f: 't', size: 32, valign: 'middle', name: '쓰는 법 제목' });
    tx(s, '같은 색 장을 복제해서 글만 바꿔요.\n카드 틀과 모눈은 배경 그림이라 움직이지 않아요.\n새 활동은 이름표(ACTIVITY_n)만 바꿔 써요.',
      { x: rx, y: 728, w: 782, h: 200, size: 28, lh: 1.15, bullet: true, paraSpaceAfter: 6, name: '쓰는 법' });
  },
};

// ---------- 덱 만들기 ----------
// slides: ppt.json 의 slides(+ 안내 장), meta: 학교·단원·차시·태그·제목, bgs: 배경 이름 → 파일, figs: 그림 경로 → {file,w,h}
export async function buildDeck({ slides, meta, bgs, figs, docTitle }) {
  TITLE_PX = meta.titleSize || 60;
  const pptxgen = require('pptxgenjs');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = docTitle;
  pres.author = meta.school;
  pres.subject = '정보 수업 PPT — 시안 A 카드(docs/rules/ppt.md)';
  pres.theme = { headFontFace: FONTS.t.face, bodyFontFace: FONTS.b.face };
  const labels = [];
  let section = null;
  const ctx = {
    meta,
    fig: (src) => { const f = figs[src]; if (!f) throw new Error(`그림을 못 찾았어요: ${src}`); return f; },
    add(sp, { number = true, tag } = {}) {
      const r = sp.layout === 'cover' || sp.layout === 'goals' ? role('goals') : sp.layout === 'end' || sp.layout === 'guide' ? role('help') : role(sp.role || DEFAULT_ROLE[sp.layout] || 'act1');
      const sec = sp.section || sectionOf(r);
      if (sec !== section) { pres.addSection({ title: sec }); section = sec; }
      const s = pres.addSlide({ sectionTitle: sec });
      s.background = { path: bgs[backgroundOf(sp)] };
      if (number) s.slideNumber = { x: I(1690), y: I(1030), w: I(154), h: I(40), fontFace: FONTS.p.face, fontSize: PT(24), color: MUTED, align: 'right' };
      if (sp.notes) s.addNotes(String(sp.notes));
      labels.push(tag || (sp.layout === 'divider' ? `간지 · ${sp.chip ?? role(sp.role).chip ?? ''}`.trim() : LABEL[sp.layout] || sp.layout));
      return s;
    },
  };
  for (const sp of slides) {
    const fn = L[sp.layout];
    if (!fn) throw new Error(`layout 「${sp.layout}」 이 없어요 — ${Object.keys(L).join(' · ')}`);
    fn(ctx, sp);
  }
  // pptxgenjs 는 도형에 건 링크를 글에도 붙여 밑줄을 긋는다 → 글 쪽 링크·밑줄만 걷는다(도형 링크는 남김)
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(await pres.write({ outputType: 'nodebuffer' }));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string');
    const next = xml.replace(/<a:rPr\b[^>]*>(?:(?!<\/a:rPr>)[\s\S])*?<a:hlinkClick\b[\s\S]*?<\/a:hlinkClick>[\s\S]*?<\/a:rPr>/g,
      (m) => m.replace(/<a:hlinkClick\b[\s\S]*?<\/a:hlinkClick>/, '').replace(' u="sng"', ''));
    if (next !== xml) zip.file(name, next);
  }
  return { buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), labels };
}
