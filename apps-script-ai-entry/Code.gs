/**
 * 인공지능 수행평가(엔트리, ai/exam-entry) 전용 — 제출 받기 · 채점 도우미 (Google Apps Script 웹앱, 2026-11-07)
 *
 * apps-script/(09·10)·apps-script-ai-exam/(인공지능 A·B형)과 **따로 쓰는 새 프로젝트·새 시트**다.
 * 시트에는 **수식을 쓰지 않는다** — 점수·총점·보정 총점을 이 코드가 숫자로 써 넣고, PDF·캡처는 링크 글자로 넣는다.
 *
 * 시트 「인공지능 엔트리 수행평가 채점」 — 탭 4개
 *   제출 : 학생이 낸 기록 원본(한 번 낼 때마다 한 줄)
 *   채점 : 학생 한 줄(같은 학생은 한 줄) · 학년 반 번호 이름 · 총점 · 보정 총점 · 칸별 점수 · 저장 시각 · 출처 · PDF · 캡처 · 확인
 *   결과 : 학년 반 번호 이름 · 총점 · 보정 총점(학년→반→번호 순, 점수가 바뀔 때마다 코드가 다시 씀 — 손으로 고치지 않음)
 *   설정 : 보정 값(n·x·y — 채점 도우미에서 바꿈) · 칸·배점·정답·채점 기준(이 PC 의 npm run exam-key 가 보냄)
 *
 * 채점: 고르기 칸(kind one)은 제출할 때 자동으로, 글자 칸(kind essay)·결과 화면 캡처(kind graph)는 채점 도우미에서 직접. 배점 0 칸은 채점 열 없음.
 * 엔트리 과제 제출 점수는 이 시트에 없다 — 선생님이 엔트리 학급에서 확인해 따로 기록한다.
 *
 *   GET  ?action=ping 또는 주소만        → 살아 있는지 확인
 *   GET  ?action=teacher&key=…           → 채점 도우미(반 고르기 → 학생 글·캡처 보며 점수 누르기 · 보정 값 적용)
 *   POST {"action":"submit", …}          → 시험지의 "PDF로 저장하기"(자동 제출) · npm run exam-pdf --send
 *   POST {"action":"setKey", key, lesson, rows} → 설정 탭에 칸·배점·정답·채점 기준 쓰기(npm run exam-key --send). 정답은 이 코드에 없다
 *
 * 스크립트 속성: TEACHER_KEY(필수 — 채점 도우미·exam-key) · SUBMIT_TOKEN(선택) · FOLDER_ID·SHEET_ID(setup 이 자동으로 넣음)
 * 처음 한 번: 함수 목록에서 setup ▶ 실행 → 권한 허용 → 로그에 폴더·시트 주소. 배포는 README.md.
 */

const LESSON = 'ai/exam-entry';
const ROOT_FOLDER_NAME = '인공지능 엔트리 수행평가 제출';
const BOOK_NAME = '인공지능 엔트리 수행평가 채점';
const TAB_SUB = '제출', TAB_GRADE = '채점', TAB_RES = '결과', TAB_SET = '설정';
const SUB_HEAD = ['제출 시각', '학년', '반', '번호', '이름', '저장 시각', '출처', 'PDF', '캡처 파일', '파일 이름', '답(JSON)'];
const SUB = { grade: 1, cls: 2, no: 3, name: 4, savedAt: 5, capture: 8, answers: 10 };   // 제출 탭 열 위치(0부터)
const FIX = ['학년', '반', '번호', '이름', '총점', '보정 총점'];          // 채점 탭 앞 6열
const TAIL = ['저장 시각', '출처', 'PDF', '캡처', '확인', '학생 키'];     // 채점 탭 뒤 6열(학생 키는 숨김)
const AUTO_KINDS = ['one'];                                               // 제출할 때 자동 채점하는 칸 종류
// 칸 이름은 시트가 숫자·날짜로 바꿔 버릴 수 있다 → 머리글·칸 열은 글자 서식(@)으로 쓴다
const SET_KEY_ROW = 7;                                                    // 설정 탭: 6행 머리글, 7행부터 칸·배점·정답·기준
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;                                // 캡처 작은 사본 한 장 한도

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'teacher') return teacherPage_(p.key);
  return json_({ ok: true, service: 'ai-entry-exam', time: new Date().toISOString() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'JSON 형식이 아니에요' }); }
  try {
    if (body.action === 'submit') return submit_(body);
    if (body.action === 'setKey') return setKey_(body);
  } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
  return json_({ ok: false, error: '알 수 없는 요청이에요' });
}

