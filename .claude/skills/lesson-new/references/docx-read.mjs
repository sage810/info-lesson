// 채운 「활동지 양식」(.docx)을 마크다운 글로 뽑는다 — 이 PC 는 Read 도구·pandoc 으로 docx 를 못 열어서(Node 만, 설치 없음).
//   node .claude/skills/lesson-new/references/docx-read.mjs "<파일.docx>" > <scratchpad>/양식.md
// 제목 1~3 → #, 목록 → - / 1., 표 → | 칸 | (칸 안 여러 줄은 <br>), 문서 안 그림 → [문서 안 그림].
// Word · Google 문서(파일 → 다운로드 → .docx) 둘 다 된다. 글상자 안 글은 무시.
import fs from 'node:fs';
import zlib from 'node:zlib';

const buf = fs.readFileSync(process.argv[2]);

// ── zip 풀기(중앙 디렉터리 기준) ──
const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error('docx(zip) 파일이 아니에요');
const files = {};
for (let i = 0, p = buf.readUInt32LE(eocd + 16), n = buf.readUInt16LE(eocd + 10); i < n; i++) {
  const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
  files[buf.toString('utf8', p + 46, p + 46 + nlen)] = { method: buf.readUInt16LE(p + 10), size: buf.readUInt32LE(p + 20), at: buf.readUInt32LE(p + 42) };
  p += 46 + nlen + elen + clen;
}
const read = (name) => {
  const f = files[name]; if (!f) return '';
  const start = f.at + 30 + buf.readUInt16LE(f.at + 26) + buf.readUInt16LE(f.at + 28);
  const data = buf.subarray(start, start + f.size);
  return (f.method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8');
};

const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// ── 스타일 id → 이름(한글 Word 는 제목 스타일 id 가 "1" 처럼 나옴) ──
const styleName = {};
for (const m of read('word/styles.xml').matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
  const nm = m[2].match(/<w:name w:val="([^"]+)"/); styleName[m[1]] = (nm ? nm[1] : m[1]).toLowerCase();
}
// ── 목록 번호: numId → 수준별 형식(bullet / decimal …) ──
const numXml = read('word/numbering.xml');
const absFmt = {};
for (const m of numXml.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g)) {
  absFmt[m[1]] = {}; for (const l of m[2].matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>[\s\S]*?<w:numFmt w:val="([^"]+)"/g)) absFmt[m[1]][l[1]] = l[2];
}
const numFmt = {};
for (const m of numXml.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>[\s\S]*?<w:abstractNumId w:val="(\d+)"/g)) numFmt[m[1]] = absFmt[m[2]] || {};
const counters = {};

// ── 요소 경계 찾기(같은 태그 중첩 고려) ──
const blockEnd = (xml, from, tag) => {
  const re = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*?(/?)>`, 'g'); re.lastIndex = from; let depth = 0, m;
  while ((m = re.exec(xml))) {
    if (m[1]) { depth--; if (depth === 0) return re.lastIndex; } else if (!m[2]) depth++; else if (depth === 0) return re.lastIndex;
  }
  return xml.length;
};
const children = (xml, tags) => {   // xml 바로 아래(한 겹)의 tags 요소들
  const out = []; const re = new RegExp(`<(${tags.join('|')})(?=[\\s>/])`, 'g'); let m;
  while ((m = re.exec(xml))) { const end = blockEnd(xml, m.index, m[1]); out.push({ tag: m[1], xml: xml.slice(m.index, end) }); re.lastIndex = end; }
  return out;
};

const paraText = (px) => {
  const body = px.replace(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g, '').replace(/<w:delText[^>]*>[\s\S]*?<\/w:delText>/g, '');
  let s = '';
  for (const m of body.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:drawing>|<w:pict>/g)) {
    if (m[1] !== undefined) s += ent(m[1]);
    else if (m[0] === '<w:tab/>') s += '\t';
    else if (m[0].startsWith('<w:br')) s += ' ';
    else s += '[문서 안 그림]';
  }
  return s;
};
const paraLine = (px) => {
  const text = paraText(px).trimEnd();
  const sid = (px.match(/<w:pStyle w:val="([^"]+)"/) || [])[1];
  const name = sid ? styleName[sid] || sid.toLowerCase() : '';
  const h = name.match(/^heading (\d)$/) || (name === 'title' ? [0, '1'] : null);
  if (h && text) return '#'.repeat(Number(h[1])) + ' ' + text;
  const numId = (px.match(/<w:numId w:val="(\d+)"/) || [])[1];
  if (numId && numId !== '0') {
    const lvl = (px.match(/<w:ilvl w:val="(\d+)"/) || [0, '0'])[1];
    const fmt = (numFmt[numId] || {})[lvl] || 'bullet';
    const key = numId + ':' + lvl; counters[key] = (counters[key] || 0) + 1;
    return '  '.repeat(Number(lvl)) + (fmt === 'bullet' ? '- ' : counters[key] + '. ') + text;
  }
  return text;
};
const cellText = (cx) => children(cx, ['w:p', 'w:tbl']).map((c) => (c.tag === 'w:p' ? paraText(c.xml).trim() : '[표 안 표]')).filter(Boolean).join('<br>').replace(/\|/g, '\\|');
const tableLines = (tx) => {
  const rows = children(tx, ['w:tr']).map((r) => children(r.xml, ['w:tc']).map((c) => cellText(c.xml)));
  if (!rows.length) return [];
  const w = Math.max(...rows.map((r) => r.length));
  const line = (r) => '| ' + Array.from({ length: w }, (_, i) => r[i] ?? '').join(' | ') + ' |';
  return ['', line(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(line), ''];
};

const doc = read('word/document.xml');
const body = doc.slice(doc.indexOf('<w:body>') + 8, doc.lastIndexOf('</w:body>'));
const lines = [];
for (const c of children(body, ['w:p', 'w:tbl'])) {
  if (c.tag === 'w:tbl') lines.push(...tableLines(c.xml));
  else { const l = paraLine(c.xml); if (/^#/.test(l) && lines.length && lines[lines.length - 1] !== '') lines.push(''); lines.push(l); }
}
process.stdout.write(lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n');
