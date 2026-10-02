#!/usr/bin/env node
// 빌드 결과(dist/pages)를 내 컴퓨터에서 GitHub Pages 처럼 열어 보기.
//   npm run build && npm run serve   → 브라우저에서 표시되는 주소를 연다 (끄려면 Ctrl + C)
// 수정 요청 메모(?memo=1)의 "보내기"도 여기서 받아 .claude/feedback.md 에 쌓는다(피드백 모드). GitHub Pages 에는 이 주소가 없다.
//   GET    /__feedback?lesson=data-analysis/03 → { ok, file, open, entries }  (그 차시의 처리 전 항목, 오래된 것부터)
//   POST   /__feedback  { lesson, title, note, text, where, field, viewport } → 항목 추가
//   DELETE /__feedback  { key }  → 처리 전 항목 지우기 (key = 제목줄 "시각 · 차시 「제목」")
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, DIST_DIR, serveStatic } from './lib/common.mjs';

const dir = path.join(DIST_DIR, 'pages');
if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error('✖ dist/pages 가 없어요. 먼저 `npm run build` 를 실행하세요.');
  process.exit(1);
}

const FILE = path.join(ROOT, '.claude', 'feedback.md');
const HEADER = `# 화면 피드백

활동지 미리보기(\`npm run memo\`, ?memo=1)의 "📤 보내기"로 쌓인 수정 요청. 처리하면 \`[ ]\` 를 \`[x]\` 로 바꾸고 한 줄로 무엇을 했는지 적는다.
(Claude: 세션 시작 때 이 파일에 \`[ ]\` 가 있으면 먼저 읽고 lesson-edit 규칙대로 처리할 것. 이 파일은 git 에 올리지 않는다.)

`;
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const read = () => (fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '');

function format(f) {
  const when = new Date().toLocaleString('ko-KR', { hour12: false });
  const lines = [`## ${when} · ${oneLine(f.lesson) || '?'}${f.title ? ` 「${oneLine(f.title)}」` : ''}`, '- 종류: 메모'];
  if (f.where || f.field) lines.push(`- 위치: ${oneLine(f.where) || '?'}${f.field ? ` (칸: ${oneLine(f.field)})` : ''}`);
  if (f.text) lines.push(`- 선택한 글: "${oneLine(f.text)}"`);
  lines.push(`- 메모: ${oneLine(f.note)}`, `- 화면: 정보 수업 활동지 · ${oneLine(f.viewport)}`, '- 상태: [ ] 처리 전', '');
  return lines.join('\n') + '\n';
}

function entries(text, lesson) {
  const get = (lines, label) => lines.find((l) => l.startsWith(`- ${label}: `))?.slice(label.length + 4) ?? '';
  return text.split(/\n(?=## )/).filter((x) => x.startsWith('## ')).map((sec) => {
    const lines = sec.split('\n');
    const key = lines[0].slice(3);
    return { key, lesson: key.split(' · ')[1]?.split(' ')[0] ?? '', open: get(lines, '상태').startsWith('[ ]'),
      note: get(lines, '메모'), text: get(lines, '선택한 글').replace(/^"|"$/g, '') };
  }).filter((e) => e.open && (!lesson || e.lesson === lesson));
}

function feedback(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/__feedback') return false;
  const json = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  if (req.method === 'GET') {
    const text = read();
    json(200, { ok: true, file: '.claude/feedback.md', open: (text.match(/^- 상태: \[ \]/gm) ?? []).length, entries: entries(text, url.searchParams.get('lesson')) });
    return true;
  }
  if (req.method !== 'POST' && req.method !== 'DELETE') { json(405, { ok: false }); return true; }
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 100000) req.destroy(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (req.method === 'POST') {
        if (!oneLine(data.note)) return json(400, { ok: false, error: '요청을 적어 주세요.' });
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, HEADER, 'utf8');
        fs.appendFileSync(FILE, format(data), 'utf8');
        return json(200, { ok: true });
      }
      const parts = read().split(/\n(?=## )/);
      const i = parts.findIndex((x) => x.startsWith('## ') && x.split('\n')[0].slice(3) === data.key);
      if (i < 0) return json(404, { ok: false, error: '항목을 찾을 수 없어요(이미 지워졌거나 파일이 바뀜).' });
      if (!/^- 상태: \[ \]/m.test(parts[i])) return json(409, { ok: false, error: '이미 처리된 항목은 지울 수 없어요.' });
      parts.splice(i, 1);
      fs.writeFileSync(FILE, parts.join('\n'), 'utf8');
      json(200, { ok: true });
    } catch (e) {
      json(400, { ok: false, error: String(e.message ?? e) });
    }
  });
  return true;
}

const s = await serveStatic(dir, 8080, feedback).catch(() => serveStatic(dir, 0, feedback)); // 8080 이 쓰는 중이면 빈 포트로
console.log(`▶ ${s.url}/  (끄려면 Ctrl + C)`);