// ---------------------------------------------------------------- 제출
function submit_(b) {
  const token = prop_('SUBMIT_TOKEN');
  if (token && b.token !== token) return json_({ ok: false, error: '제출 토큰이 맞지 않아요' });
  if (String(b.lesson || '') !== LESSON) return json_({ ok: false, error: '이 시험지는 여기로 받지 않아요: ' + clean_(b.lesson || '', 40) });
  if (!b.pdf) return json_({ ok: false, error: 'PDF 가 비어 있어요' });
  const bytes = Utilities.base64Decode(b.pdf);
  if (bytes.length > MAX_PDF_BYTES) return json_({ ok: false, error: '파일이 너무 커요' });

  const filename = clean_(b.filename || '수행평가.pdf', 120);
  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd-HHmmss');
  const root = rootFolder_();
  const file = subFolder_(root, 'PDF').createFile(Utilities.newBlob(bytes, 'application/pdf', stamp + ' ' + filename));
  const captureId = saveCapture_(root, b.graphs, stamp, filename);
  const st = b.student || {};
  const s = { grade: num_(st.grade), cls: num_(st.cls), no: num_(st.no), name: clean_(st.name || '', 40),
    savedAt: b.savedAt ? String(b.savedAt).slice(0, 40) : new Date().toISOString(), source: b.source === 'pdf' ? 'PDF' : '웹',
    pdf: file.getUrl(), captureId: captureId };
  const answers = b.answers || {};

  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = book_();
    const sh = ss.getSheetByName(TAB_SUB);
    sh.appendRow([new Date(), s.grade, s.cls, s.no, s.name, s.savedAt, s.source, 'PDF', captureId, filename, JSON.stringify(answers).slice(0, 45000)]);
    sh.getRange(sh.getLastRow(), SUB_HEAD.indexOf('PDF') + 1).setRichTextValue(link_('PDF', s.pdf));
    upsertGrade_(ss, s, answers);
  } finally { lock.releaseLock(); }
  return json_({ ok: true, file: file.getName() });
}

/** 결과 화면 캡처 작은 사본 저장 → 파일 id. PDF 로 들어온 학생(exam-pdf)은 사본이 없다 → '' */
function saveCapture_(root, graphs, stamp, filename) {
  const units = Object.keys(graphs || {});
  if (!units.length) return '';
  const m = String(graphs[units[0]] || '').match(/^data:image\/(jpeg|png);base64,(.+)$/);
  if (!m) return '';
  const bytes = Utilities.base64Decode(m[2]);
  if (bytes.length > MAX_CAPTURE_BYTES) return '';
  const name = stamp + ' ' + filename.replace(/\.pdf$/i, '') + (m[1] === 'png' ? '.png' : '.jpg');
  return subFolder_(root, '캡처').createFile(Utilities.newBlob(bytes, 'image/' + m[1], name)).getId();
}

// ---------------------------------------------------------------- 설정 탭(보정 값 · 칸·배점·정답·기준)
function readAdjust_(ss) {
  const v = ss.getSheetByName(TAB_SET).getRange(2, 2, 3, 1).getValues().map((r) => r[0]);
  const n = Number(v[0]) || 0, x = v[1] === '' ? '' : Number(v[1]), y = v[2] === '' ? '' : Number(v[2]);
  return { n: n, x: isNaN(x) ? '' : x, y: isNaN(y) ? '' : y };
}
function readUnits_(ss) {
  const sh = ss.getSheetByName(TAB_SET), last = sh.getLastRow();
  if (last < SET_KEY_ROW) return [];
  return sh.getRange(SET_KEY_ROW, 1, last - SET_KEY_ROW + 1, 5).getDisplayValues()
    .filter((r) => r[0])
    .map((r) => ({ unit: r[0], kind: r[1], points: Number(r[2]) || 0, label: r[3], rubric: r[4], auto: AUTO_KINDS.indexOf(r[1]) >= 0 }));
}
/** 점수가 있는 칸만(배점 0 인 칸은 채점 열이 없다) */
function scoredUnits_(ss) { return readUnits_(ss).filter((u) => u.points > 0); }

