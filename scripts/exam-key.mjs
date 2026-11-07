#!/usr/bin/env node
// 수행평가 채점용 정답 표 → 구글 시트 "정답 <차시>" 탭 (apps-script/Code.gs 의 setKey).
// 정답은 answers.json(이 PC 에만, git 에 안 올림)에만 있고 공개 코드(Code.gs)에는 넣지 않으므로 이 명령으로만 시트에 보낸다.
//
//   npm run exam-key -- 09            정답 표를 화면에 보여 준다(보내지 않음)
//   npm run exam-key -- 09 --send     Apps Script 로 보낸다
//
// 선생님 열쇠(TEACHER_KEY 와 같은 값): apps-script/teacher.local.json {"teacherKey":"…"}(lesson.json 의 "teacherKeyFile" 이 있으면 그 파일) 또는 환경변수 MSI_TEACHER_KEY
// 정답 표는 시험지에 answers.json 의 답을 실제로 채운 뒤, 학생 제출과 똑같은 방법(window.MSI_SUBMIT)으로 읽어 만든다 → 모양이 어긋나지 않는다.
// answers.json 에서 쓰는 것: fill · click(정답지와 같음) · _채점_허용답 {"<칸 aria-label>": [...]} · _채점_배점 {"기본": 1, "<칸>": 점수}
//   · _채점_기준 {"<논술 칸>": "채점 기준 글"} — 논술(essay)·그래프는 선생님이 직접 채점, 시트의 "정답" 칸에 이 기준이 들어간다(채점 도우미에 보임)
//   · _채점_추가칸 [{"unit":"5","kind":"check","label":"…"}] — 시험지에 답 칸이 없는 칸. 선생님이 직접 확인, 배점은 _채점_배점(check 를 아는 Apps Script 에서만: apps-script-ai-entry)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, DIST_DIR, pickLessons, launchBrowser, readText, writeText, loadConfig } from './lib/common.mjs';
import { renderLesson } from './lib/render.mjs';

const args = process.argv.slice(2);
const send = args.includes('--send');
const lesson = pickLessons(args.filter((a) => !a.startsWith('--')))[0];
if (!lesson) { console.error('✖ 차시를 적어 주세요. 예: npm run exam-key -- 09'); process.exit(1); }
const ansPath = path.join(lesson.dir, 'answers.json');
if (!fs.existsSync(ansPath)) { console.error(`✖ ${lesson.id}: answers.json 이 없어요.`); process.exit(1); }
const ans = JSON.parse(readText(ansPath));
const accept = ans._채점_허용답 || {};
const points = ans._채점_배점 || { 기본: 1 };
const rubric = ans._채점_기준 || {};
const MANUAL = ['graph', 'essay', 'check'];

// 제출 훅 없이(=아무 데도 보내지 않게) 학생용 화면을 만들어 정답을 채운다 — 정답지(teacher.mjs)와 같은 방식
const { html } = renderLesson(lesson, { variant: 'embed', hook: false });
const tmp = path.join(DIST_DIR, 'answers', `.${lesson.unit}-${lesson.no}.key.html`);
writeText(tmp, html);
const browser = await launchBrowser();
let rows;
try {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(800);
  if (!(await page.evaluate(() => !!(window.MSI_SUBMIT && window.MSI_SUBMIT.describe)))) {
    throw new Error('이 차시에는 채점용 답 기록(window.MSI_SUBMIT)이 없어요. 수행평가 시험지(09 처럼)만 쓸 수 있어요.');
  }
  for (const [label, value] of Object.entries(ans.fill || {})) await page.locator(`textarea[aria-label="${label}"]`).first().fill(String(value));
  for (const c of ans.click || []) {
    if (typeof c !== 'string') throw new Error('click 에는 선택자(문자열)만 쓸 수 있어요: ' + JSON.stringify(c));
    await page.locator(c).first().click({ timeout: 3000 });
  }
  const got = await page.evaluate(() => window.MSI_SUBMIT.collect().then((d) => ({ units: window.MSI_SUBMIT.describe(), answers: d.record.answers })));
  rows = got.units.map((u) => ({
    unit: u.unit, kind: u.kind, label: u.label,
    answer: MANUAL.includes(u.kind) ? String(rubric[u.unit] || '') : got.answers[u.unit] || '',
    accept: accept[u.label] || [],
    points: points[u.unit] != null ? points[u.unit] : points.기본 != null ? points.기본 : 1,
  }));
  for (const x of ans._채점_추가칸 || []) {
    rows.push({ unit: String(x.unit), kind: x.kind, label: x.label || '', answer: String(rubric[x.unit] || ''), accept: [], points: points[x.unit] != null ? points[x.unit] : points.기본 != null ? points.기본 : 1 });
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { force: true });
}

