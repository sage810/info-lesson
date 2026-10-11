#!/usr/bin/env node
// USB 로 받은 수행평가 PDF 에서 숨은 답 기록(msi-answers)을 꺼낸다 — 자동 제출이 안 된 학생용(spec.md "채점 설계"의 B).
// 시험지가 PDF 를 저장할 때 문서 정보(Keywords)에 학생 정보·칸별 답·저장 시각을 넣어 둔다(화면에는 안 보임).
//
//   npm run exam-pdf -- <폴더>          폴더(하위 폴더 포함)의 PDF 마다 이름·반·번호·저장 시각·답한 칸 수를 보여 준다(보내지 않음)
//   npm run exam-pdf -- <폴더> --send   학생이 보낸 것처럼 Apps Script 로 보낸다(시트 "출처" = PDF) → 채점 도우미에서 똑같이 채점
//
// 같은 학생이 웹으로도 냈으면 "저장 시각"이 늦은 것 하나로 채점된다(같은 PDF 를 두 번 보내도 결과는 같다).
import fs from 'node:fs';
import path from 'node:path';
import { listLessons, loadConfig } from './lib/common.mjs';

const args = process.argv.slice(2);
const send = args.includes('--send');
const dir = args.find((a) => !a.startsWith('--'));
if (!dir || !fs.existsSync(dir)) { console.error('✖ PDF 가 든 폴더를 적어 주세요. 예: npm run exam-pdf -- "E:\\수행평가 3반"'); process.exit(1); }

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (/\.pdf$/i.test(e.name)) files.push(p);
  }
})(dir);
if (!files.length) { console.error('✖ 그 폴더에 PDF 가 없어요.'); process.exit(1); }

const PREFIX = 'msi-answers:v1:';
function readRecord(file) {
  const all = [...fs.readFileSync(file).toString('latin1').matchAll(/\/Keywords\s*\((msi-answers:v1:[A-Za-z0-9+/=]+)\)/g)];
  if (!all.length) return null;
  return JSON.parse(Buffer.from(all[all.length - 1][1].slice(PREFIX.length), 'base64').toString('utf8'));
}

const found = [];
for (const f of files) {
  let rec = null, err = '';
  try { rec = readRecord(f); } catch (e) { err = e.message; }
  const name = path.relative(dir, f);
  if (!rec) { console.log(`  – ${name}: 숨은 답 없음${err ? ' (' + err + ')' : ' (다른 파일이거나 자동 제출 전 시험지)'}`); continue; }
  const s = rec.student || {}, a = rec.answers || {};
  const done = Object.values(a).filter((v) => String(v).trim()).length;
  console.log(`  ✔ ${name}: ${s.cls || '?'}반 ${s.no || '?'}번 ${s.name || '(이름 없음)'} · 저장 ${rec.savedAt || '?'} · 답한 칸 ${done}/${Object.keys(a).length}`);
  found.push({ file: f, rec });
}
console.log(`PDF ${files.length}개 중 숨은 답이 있는 것 ${found.length}개`);
if (!send || !found.length) { if (!send) console.log('(보내지 않았어요. 시트로 보내려면 끝에 --send)'); process.exit(0); }

const cfg = loadConfig();
if (!cfg.apiUrl) { console.error('✖ site.config.json 의 apiUrl 이 비어 있어요.'); process.exit(1); }
const titles = Object.fromEntries(listLessons().map((l) => [l.id, l.meta.title || '']));
let ok = 0;
for (const { file, rec } of found) {
  const body = JSON.stringify({
    action: 'submit', token: cfg.submitToken || '', source: 'pdf',
    lesson: rec.lesson, title: titles[rec.lesson] || '', filename: path.basename(file),
    pdf: fs.readFileSync(file).toString('base64'),
    answers: rec.answers || {}, student: rec.student || {}, savedAt: rec.savedAt || '',
  });
  let msg = '';
  for (let t = 0; t < 3; t++) {
    try {
      const res = await fetch(cfg.apiUrl, { method: 'POST', body });
      const j = await res.json();
      if (j && j.ok) { msg = ''; break; }
      msg = (j && j.error) || String(res.status);
    } catch (e) { msg = e.message; }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (msg) console.log(`  ✖ ${path.basename(file)}: ${msg}`); else { ok++; console.log(`  ✔ 보냄 ${path.basename(file)}`); }
}
console.log(`${found.length}개 중 ${ok}개 보냈어요.${ok < found.length ? ' 실패한 것은 다시 실행하면 돼요(같은 것을 또 보내도 채점은 한 번).' : ''}`);