function setKey_(b) {
  if (!teacherOk_(b.key)) return json_({ ok: false, error: '선생님 열쇠(TEACHER_KEY)가 맞지 않아요' });
  if (String(b.lesson || '') !== LESSON) return json_({ ok: false, error: '이 시험지는 여기로 받지 않아요: ' + clean_(b.lesson || '', 40) });
  const rows = (b.rows || []).map((r) => [String(r.unit), String(r.kind), Number(r.points) || 0, String(r.label || ''), String(r.answer == null ? '' : r.answer)]);
  if (!rows.length) return json_({ ok: false, error: '칸이 비어 있어요' });
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = book_(), sh = ss.getSheetByName(TAB_SET), last = sh.getLastRow();
    if (last >= SET_KEY_ROW) sh.getRange(SET_KEY_ROW, 1, last - SET_KEY_ROW + 1, 5).clearContent();
    sh.getRange(SET_KEY_ROW, 1, rows.length, 1).setNumberFormat('@');
    sh.getRange(SET_KEY_ROW, 5, rows.length, 1).setNumberFormat('@');
    sh.getRange(SET_KEY_ROW, 1, rows.length, 5).setValues(rows);
    sh.getRange(SET_KEY_ROW, 5, rows.length, 1).setWrap(true);
    regradeAuto_(ss);   // 제출이 먼저 들어왔거나 정답을 고쳐 다시 보낸 경우에도 자동 채점을 맞춘다
    rebuildResult_(ss);
  } finally { lock.releaseLock(); }
  return json_({ ok: true, lesson: LESSON, tab: TAB_SET, rows: rows.length, points: rows.reduce((t, r) => t + r[2], 0) });
}

// ---------------------------------------------------------------- 채점 탭(학생 한 줄, 숫자만)
function headOf_(sh) { return sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String); }

/** 채점 탭을 찾고, 머리글이 설정의 칸과 맞게(없는 칸은 "저장 시각" 앞에 열을 끼워 넣음) */
function gradeTab_(ss) {
  const sh = ss.getSheetByName(TAB_GRADE) || insertBefore_(ss, TAB_GRADE, [TAB_RES, TAB_SET]);
  const units = scoredUnits_(ss).map((u) => u.unit);
  if (sh.getLastRow() === 0 || !sh.getRange(1, 1).getValue()) {
    const head = FIX.concat(units).concat(TAIL);
    sh.getRange(1, 1, 1, head.length).setNumberFormat('@').setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1); sh.setFrozenColumns(FIX.length);
    sh.hideColumns(head.length);
    return sh;
  }
  const head = headOf_(sh), add = units.filter((u) => head.indexOf(u) < 0);
  if (add.length) {
    const at = head.indexOf(TAIL[0]) + 1;
    sh.insertColumnsBefore(at, add.length);
    sh.getRange(1, at, 1, add.length).setNumberFormat('@').setValues([add]).setFontWeight('bold');
  }
  return sh;
}

function rowOfKey_(sh, head, key) {
  const c = head.indexOf('학생 키') + 1, last = sh.getLastRow();
  if (last < 2 || c < 1) return -1;
  const keys = sh.getRange(2, c, last - 1, 1).getValues().map((r) => String(r[0]));
  const i = keys.indexOf(String(key));
  return i < 0 ? -1 : i + 2;
}

/** 고르기 칸 자동 점수 — 정답(설정 탭 기준 칸)과 같으면 배점, 아니면 0(빈 답 포함). 정답이 아직 없으면 '' */
function autoScore_(u, given) {
  const key = String(u.rubric == null ? '' : u.rubric).trim();
  if (!key) return '';
  return String(given == null ? '' : given).trim() === key ? u.points : 0;
}

function writeAuto_(sh, head, r, units, answers) {
  units.filter((u) => u.auto).forEach((u) => {
    const c = head.indexOf(u.unit) + 1;
    if (c > 0) sh.getRange(r, c).setValue(autoScore_(u, answers[u.unit]));
  });
}

function upsertGrade_(ss, s, answers) {
  const sh = gradeTab_(ss), head = headOf_(sh), key = studentKey_(s), col = (n) => head.indexOf(n) + 1;
  const units = scoredUnits_(ss);
  let r = rowOfKey_(sh, head, key);
  const flags = [];
  if (!digits_(s.cls) || !digits_(s.no)) flags.push('반·번호 없음');
  if (r < 0) {
    const row = head.map(() => '');
    row[col('학년') - 1] = s.grade; row[col('반') - 1] = s.cls; row[col('번호') - 1] = s.no; row[col('이름') - 1] = s.name;
    row[col('저장 시각') - 1] = s.savedAt; row[col('출처') - 1] = s.source; row[col('PDF') - 1] = 'PDF';
    row[col('확인') - 1] = flags.join(', '); row[col('학생 키') - 1] = key;
    sh.appendRow(row);
    r = sh.getLastRow();
  } else {
    const old = String(sh.getRange(r, col('저장 시각')).getValue());
    if ((Date.parse(s.savedAt) || 0) < (Date.parse(old) || 0)) return;   // 더 예전 기록이면 그대로(같은 PDF 를 또 보낸 경우 등)
    // 직접 채점한 점수가 있을 때만 확인 표시(자동 점수는 항상 차 있고 저절로 다시 매겨진다)
    const scored = units.filter((u) => !u.auto).some((u) => col(u.unit) > 0 && sh.getRange(r, col(u.unit)).getValue() !== '');
    if (scored && s.savedAt !== old) flags.push('다시 냄 — 점수 확인');
    sh.getRange(r, col('저장 시각'), 1, 2).setValues([[s.savedAt, s.source]]);
    sh.getRange(r, col('확인')).setValue(flags.join(', '));
  }
  sh.getRange(r, col('PDF')).setRichTextValue(link_('PDF', s.pdf));
  if (s.captureId) sh.getRange(r, col('캡처')).setRichTextValue(link_('캡처', 'https://drive.google.com/file/d/' + s.captureId + '/view'));
  else sh.getRange(r, col('캡처')).setValue('');
  writeAuto_(sh, head, r, units, answers);
  recalcRow_(sh, head, r, readAdjust_(ss));
  sortGrade_(sh);
  rebuildResult_(ss);
}