const kindName = { one: '하나 고르기', set: '여러 개', order: '순서', text: '글자', graph: '그래프(직접)', essay: '논술(직접)', check: '확인(직접)' };
console.log(`정답 표 — ${lesson.id} (칸 ${rows.length}개)`);
for (const r of rows) {
  console.log(`  ${r.unit.padEnd(7)} ${kindName[r.kind].padEnd(8)} ${String(r.points).padStart(2)}점  ${(r.kind === 'graph' || r.kind === 'check') && !r.answer ? '—' : MANUAL.includes(r.kind) ? (r.answer ? '(채점 기준 ' + r.answer.length + '자)' : '(채점 기준 없음)') : r.answer}${r.accept.length ? '  (허용: ' + r.accept.join(' · ') + ')' : ''}`);
}
const total = rows.reduce((t, r) => t + Number(r.points), 0);
const auto = rows.filter((r) => !MANUAL.includes(r.kind)).reduce((t, r) => t + Number(r.points), 0);
console.log(`  합계 ${total}점 (자동 ${auto} + 직접 ${total - auto})`);
const empty = rows.filter((r) => !MANUAL.includes(r.kind) && !r.answer);
if (empty.length) { console.error(`✖ 정답이 비어 있는 칸: ${empty.map((r) => r.unit).join(', ')} — answers.json 의 fill/click 을 확인하세요.`); process.exit(1); }

if (!send) { console.log('\n(보내지 않았어요. 시트로 보내려면 끝에 --send)'); process.exit(0); }
// 차시 lesson.json 의 "apiUrl"·"teacherKeyFile" 이 있으면 그 Apps Script 로(인공지능 수행평가 전용, 2026-11-04)
let key = process.env.MSI_TEACHER_KEY || '';
const keyFile = path.join(ROOT, lesson.meta.teacherKeyFile || path.join('apps-script', 'teacher.local.json'));
if (!key && fs.existsSync(keyFile)) key = JSON.parse(readText(keyFile)).teacherKey || '';
if (!key) { console.error(`✖ 선생님 열쇠가 없어요. ${path.relative(ROOT, keyFile)} 에 {"teacherKey":"…"} 를 만들어 주세요(TEACHER_KEY 와 같은 값).`); process.exit(1); }
const cfg = loadConfig();
const ownUrl = Object.prototype.hasOwnProperty.call(lesson.meta, 'apiUrl');
const apiUrl = ownUrl ? lesson.meta.apiUrl : cfg.apiUrl;
if (!apiUrl) { console.error(`✖ 보낼 주소가 비어 있어요(${ownUrl ? lesson.id + ' 의 lesson.json "apiUrl"' : 'site.config.json 의 apiUrl'}).`); process.exit(1); }
const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ action: 'setKey', key, lesson: lesson.id, rows }) });
const j = await res.json().catch(() => null);
if (!j || !j.ok) { console.error('✖ 보내지 못했어요:', (j && j.error) || res.status); process.exit(1); }
console.log(`✔ 시트 "${j.tab || '정답 ' + j.lesson}" 탭에 ${j.rows}칸 · ${j.points}점을 썼어요.`);