/** 제출 탭에서 학생마다 저장 시각이 가장 늦은 기록(같으면 나중에 들어온 것) → { 학생 키: { answers, captureId } } */
function latestSubs_(ss) {
  const sub = ss.getSheetByName(TAB_SUB), sl = sub.getLastRow(), best = {};
  if (sl < 2) return best;
  sub.getRange(2, 1, sl - 1, SUB_HEAD.length).getValues().forEach((r) => {
    const k = studentKey_({ grade: r[SUB.grade], cls: r[SUB.cls], no: r[SUB.no], name: r[SUB.name] }), t = Date.parse(r[SUB.savedAt]) || 0;
    if (!best[k] || t >= best[k].t) best[k] = { t: t, raw: r[SUB.answers], captureId: String(r[SUB.capture] || '') };
  });
  Object.keys(best).forEach((k) => { let a = {}; try { a = JSON.parse(best[k].raw || '{}'); } catch (e) { a = {}; } best[k].answers = a; });
  return best;
}

/** 모든 학생의 고르기 칸을 정답으로 다시 채점하고 총점을 다시 쓴다 */
function regradeAuto_(ss) {
  const sh = gradeTab_(ss), head = headOf_(sh), last = sh.getLastRow(), units = scoredUnits_(ss), adj = readAdjust_(ss);
  if (last < 2) return;
  const subs = latestSubs_(ss), kc = head.indexOf('학생 키') + 1;
  for (let r = 2; r <= last; r++) {
    const rec = subs[String(sh.getRange(r, kc).getValue())];
    if (rec) writeAuto_(sh, head, r, units, rec.answers);
  }
  recalcAll_(sh, adj);
}

function units_(head) { return head.slice(FIX.length, head.indexOf(TAIL[0])); }
function clamp_(t, a) {
  let v = t + (Number(a.n) || 0);
  if (a.x !== '' && v < a.x) v = a.x;
  if (a.y !== '' && v > a.y) v = a.y;
  return Math.round(v * 100) / 100;
}
/** 한 줄의 총점·보정 총점을 숫자로 다시 씀 */
function recalcRow_(sh, head, r, adj) {
  const us = units_(head), c0 = FIX.length + 1;
  const vals = us.length ? sh.getRange(r, c0, 1, us.length).getValues()[0] : [];
  const total = vals.reduce((t, v) => t + (v === '' || isNaN(Number(v)) ? 0 : Number(v)), 0);
  sh.getRange(r, 5, 1, 2).setValues([[total, clamp_(total, adj)]]);
  return { total: total, adjusted: clamp_(total, adj) };
}
function recalcAll_(sh, adj) {
  const head = headOf_(sh), last = sh.getLastRow();
  if (last < 2) return;
  const us = units_(head), c0 = FIX.length + 1;
  const vals = us.length ? sh.getRange(2, c0, last - 1, us.length).getValues() : [];
  const out = [];
  for (let i = 0; i < last - 1; i++) {
    const total = (vals[i] || []).reduce((t, v) => t + (v === '' || isNaN(Number(v)) ? 0 : Number(v)), 0);
    out.push([total, clamp_(total, adj)]);
  }
  sh.getRange(2, 5, last - 1, 2).setValues(out);
}
function sortGrade_(sh) {
  const last = sh.getLastRow();
  if (last > 2) sh.getRange(2, 1, last - 1, sh.getLastColumn()).sort([{ column: 1, ascending: true }, { column: 2, ascending: true }, { column: 3, ascending: true }, { column: 4, ascending: true }]);
}

// ---------------------------------------------------------------- 결과 탭(학년→반→번호 순)
/** 채점 탭의 앞 6열(학년 반 번호 이름 총점 보정 총점)을 결과 탭에 통째로 다시 쓴다 */
function rebuildResult_(ss) {
  let sh = ss.getSheetByName(TAB_RES);
  if (!sh) {
    sh = insertBefore_(ss, TAB_RES, [TAB_SET]);   // 설정 탭 바로 앞
    sh.setFrozenRows(1);
  }
  const g = ss.getSheetByName(TAB_GRADE), last = g ? g.getLastRow() : 0;
  const rows = last >= 2 ? g.getRange(2, 1, last - 1, FIX.length).getValues() : [];
  const n = (v) => (digits_(v) ? Number(digits_(v)) : Infinity);   // 빈 학년·반·번호는 맨 뒤
  rows.sort((p, q) => n(p[0]) - n(q[0]) || n(p[1]) - n(q[1]) || n(p[2]) - n(q[2]) || String(p[3]).localeCompare(String(q[3]), 'ko'));
  const old = sh.getLastRow();
  if (old > 0) sh.getRange(1, 1, old, FIX.length).clearContent();
  sh.getRange(1, 1, 1, FIX.length).setValues([FIX]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, FIX.length).setValues(rows);
}

// ---------------------------------------------------------------- 채점 도우미(google.script.run — 모두 열쇠 확인)
function teacherOk_(key) { const k = prop_('TEACHER_KEY'); return !!k && String(key || '') === k; }
function guard_(key) { if (!teacherOk_(key)) throw new Error('선생님 열쇠가 맞지 않아요'); }
function teacherPage_(key) {
  if (!teacherOk_(key)) return HtmlService.createHtmlOutput('<p style="font:16px sans-serif">선생님 열쇠가 맞지 않거나 TEACHER_KEY 가 설정되지 않았어요.</p>');
  return HtmlService.createHtmlOutput(TEACHER_HTML.replace('__KEY__', () => JSON.stringify(String(key))))
    .setTitle('인공지능 엔트리 수행평가 채점 도우미').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function teacherInit(key) {
  guard_(key);
  const ss = book_();
  return { adjust: readAdjust_(ss), url: ss.getUrl() };
}

/** 반의 학생 카드 — 칸·배점·기준(설정) + 학생 답·캡처(제출 탭의 가장 늦은 기록) + 점수(채점 탭) */
function teacherData(key, cls) {
  guard_(key);
  const ss = book_(), sh = gradeTab_(ss), head = headOf_(sh), last = sh.getLastRow();
  const units = scoredUnits_(ss);
  const rows = last >= 2 ? sh.getRange(2, 1, last - 1, head.length).getValues() : [];
  const col = (n) => head.indexOf(n);
  const classes = Array.from(new Set(rows.map((r) => digits_(r[col('반')]) || '?'))).sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  const want = String(cls || classes[0] || '');
  const subs = latestSubs_(ss);
  const pdfCol = col('PDF') + 1;
  const list = [];
  rows.forEach((r, i) => {
    if ((digits_(r[col('반')]) || '?') !== want) return;
    const k = String(r[col('학생 키')]), scores = {}, rec = subs[k] || {};
    units.forEach((u) => { const c = col(u.unit); if (c >= 0 && r[c] !== '') scores[u.unit] = r[c]; });
    const link = sh.getRange(i + 2, pdfCol).getRichTextValue();
    list.push({ key: k, grade: r[col('학년')], cls: r[col('반')], no: r[col('번호')], name: r[col('이름')],
      total: r[col('총점')], adjusted: r[col('보정 총점')], flag: r[col('확인')], scores: scores,
      texts: rec.answers || {}, captureId: rec.captureId || '', pdf: link ? link.getLinkUrl() || '' : '' });
  });
  list.sort((a, b) => (Number(digits_(a.no)) || 999) - (Number(digits_(b.no)) || 999) || String(a.name).localeCompare(String(b.name), 'ko'));
  return { units: units, classes: classes, cls: want, students: list, adjust: readAdjust_(ss), url: ss.getUrl() + '#gid=' + sh.getSheetId() };
}

/** 결과 화면 캡처 한 장(채점 도우미 카드에 보여 줌) */
function teacherImage(key, id) {
  guard_(key);
  const f = DriveApp.getFileById(id);
  return 'data:' + f.getMimeType() + ';base64,' + Utilities.base64Encode(f.getBlob().getBytes());
}

/** 직접 채점 점수 하나 쓰기(score '' 이면 지움) → 그 줄 총점·보정 총점 다시 계산 */
function teacherScore(key, skey, unit, score) {
  guard_(key);
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = book_(), sh = gradeTab_(ss), head = headOf_(sh);
    const u = scoredUnits_(ss).filter((x) => x.unit === String(unit))[0];
    if (!u) throw new Error('설정 탭에 "' + unit + '" 칸이 없어요');
    if (u.auto) throw new Error('"' + unit + '" 칸은 자동으로 채점돼요');
    const r = rowOfKey_(sh, head, skey), c = head.indexOf(u.unit) + 1;
    if (r < 0) throw new Error('채점 탭에서 학생을 찾지 못했어요');
    if (c < 1) throw new Error('채점 탭에 "' + unit + '" 칸이 없어요');
    sh.getRange(r, c).setValue(score === '' || score == null ? '' : Number(score));
    const out = recalcRow_(sh, head, r, readAdjust_(ss));
    rebuildResult_(ss);
    return out;
  } finally { lock.releaseLock(); }
}

/** 보정 값 저장 → 보정 총점을 모두 다시 계산 */
function teacherAdjust(key, n, x, y) {
  guard_(key);
  const toNum = (v, blank) => (v === '' || v == null ? blank : Number(v));
  const a = { n: toNum(n, 0) || 0, x: toNum(x, ''), y: toNum(y, '') };
  if ((a.x !== '' && isNaN(a.x)) || (a.y !== '' && isNaN(a.y)) || isNaN(a.n)) throw new Error('숫자로 적어 주세요');
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = book_();
    ss.getSheetByName(TAB_SET).getRange(2, 2, 3, 1).setValues([[a.n], [a.x], [a.y]]);
    const sh = ss.getSheetByName(TAB_GRADE);
    if (sh) recalcAll_(sh, a);
    rebuildResult_(ss);
  } finally { lock.releaseLock(); }
  return a;
}

const TEACHER_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
body{margin:0;padding:16px;font:15px/1.6 'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#4A3B32;background:#FAF2E1}
h1{margin:0 0 12px;font-size:20px} .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
select,button,input{font:inherit;padding:6px 12px;border:2px solid #4A3B32;border-radius:8px;background:#fff;color:#4A3B32}
button{cursor:pointer} button.main{background:#FBE3E8;font-weight:700} button:disabled{opacity:.5;cursor:wait}
input{width:70px} .adj{padding:8px 12px;border:2px dashed #C9ADA1;border-radius:10px;background:#FFF9E6}
#msg{margin:0 0 12px;padding:10px 12px;border:2px solid #4A3B32;border-radius:10px;background:#fff} #msg:empty{display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px}
.card{padding:10px 12px;border:2px solid #4A3B32;border-radius:12px;background:#fff;min-width:0}
.card h3{margin:0 0 4px;font-size:16px;display:flex;justify-content:space-between;gap:8px} .card h3 small{font-weight:400}
.flag{display:inline-block;margin-left:6px;padding:0 6px;border-radius:6px;background:#fff4c2;font-size:12px}
.shot{display:block;width:100%;height:auto;margin-top:6px;border:1px solid #E3D5BD;border-radius:6px;background:#FFFCF6}
.none{margin-top:6px;padding:6px 10px;border:1px dashed #C9ADA1;border-radius:6px;color:#857062;font-size:14px}
.g{margin-top:10px} .g b{display:block;font-size:14px}
.essay{margin-top:4px;padding:8px 10px;border:1px solid #E3D5BD;border-radius:6px;background:#FFFCF6;white-space:pre-wrap;word-break:break-word;font-size:14px;max-height:320px;overflow:auto}
.essay.empty{color:#857062;border-style:dashed}
.rub{margin-top:4px;font-size:13px} .rub summary{cursor:pointer;color:#6B5B51} .rub div{margin-top:4px;padding:6px 8px;border-radius:6px;background:#FFF9E6;white-space:pre-wrap}
.sc{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px} .sc button{min-width:44px;padding:4px 10px} .sc button.on{background:#4A3B32;color:#fff}
.auto{margin-top:4px;font-size:14px;color:#6B5B51}
.sum{margin-top:10px;padding-top:8px;border-top:1px dashed #C9ADA1;font-weight:700} a{color:#B04A6C}
@media (max-width:480px){.grid{grid-template-columns:minmax(0,1fr)}}
</style></head><body>
<h1>인공지능 엔트리 수행평가 채점 도우미</h1>
<div class="bar"><label>반 <select id="cls"></select></label> <button class="main" id="loadBtn">불러오기</button> <a id="sheet" target="_blank">시트 열기</a></div>
<div class="bar adj">기본 점수 보정 —
<label>더할 점수 n <input id="an" type="number" step="1"></label>
<label>최저 x <input id="ax" type="number" step="1"></label>
<label>최고 y <input id="ay" type="number" step="1"></label>
<button id="adjBtn">적용</button> <small>보정 총점 = 총점 + n, x 이하는 x · y 이상은 y (x·y 를 비우면 제한 없음)</small></div>
<p id="msg"></p><div class="grid" id="grid"></div>
<script>
var KEY = __KEY__, $ = function (id) { return document.getElementById(id); };
function run(fn, args, ok) {
  var r = google.script.run.withSuccessHandler(ok).withFailureHandler(function (e) { say('⚠ ' + (e && e.message || e)); busy(false); });
  r[fn].apply(r, [KEY].concat(args));
}
function say(t) { $('msg').textContent = t; }
function busy(b) { ['loadBtn', 'adjBtn'].forEach(function (id) { $(id).disabled = b; }); }
function setAdj(a) { $('an').value = a.n; $('ax').value = a.x; $('ay').value = a.y; }
function opt(sel, list, cur) { sel.innerHTML = ''; list.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v === '?' ? '반 없음' : v + '반'; if (v === cur) o.selected = true; sel.appendChild(o); }); }
run('teacherInit', [], function (d) { setAdj(d.adjust); $('sheet').href = d.url; load(''); });
$('loadBtn').onclick = function () { load($('cls').value); };
$('adjBtn').onclick = function () {
  busy(true); say('보정 총점을 다시 계산하는 중…');
  run('teacherAdjust', [$('an').value, $('ax').value, $('ay').value], function (a) { setAdj(a); busy(false); load($('cls').value, '✔ 보정 값을 적용했어요. '); });
};
function load(cls, pre) {
  busy(true); $('grid').innerHTML = '';
  run('teacherData', [cls], function (d) {
    busy(false); opt($('cls'), d.classes, d.cls); $('sheet').href = d.url;
    if (!d.units.length) { say((pre || '') + '칸·배점이 아직 없어요. 이 PC 에서 npm run exam-key -- ai/exam-entry --send 를 먼저 해 주세요.'); return; }
    if (!d.students.length) { say((pre || '') + (d.cls ? d.cls + '반에 ' : '') + '제출한 학생이 없어요.'); return; }
    say((pre || '') + d.cls + '반 ' + d.students.length + '명 · 결과 화면·글자 칸은 점수를 누르면 바로 시트에 저장돼요(누른 점수를 한 번 더 누르면 지워져요). 고르기 칸은 자동으로 채점돼요.');
    d.students.forEach(function (s) { $('grid').appendChild(card(d, s)); });
  });
}
function card(d, s) {
  var c = document.createElement('div'); c.className = 'card';
  var h = document.createElement('h3'); var nm = document.createElement('span'); nm.textContent = (s.cls || '?') + '반 ' + (s.no || '?') + '번 ' + s.name;
  if (s.flag) { var fl = document.createElement('span'); fl.className = 'flag'; fl.textContent = s.flag; nm.appendChild(fl); }
  h.appendChild(nm);
  if (s.pdf) { var a = document.createElement('a'); a.href = s.pdf; a.target = '_blank'; a.textContent = 'PDF'; var sm = document.createElement('small'); sm.appendChild(a); h.appendChild(sm); }
  c.appendChild(h);
  if (s.captureId) { var im = document.createElement('img'); im.className = 'shot'; im.alt = s.name + ' 결과 화면 캡처'; c.appendChild(im); run('teacherImage', [s.captureId], function (url) { im.src = url; }); }
  else { var nn = document.createElement('div'); nn.className = 'none'; nn.textContent = '캡처 사본 없음 — 안 붙였거나 PDF 로 들어온 학생이에요. PDF 를 열어 확인해 주세요.'; c.appendChild(nn); }
  var sum = document.createElement('div'); sum.className = 'sum';
  function showSum(t, adj) { sum.textContent = '총점 ' + (t === '' ? 0 : t) + '점 · 보정 총점 ' + (adj === '' ? '-' : adj) + '점'; }
  d.units.forEach(function (u) {
    var g = document.createElement('div'); g.className = 'g';
    var b = document.createElement('b'); b.textContent = (/^[0-9]+$/.test(u.unit) ? u.unit + '번' : u.unit) + ' (' + u.points + '점' + (u.auto ? ', 자동' : '') + ')'; g.appendChild(b);
    var t = (s.texts || {})[u.unit] || '';
    if (u.auto) {
      var au = document.createElement('div'); au.className = 'auto';
      var sc0 = s.scores[u.unit];
      au.textContent = '고른 답 ' + (t || '없음') + ' · 정답 ' + (u.rubric || '(아직 없음)') + ' → ' + (sc0 === undefined ? '-' : sc0 + '점');
      g.appendChild(au); c.appendChild(g); return;
    }
    if (u.rubric) { var rb = document.createElement('details'); rb.className = 'rub'; var su = document.createElement('summary'); su.textContent = '채점 기준';
      var rd = document.createElement('div'); rd.textContent = u.rubric; rb.appendChild(su); rb.appendChild(rd); g.appendChild(rb); }
    if (u.kind !== 'graph') {   // 결과 화면은 카드 맨 위 캡처를 보고 채점한다
      var tx = document.createElement('div');
      tx.className = 'essay' + (t ? '' : ' empty'); tx.textContent = t || '(안 씀)'; g.appendChild(tx);
    }
    var sc = document.createElement('div'); sc.className = 'sc';
    for (var p = 0; p <= u.points; p++) (function (p) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = p + '점';
      if (String(s.scores[u.unit]) === String(p)) bt.className = 'on';
      bt.onclick = function () {
        var clear = bt.className === 'on';
        Array.prototype.forEach.call(sc.children, function (x) { x.className = ''; }); if (!clear) bt.className = 'on';
        run('teacherScore', [s.key, u.unit, clear ? '' : p], function (r) { showSum(r.total, r.adjusted); });
      };
      sc.appendChild(bt);
    })(p);
    g.appendChild(sc); c.appendChild(g);
  });
  showSum(s.total, s.adjusted); c.appendChild(sum);
  return c;
}
</script></body></html>`;

// ---------------------------------------------------------------- 처음 한 번 실행
function setup() {
  const root = rootFolder_();
  const ss = book_();
  Logger.log('제출 PDF 폴더: ' + root.getUrl());
  Logger.log('채점 시트: ' + ss.getUrl());
  Logger.log('스크립트 속성 TEACHER_KEY 를 넣고, 배포 → 새 배포 → 웹 앱 으로 배포하세요.');
}

// ---------------------------------------------------------------- 도우미
function rootFolder_() {
  const id = prop_('FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const it = DriveApp.getRootFolder().getFoldersByName(ROOT_FOLDER_NAME);
  const f = it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(ROOT_FOLDER_NAME);
  PropertiesService.getScriptProperties().setProperty('FOLDER_ID', f.getId());
  return f;
}
function subFolder_(parent, name) { const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); }

/** 채점 시트 — 없으면 만들고 탭 4개(제출 · 채점 · 결과 · 설정)를 갖춘다 */
function book_() {
  const id = prop_('SHEET_ID');
  let ss;
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    ss = SpreadsheetApp.create(BOOK_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(rootFolder_());
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  }
  if (!ss.getSheetByName(TAB_SUB)) {
    const first = ss.getSheets()[0];
    const sh = first && first.getLastRow() === 0 && !ss.getSheetByName(TAB_SET) ? first.setName(TAB_SUB) : ss.insertSheet(TAB_SUB, 0);
    sh.getRange(1, 1, 1, SUB_HEAD.length).setValues([SUB_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  if (!ss.getSheetByName(TAB_GRADE)) gradeTabSetupOnly_(ss);
  if (!ss.getSheetByName(TAB_SET)) {
    const sh = ss.insertSheet(TAB_SET);
    sh.getRange(1, 1, 4, 3).setValues([
      ['보정 (채점 도우미에서 바꿈)', '값', '설명'],
      ['더할 점수 n', 0, '총점에 더하는 기본 점수'],
      ['최저 점수 x', '', '보정한 점수가 x 이하이면 x 점(비우면 제한 없음)'],
      ['최고 점수 y', '', '보정한 점수가 y 이상이면 y 점(비우면 제한 없음)'],
    ]);
    sh.getRange(SET_KEY_ROW - 1, 1, 1, 5).setValues([['칸', '종류', '배점', '칸 이름', '정답·채점 기준']]);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold'); sh.getRange(SET_KEY_ROW - 1, 1, 1, 5).setFontWeight('bold');
    sh.setColumnWidth(1, 170); sh.setColumnWidth(5, 520);
  }
  if (!ss.getSheetByName(TAB_RES)) rebuildResult_(ss);
  return ss;
}
function gradeTabSetupOnly_(ss) {   // 설정 탭이 생기기 전에도 머리글(칸 없이)만 먼저
  const sh = insertBefore_(ss, TAB_GRADE, [TAB_RES, TAB_SET]);
  const head = FIX.concat(TAIL);
  sh.getRange(1, 1, 1, head.length).setNumberFormat('@').setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(1); sh.setFrozenColumns(FIX.length); sh.hideColumns(head.length);
}

/** 탭을 names 중 처음 있는 탭 바로 앞에 끼운다(없으면 맨 뒤) — 지웠다 다시 생겨도 탭 순서가 그대로 */
function insertBefore_(ss, name, names) {
  for (let i = 0; i < names.length; i++) { const t = ss.getSheetByName(names[i]); if (t) return ss.insertSheet(name, t.getIndex() - 1); }
  return ss.insertSheet(name);
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function clean_(s, n) { return String(s).replace(/[\u0000-\u001f\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }
function digits_(s) { return String(s == null ? '' : s).replace(/[^0-9]/g, ''); }
function num_(v) { const d = digits_(v); return d ? Number(d) : ''; }
function studentKey_(s) { return [digits_(s.grade), digits_(s.cls), digits_(s.no), String(s.name || '').trim()].join('|'); }
function link_(text, url) { return SpreadsheetApp.newRichTextValue().setText(text).setLinkUrl(url).build(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
