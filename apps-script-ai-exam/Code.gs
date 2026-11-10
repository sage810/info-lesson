/**
 * 인공지능 수행평가(A형·B형) 전용 — 제출 받기 · 채점 도우미 (Google Apps Script 웹앱, 2026-11-04)
 *
 * 기존 apps-script/(정보수업 API — 09 데이터분석 수행평가·NEIS)와 **따로 쓰는 새 프로젝트·새 시트**다.
 * 시트에는 **수식을 쓰지 않는다** — 점수·총점·보정 총점을 이 코드가 숫자로 써 넣고, PDF 는 링크 글자로 넣는다.
 *
 * 시트 「인공지능 수행평가 채점」 — 탭 6개
 *   제출       : 학생이 낸 기록 원본(한 번 낼 때마다 한 줄)
 *   채점 A형   : 학생 한 줄(같은 학생은 한 줄) · 학년 반 번호 이름 · 총점 · 보정 총점 · 칸별 점수 · 저장 시각 · 출처 · PDF · 확인
 *   채점 B형   : 위와 같음
 *   결과       : 두 형을 모은 학년 반 번호 이름 · 총점 · 보정 총점(학년→반→번호 순, 점수가 바뀔 때마다 코드가 다시 씀 — 손으로 고치지 않음)
 *   생기부 참고 : 두 형을 모은 학생 한 줄 · 3-2·3-3 점수와 학생 글(가장 늦게 낸 것) · 메모(선생님이 씀 — 코드가 다시 써도 지킴) · PDF (2026-11-10)
 *   설정       : 보정 값(n·x·y — 채점 도우미에서 바꿈) · 형별 칸·배점·채점 기준(이 PC 의 npm run exam-key 가 보냄)
 *
 *   GET  ?action=ping 또는 주소만        → 살아 있는지 확인
 *   GET  ?action=teacher&key=…           → 채점 도우미(형·반 고르기 → 학생 글 보며 점수 누르기 · 보정 값 적용)
 *   GET  ?action=record&key=…            → 「생기부 참고」 탭을 통째로 다시 쓰기(편집기에서 함수 생기부참고만들기 ▶ 와 같음)
 *   POST {"action":"submit", …}          → 시험지의 "PDF로 저장하기"(자동 제출) · npm run exam-pdf --send
 *   POST {"action":"setKey", key, lesson, rows} → 설정 탭에 그 형의 칸·배점·채점 기준 쓰기(npm run exam-key --send). 정답은 이 코드에 없다
 *
 * 스크립트 속성: TEACHER_KEY(필수 — 채점 도우미·exam-key) · SUBMIT_TOKEN(선택) · FOLDER_ID·SHEET_ID(setup 이 자동으로 넣음)
 * 처음 한 번: 함수 목록에서 setup ▶ 실행 → 권한 허용 → 로그에 폴더·시트 주소. 배포는 README.md.
 */

const FORMS = { 'ai/exam-a': 'A', 'ai/exam-b': 'B' };
const ROOT_FOLDER_NAME = '인공지능 수행평가 제출';
const BOOK_NAME = '인공지능 수행평가 채점';
const TAB_SUB = '제출', TAB_SET = '설정', TAB_RES = '결과';
const SUB_HEAD = ['제출 시각', '형', '학년', '반', '번호', '이름', '저장 시각', '출처', 'PDF', '파일 이름', '답(JSON)'];
const FIX = ['학년', '반', '번호', '이름', '총점', '보정 총점'];   // 채점 탭 앞 6열
const TAIL = ['저장 시각', '출처', 'PDF', '확인', '학생 키'];       // 채점 탭 뒤 5열(학생 키는 숨김)
// 칸 이름 「1-1」「3-1」은 시트가 날짜(1월 1일)로 바꿔 버린다 → 머리글·칸 열은 글자 서식(@)으로 쓴다(2026-11-04 리허설에서 발견)
const SET_KEY_ROW = 7;                                             // 설정 탭: 6행 머리글, 7행부터 칸·배점·기준
const MAX_PDF_BYTES = 20 * 1024 * 1024;
// 잠금(차례): 시트에 쓰는 동안 한 사람씩. 못 받으면 쓰지 않는다
const LOCK_WAIT_SUBMIT = 60000;   // 제출 — 한 명 저장에 몇 초 걸려 수업 끝에 몰리면 오래 기다려야 한다
const LOCK_WAIT = 20000;          // 선생님 쪽(점수·보정 등)
const BUSY = '사람이 몰려 저장하지 못했어요. 잠시 뒤 다시 해 주세요.';
const VERSION = '2026-11-10-record';   // 새 버전 배포를 주소로 확인하는 값(연결 확인 응답에 보임)
// 생기부 참고 탭(선생님 결정 2026-11-10) — 3-2·3-3 은 문항별 한 칸(소문항은 「[이름] 글」 줄). 학생 키 = 형|학년|반|번호|이름(숨김)
const TAB_REC = '생기부 참고';
const REC_UNITS = ['3-2', '3-3'];
const REC_HEAD = ['학년', '반', '번호', '이름', '형', '3-2 점수', '3-3 점수', '3-2 문제 정의서', '3-3 인공지능 시스템 4단계', '메모', 'PDF', '학생 키'];

function tabGrade_(f) { return '채점 ' + f + '형'; }
function formOf_(lesson) { return FORMS[String(lesson || '')] || ''; }

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'teacher') return teacherPage_(p.key);
  if (p.action === 'record') {
    if (!teacherOk_(p.key)) return json_({ ok: false, error: '선생님 열쇠(TEACHER_KEY)가 맞지 않아요' });
    try { return json_({ ok: true, tab: TAB_REC, rows: recordNow_() }); } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
  }
  return json_({ ok: true, service: 'ai-exam', version: VERSION, time: new Date().toISOString() });
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
  const form = formOf_(b.lesson);
  if (!form) return json_({ ok: false, error: '이 시험지는 여기로 받지 않아요: ' + clean_(b.lesson || '', 40) });
  if (!b.pdf) return json_({ ok: false, error: 'PDF 가 비어 있어요' });
  const bytes = Utilities.base64Decode(b.pdf);
  if (bytes.length > MAX_PDF_BYTES) return json_({ ok: false, error: '파일이 너무 커요' });

  const filename = clean_(b.filename || '수행평가.pdf', 120);
  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd-HHmmss');
  const file = subFolder_(rootFolder_(), form + '형').createFile(Utilities.newBlob(bytes, 'application/pdf', stamp + ' ' + filename));
  const st = b.student || {};
  const s = { grade: num_(st.grade), cls: num_(st.cls), no: num_(st.no), name: clean_(st.name || '', 40),
    savedAt: b.savedAt ? String(b.savedAt).slice(0, 40) : new Date().toISOString(), source: b.source === 'pdf' ? 'PDF' : '웹', pdf: file.getUrl() };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_SUBMIT)) {   // 실패로 돌려주면 학생 화면이 자동으로 다시 보낸다 — 파일이 겹치지 않게 휴지통으로
    try { file.setTrashed(true); } catch (err) { /* 파일 정리가 실패해도 제출 실패로 알리는 것이 먼저 */ }
    return json_({ ok: false, error: BUSY });
  }
  try {
    const ss = book_();
    const sh = ss.getSheetByName(TAB_SUB);
    sh.appendRow([new Date(), form, s.grade, s.cls, s.no, s.name, s.savedAt, s.source, 'PDF', filename, JSON.stringify(b.answers || {}).slice(0, 45000)]);
    sh.getRange(sh.getLastRow(), 9).setRichTextValue(link_('PDF', s.pdf));
    if (upsertGrade_(ss, form, s)) {
      // 생기부 참고는 그 학생 한 줄만 — 여기서 문제가 나도 제출은 성공으로(채점 도우미를 열면 통째로 다시 씀)
      try { upsertRecord_(ss, form, s, b.answers || {}); } catch (err) { console.error('생기부 참고 쓰기 실패: ' + (err && err.message || err)); }
    }
  } finally { lock.releaseLock(); }
  return json_({ ok: true, file: file.getName() });
}

// ---------------------------------------------------------------- 설정 탭(보정 값 · 칸·배점·기준)
function readAdjust_(ss) {
  const v = ss.getSheetByName(TAB_SET).getRange(2, 2, 3, 1).getValues().map((r) => r[0]);
  const n = Number(v[0]) || 0, x = v[1] === '' ? '' : Number(v[1]), y = v[2] === '' ? '' : Number(v[2]);
  return { n: n, x: isNaN(x) ? '' : x, y: isNaN(y) ? '' : y };
}
function readUnits_(ss, form) {
  const sh = ss.getSheetByName(TAB_SET), last = sh.getLastRow();
  if (last < SET_KEY_ROW) return [];
  return sh.getRange(SET_KEY_ROW, 1, last - SET_KEY_ROW + 1, 6).getDisplayValues()
    .filter((r) => r[0] === form && r[1])
    .map((r) => ({ unit: r[1], kind: r[2], points: Number(r[3]) || 0, label: r[4], rubric: r[5] }));
}

function setKey_(b) {
  if (!teacherOk_(b.key)) return json_({ ok: false, error: '선생님 열쇠(TEACHER_KEY)가 맞지 않아요' });
  const form = formOf_(b.lesson);
  if (!form) return json_({ ok: false, error: '이 시험지는 여기로 받지 않아요: ' + clean_(b.lesson || '', 40) });
  const rows = (b.rows || []).map((r) => [form, String(r.unit), String(r.kind), Number(r.points) || 0, String(r.label || ''), String(r.answer == null ? '' : r.answer)]);
  if (!rows.length) return json_({ ok: false, error: '칸이 비어 있어요' });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT)) throw new Error(BUSY);
  try {
    const ss = book_(), sh = ss.getSheetByName(TAB_SET), last = sh.getLastRow();
    const keep = last >= SET_KEY_ROW ? sh.getRange(SET_KEY_ROW, 1, last - SET_KEY_ROW + 1, 6).getValues().filter((r) => r[0] && r[0] !== form) : [];
    const all = keep.concat(rows).sort((p, q) => String(p[0]).localeCompare(String(q[0])));
    if (last >= SET_KEY_ROW) sh.getRange(SET_KEY_ROW, 1, last - SET_KEY_ROW + 1, 6).clearContent();
    sh.getRange(SET_KEY_ROW, 1, all.length, 2).setNumberFormat('@');
    sh.getRange(SET_KEY_ROW, 1, all.length, 6).setValues(all);
    sh.getRange(SET_KEY_ROW, 6, all.length, 1).setWrap(true);
    const g = gradeTab_(ss, form);
    recalcAll_(g, readAdjust_(ss));
    rebuildResult_(ss);
  } finally { lock.releaseLock(); }
  return json_({ ok: true, lesson: form + '형', tab: TAB_SET, rows: rows.length, points: rows.reduce((t, r) => t + r[3], 0) });
}

// ---------------------------------------------------------------- 채점 탭(학생 한 줄, 숫자만)
function headOf_(sh) { return sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String); }

/** 채점 탭을 찾고, 머리글이 설정의 칸과 맞게(없는 칸은 "저장 시각" 앞에 열을 끼워 넣음) */
function gradeTab_(ss, form, extraUnits) {
  const sh = ss.getSheetByName(tabGrade_(form)) || insertBefore_(ss, tabGrade_(form), [TAB_RES, TAB_SET]);
  let units = readUnits_(ss, form).map((u) => u.unit);
  (extraUnits || []).forEach((u) => { if (units.indexOf(u) < 0) units.push(u); });
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

function upsertGrade_(ss, form, s) {
  const sh = gradeTab_(ss, form), head = headOf_(sh), key = studentKey_(s), col = (n) => head.indexOf(n) + 1;
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
    if ((Date.parse(s.savedAt) || 0) < (Date.parse(old) || 0)) return false;   // 더 예전 기록이면 그대로(같은 PDF 를 또 보낸 경우 등)
    const scored = units_(head).some((u) => sh.getRange(r, col(u)).getValue() !== '');
    if (scored && s.savedAt !== old) flags.push('다시 냄 — 점수 확인');
    sh.getRange(r, col('저장 시각'), 1, 2).setValues([[s.savedAt, s.source]]);
    sh.getRange(r, col('확인')).setValue(flags.join(', '));
  }
  sh.getRange(r, col('PDF')).setRichTextValue(link_('PDF', s.pdf));
  recalcRow_(sh, head, r, readAdjust_(ss));
  sortGrade_(sh);
  rebuildResult_(ss);
  return true;   // 이 기록이 그 학생의 가장 늦은 기록 — 생기부 참고도 이 글로
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

// ---------------------------------------------------------------- 결과 탭(두 형을 모아 학년→반→번호 순)
/** 채점 A형·B형의 앞 6열(학년 반 번호 이름 총점 보정 총점)을 모아 결과 탭을 통째로 다시 쓴다 */
function rebuildResult_(ss) {
  let sh = ss.getSheetByName(TAB_RES);
  if (!sh) {
    sh = insertBefore_(ss, TAB_RES, [TAB_SET]);   // 설정 탭 바로 앞
    sh.setFrozenRows(1);
  }
  let rows = [];
  ['A', 'B'].forEach((f) => {
    const g = ss.getSheetByName(tabGrade_(f)), last = g ? g.getLastRow() : 0;
    if (last >= 2) rows = rows.concat(g.getRange(2, 1, last - 1, FIX.length).getValues());
  });
  const n = (v) => (digits_(v) ? Number(digits_(v)) : Infinity);   // 빈 학년·반·번호는 맨 뒤
  rows.sort((p, q) => n(p[0]) - n(q[0]) || n(p[1]) - n(q[1]) || n(p[2]) - n(q[2]) || String(p[3]).localeCompare(String(q[3]), 'ko'));
  const old = sh.getLastRow();
  if (old > 0) sh.getRange(1, 1, old, FIX.length).clearContent();
  sh.getRange(1, 1, 1, FIX.length).setValues([FIX]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, FIX.length).setValues(rows);
}

// ---------------------------------------------------------------- 생기부 참고 탭(3-2·3-3 학생 글, 선생님 결정 2026-11-10)
//  학생 한 줄 · 두 형을 모아 학년→반→번호 순 · 글은 그 학생이 가장 늦게 낸 것(채점 도우미와 같음) · 점수는 채점 탭 값
//  「메모」 칸은 선생님이 쓰는 곳 — 코드가 다시 써도 학생 키로 찾아 지킨다(채점 탭에서 사라진 학생도 메모가 있으면 줄을 남김)
//  제출 때는 그 학생 한 줄만 고친다(수업 끝에 몰릴 때 잠금 시간을 늘리지 않게). 통째로 다시 쓰기는 채점 도우미를 열 때 · ?action=record · 생기부참고만들기 ▶
function recTab_(ss) {
  let sh = ss.getSheetByName(TAB_REC);
  if (sh) return sh;
  sh = insertBefore_(ss, TAB_REC, [TAB_SET]);   // 결과 탭 다음, 설정 탭 앞
  sh.getRange(1, 1, 1, REC_HEAD.length).setNumberFormat('@').setValues([REC_HEAD]).setFontWeight('bold');
  sh.setFrozenRows(1); sh.setFrozenColumns(4);
  const c = (n) => REC_HEAD.indexOf(n) + 1;
  sh.setColumnWidth(c('3-2 문제 정의서'), 420); sh.setColumnWidth(c('3-3 인공지능 시스템 4단계'), 420); sh.setColumnWidth(c('메모'), 320);
  sh.getRange(1, c('3-2 문제 정의서'), sh.getMaxRows(), 3).setWrap(true);
  sh.getRange(1, 1, sh.getMaxRows(), REC_HEAD.length).setVerticalAlignment('top');
  sh.hideColumns(c('학생 키'));
  return sh;
}
function recKey_(form, s) { return form + '|' + studentKey_(s); }
/** 시트가 「=」「+」「-」「@」로 시작하는 글을 수식으로 읽지 않게(글자가 아닌 값 — 메모에 쓴 날짜·숫자 — 은 그대로) */
function plain_(v) { if (v == null) return ''; if (typeof v !== 'string') return v; return /^[=+\-@]/.test(v) ? "'" + v : v; }
function recRow_(form, s, scores, answers, memo, key) {
  return [s.grade, s.cls, s.no, s.name, form + '형', scores[0], scores[1], plain_(answers['3-2']), plain_(answers['3-3']), plain_(memo), 'PDF', key];
}
function sortRec_(sh) {
  const last = sh.getLastRow();
  if (last > 2) sh.getRange(2, 1, last - 1, REC_HEAD.length).sort([{ column: 1, ascending: true }, { column: 2, ascending: true }, { column: 3, ascending: true }, { column: 4, ascending: true }]);
}

/** 제출 하나 → 그 학생 한 줄(메모는 그대로). submit_ 의 잠금 안에서, 그 학생의 가장 늦은 기록일 때만 부른다 */
function upsertRecord_(ss, form, s, answers) {
  const sh = recTab_(ss), key = recKey_(form, s), ci = (n) => REC_HEAD.indexOf(n) + 1;
  const g = ss.getSheetByName(tabGrade_(form)), gh = headOf_(g), gr = rowOfKey_(g, gh, studentKey_(s));
  const scores = REC_UNITS.map((u) => { const c = gh.indexOf(u) + 1; return gr > 0 && c > 0 ? g.getRange(gr, c).getValue() : ''; });
  const r0 = rowOfKey_(sh, REC_HEAD, key);
  const memo = r0 > 0 ? sh.getRange(r0, ci('메모')).getValue() : '';
  const r = r0 > 0 ? r0 : Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(r, 1, 1, REC_HEAD.length).setValues([recRow_(form, s, scores, answers, memo, key)]);
  sh.getRange(r, ci('PDF')).setRichTextValue(link_('PDF', s.pdf));
  sortRec_(sh);
}

/** 채점 도우미에서 3-2·3-3 점수를 누르면 그 칸만 따라 바꿈(줄이 없으면 건너뜀 — 통째로 다시 쓸 때 채워짐) */
function recScore_(ss, form, skey, unit, score) {
  const sh = ss.getSheetByName(TAB_REC);
  if (!sh || REC_UNITS.indexOf(unit) < 0) return;
  const r = rowOfKey_(sh, REC_HEAD, form + '|' + skey);
  if (r > 0) sh.getRange(r, REC_HEAD.indexOf(unit + ' 점수') + 1).setValue(score === '' || score == null ? '' : Number(score));
}

/** 통째로 다시 쓰기 — 학생 목록은 채점 A형·B형 탭, 글은 제출 탭의 가장 늦은 기록, 메모는 지금 탭에서 학생 키로 */
function rebuildRecord_(ss) {
  const sh = recTab_(ss), ci = (n) => REC_HEAD.indexOf(n), last = sh.getLastRow();
  const old = last >= 2 ? sh.getRange(2, 1, last - 1, REC_HEAD.length).getValues() : [];
  const memo = {}, oldRow = {};
  old.forEach((r) => { const k = String(r[ci('학생 키')] || ''); if (k) { memo[k] = r[ci('메모')]; oldRow[k] = r; } });
  const latest = {}, sub = ss.getSheetByName(TAB_SUB), sl = sub ? sub.getLastRow() : 0;
  if (sl >= 2) sub.getRange(2, 1, sl - 1, SUB_HEAD.length).getValues().forEach((r) => {
    const k = recKey_(String(r[1]), { grade: r[2], cls: r[3], no: r[4], name: r[5] }), t = Date.parse(r[6]) || 0;
    if (!latest[k] || t >= latest[k].t) latest[k] = { t: t, a: r[10] };
  });
  const out = [], seen = {};
  ['A', 'B'].forEach((f) => {
    const g = ss.getSheetByName(tabGrade_(f)), gl = g ? g.getLastRow() : 0;
    if (gl < 2) return;
    const gh = headOf_(g), gc = (n) => gh.indexOf(n);
    const vals = g.getRange(2, 1, gl - 1, gh.length).getValues();
    const pdfs = gc('PDF') >= 0 ? g.getRange(2, gc('PDF') + 1, gl - 1, 1).getRichTextValues() : [];
    vals.forEach((r, i) => {
      const s = { grade: r[gc('학년')], cls: r[gc('반')], no: r[gc('번호')], name: r[gc('이름')] };
      if (!String(s.name || '').trim() && !r[gc('학생 키')]) return;   // 손으로 비운 줄
      const k = f + '|' + (String(r[gc('학생 키')] || '') || studentKey_(s));   // 낼 때 정한 학생 키(이름을 손으로 고쳐도 글을 찾게)
      let a = {};
      try { a = latest[k] ? JSON.parse(latest[k].a || '{}') : {}; } catch (e) { a = {}; }
      const link = pdfs[i] && pdfs[i][0];
      out.push({ row: recRow_(f, s, REC_UNITS.map((u) => (gc(u) >= 0 ? r[gc(u)] : '')), a, memo[k], k), url: link ? link.getLinkUrl() || '' : '' });
      seen[k] = true;
    });
  });
  Object.keys(oldRow).forEach((k) => {   // 채점 탭에 없는 학생 — 메모가 있으면 그 줄을 그대로 둔다
    if (seen[k] || !String(memo[k] || '').trim()) return;
    const r = oldRow[k].map((v, j) => ([ci('3-2 문제 정의서'), ci('3-3 인공지능 시스템 4단계'), ci('메모')].indexOf(j) >= 0 ? plain_(v) : v));
    r[ci('PDF')] = '';
    out.push({ row: r, url: '' });
  });
  const n = (v) => (digits_(v) ? Number(digits_(v)) : Infinity);
  out.sort((p, q) => n(p.row[0]) - n(q.row[0]) || n(p.row[1]) - n(q.row[1]) || n(p.row[2]) - n(q.row[2]) || String(p.row[3]).localeCompare(String(q.row[3]), 'ko'));
  if (last >= 2) sh.getRange(2, 1, last - 1, REC_HEAD.length).clearContent();
  if (out.length) {
    sh.getRange(2, 1, out.length, REC_HEAD.length).setValues(out.map((o) => o.row));
    sh.getRange(2, ci('PDF') + 1, out.length, 1).setRichTextValues(out.map((o) => [o.url ? link_('PDF', o.url) : SpreadsheetApp.newRichTextValue().setText('').build()]));
  }
  return out.length;
}
/** 잠금을 받고 통째로 다시 쓰기 → 줄 수 */
function recordNow_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT)) throw new Error(BUSY);
  try { return rebuildRecord_(book_()); } finally { lock.releaseLock(); }
}
/** 편집기에서 ▶ 실행: 「생기부 참고」 탭을 지금 제출된 답으로 다시 채운다 */
function 생기부참고만들기() { Logger.log('생기부 참고: ' + recordNow_() + '줄'); }

// ---------------------------------------------------------------- 채점 도우미(google.script.run — 모두 열쇠 확인)
function teacherOk_(key) { const k = prop_('TEACHER_KEY'); return !!k && String(key || '') === k; }
function guard_(key) { if (!teacherOk_(key)) throw new Error('선생님 열쇠가 맞지 않아요'); }
function teacherPage_(key) {
  if (!teacherOk_(key)) return HtmlService.createHtmlOutput('<p style="font:16px sans-serif">선생님 열쇠가 맞지 않거나 TEACHER_KEY 가 설정되지 않았어요.</p>');
  return HtmlService.createHtmlOutput(TEACHER_HTML.replace('__KEY__', () => JSON.stringify(String(key))))
    .setTitle('인공지능 수행평가 채점 도우미').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function teacherInit(key) {
  guard_(key);
  const ss = book_();
  const lock = LockService.getScriptLock();   // 결과 탭이 없던 시트(예전 배포)도 도우미를 열면 생긴다
  if (lock.tryLock(LOCK_WAIT)) {
    try {
      rebuildResult_(ss);
      try { rebuildRecord_(ss); } catch (err) { console.error('생기부 참고 다시 쓰기 실패: ' + (err && err.message || err)); }   // 손으로 고친 점수도 여기서 따라옴
    } finally { lock.releaseLock(); }
  }
  return { forms: ['A', 'B'], adjust: readAdjust_(ss), url: ss.getUrl() };
}

/** 형·반의 학생 카드 — 칸·배점·기준(설정) + 학생 글(제출 탭의 가장 늦은 기록) + 점수(채점 탭) */
function teacherData(key, form, cls) {
  guard_(key);
  const ss = book_(), sh = gradeTab_(ss, form), head = headOf_(sh), last = sh.getLastRow();
  const units = readUnits_(ss, form);
  const rows = last >= 2 ? sh.getRange(2, 1, last - 1, head.length).getValues() : [];
  const col = (n) => head.indexOf(n);
  const classes = Array.from(new Set(rows.map((r) => digits_(r[col('반')]) || '?'))).sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  const want = String(cls || classes[0] || '');
  // 학생 글: 제출 탭에서 이 형의 학생마다 저장 시각이 가장 늦은 것
  const sub = ss.getSheetByName(TAB_SUB), sl = sub.getLastRow(), texts = {};
  if (sl >= 2) {
    const best = {};
    sub.getRange(2, 1, sl - 1, SUB_HEAD.length).getValues().forEach((r) => {
      if (r[1] !== form) return;
      const k = studentKey_({ grade: r[2], cls: r[3], no: r[4], name: r[5] }), t = Date.parse(r[6]) || 0;
      if (!best[k] || t >= best[k].t) best[k] = { t: t, a: r[10] };
    });
    Object.keys(best).forEach((k) => { try { texts[k] = JSON.parse(best[k].a || '{}'); } catch (e) { texts[k] = {}; } });
  }
  const pdfCol = col('PDF') + 1;
  const list = [];
  rows.forEach((r, i) => {
    if ((digits_(r[col('반')]) || '?') !== want) return;
    const k = String(r[col('학생 키')]), scores = {};
    units.forEach((u) => { const c = col(u.unit); if (c >= 0 && r[c] !== '') scores[u.unit] = r[c]; });
    const link = sh.getRange(i + 2, pdfCol).getRichTextValue();
    list.push({ key: k, grade: r[col('학년')], cls: r[col('반')], no: r[col('번호')], name: r[col('이름')],
      total: r[col('총점')], adjusted: r[col('보정 총점')], flag: r[col('확인')], scores: scores,
      texts: texts[k] || {}, pdf: link ? link.getLinkUrl() || '' : '' });
  });
  list.sort((a, b) => (Number(digits_(a.no)) || 999) - (Number(digits_(b.no)) || 999) || String(a.name).localeCompare(String(b.name), 'ko'));
  return { form: form, units: units, classes: classes, cls: want, students: list, adjust: readAdjust_(ss), url: ss.getUrl() + '#gid=' + sh.getSheetId() };
}

/** 점수 하나 쓰기(score '' 이면 지움) → 그 줄 총점·보정 총점 다시 계산 */
function teacherScore(key, form, skey, unit, score) {
  guard_(key);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT)) throw new Error(BUSY);
  try {
    const ss = book_(), sh = gradeTab_(ss, form), head = headOf_(sh);
    const r = rowOfKey_(sh, head, skey), c = head.indexOf(unit) + 1;
    if (r < 0) throw new Error('채점 탭에서 학생을 찾지 못했어요');
    if (c < 1) throw new Error('채점 탭에 "' + unit + '" 칸이 없어요');
    sh.getRange(r, c).setValue(score === '' || score == null ? '' : Number(score));
    const out = recalcRow_(sh, head, r, readAdjust_(ss));
    rebuildResult_(ss);
    try { recScore_(ss, form, skey, unit, score); } catch (err) { console.error('생기부 참고 점수 실패: ' + (err && err.message || err)); }
    return out;
  } finally { lock.releaseLock(); }
}

/** 보정 값 저장 → 두 형의 보정 총점을 모두 다시 계산 */
function teacherAdjust(key, n, x, y) {
  guard_(key);
  const toNum = (v, blank) => (v === '' || v == null ? blank : Number(v));
  const a = { n: toNum(n, 0) || 0, x: toNum(x, ''), y: toNum(y, '') };
  if ((a.x !== '' && isNaN(a.x)) || (a.y !== '' && isNaN(a.y)) || isNaN(a.n)) throw new Error('숫자로 적어 주세요');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT)) throw new Error(BUSY);
  try {
    const ss = book_();
    ss.getSheetByName(TAB_SET).getRange(2, 2, 3, 1).setValues([[a.n], [a.x], [a.y]]);
    Object.keys(FORMS).forEach((l) => { const f = FORMS[l], sh = ss.getSheetByName(tabGrade_(f)); if (sh) recalcAll_(sh, a); });
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
.card{padding:10px 12px;border:2px solid #4A3B32;border-radius:12px;background:#fff}
.card h3{margin:0 0 4px;font-size:16px;display:flex;justify-content:space-between;gap:8px} .card h3 small{font-weight:400}
.flag{display:inline-block;margin-left:6px;padding:0 6px;border-radius:6px;background:#fff4c2;font-size:12px}
.g{margin-top:10px} .g b{display:block;font-size:14px}
.essay{margin-top:4px;padding:8px 10px;border:1px solid #E3D5BD;border-radius:6px;background:#FFFCF6;white-space:pre-wrap;word-break:break-word;font-size:14px;max-height:320px;overflow:auto}
.essay.empty{color:#857062;border-style:dashed}
.rub{margin-top:4px;font-size:13px} .rub summary{cursor:pointer;color:#6B5B51} .rub div{margin-top:4px;padding:6px 8px;border-radius:6px;background:#FFF9E6;white-space:pre-wrap}
.sc{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px} .sc button{min-width:44px;padding:4px 10px} .sc button.on{background:#4A3B32;color:#fff}
.sum{margin-top:10px;padding-top:8px;border-top:1px dashed #C9ADA1;font-weight:700} a{color:#B04A6C}
</style></head><body>
<h1>인공지능 수행평가 채점 도우미</h1>
<div class="bar"><label>형 <select id="form"><option value="A">A형</option><option value="B">B형</option></select></label>
<label>반 <select id="cls"></select></label> <button class="main" id="loadBtn">불러오기</button> <a id="sheet" target="_blank">시트 열기</a></div>
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
$('form').onchange = function () { load(''); };
$('loadBtn').onclick = function () { load($('cls').value); };
$('adjBtn').onclick = function () {
  busy(true); say('보정 총점을 다시 계산하는 중…');
  run('teacherAdjust', [$('an').value, $('ax').value, $('ay').value], function (a) { setAdj(a); busy(false); load($('cls').value, '✔ 보정 값을 적용했어요(A형·B형 모두). '); });
};
function load(cls, pre) {
  busy(true); $('grid').innerHTML = '';
  run('teacherData', [$('form').value, cls], function (d) {
    busy(false); opt($('cls'), d.classes, d.cls); $('sheet').href = d.url;
    if (!d.units.length) { say((pre || '') + d.form + '형 칸·배점이 아직 없어요. 이 PC 에서 npm run exam-key -- ai/exam-' + d.form.toLowerCase() + ' --send 를 먼저 해 주세요.'); return; }
    if (!d.students.length) { say((pre || '') + d.form + '형 ' + (d.cls ? d.cls + '반에 ' : '') + '제출한 학생이 없어요.'); return; }
    say((pre || '') + d.form + '형 ' + d.cls + '반 ' + d.students.length + '명 · 점수를 누르면 바로 시트에 저장돼요(누른 점수를 한 번 더 누르면 지워져요).');
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
  var sum = document.createElement('div'); sum.className = 'sum';
  function showSum(t, adj) { sum.textContent = '총점 ' + (t === '' ? 0 : t) + '점 · 보정 총점 ' + (adj === '' ? '-' : adj) + '점'; }
  d.units.forEach(function (u) {
    var g = document.createElement('div'); g.className = 'g';
    var b = document.createElement('b'); b.textContent = u.unit + ' (' + u.points + '점)'; g.appendChild(b);
    if (u.rubric) { var rb = document.createElement('details'); rb.className = 'rub'; var su = document.createElement('summary'); su.textContent = '채점 기준';
      var rd = document.createElement('div'); rd.textContent = u.rubric; rb.appendChild(su); rb.appendChild(rd); g.appendChild(rb); }
    var tx = document.createElement('div'), t = (s.texts || {})[u.unit] || '';
    tx.className = 'essay' + (t ? '' : ' empty'); tx.textContent = t || '(안 씀)'; g.appendChild(tx);
    var sc = document.createElement('div'); sc.className = 'sc';
    for (var p = 0; p <= u.points; p++) (function (p) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = p + '점';
      if (String(s.scores[u.unit]) === String(p)) bt.className = 'on';
      bt.onclick = function () {
        var clear = bt.className === 'on';
        Array.prototype.forEach.call(sc.children, function (x) { x.className = ''; }); if (!clear) bt.className = 'on';
        run('teacherScore', [d.form, s.key, u.unit, clear ? '' : p], function (r) { showSum(r.total, r.adjusted); });
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

/** 채점 시트 — 없으면 만들고 탭 5개(제출 · 채점 A형 · 채점 B형 · 결과 · 설정)를 갖춘다. 생기부 참고 탭은 처음 쓸 때 recTab_ 이 만든다 */
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
  ['A', 'B'].forEach((f) => { if (!ss.getSheetByName(tabGrade_(f))) gradeTab_SetupOnly_(ss, f); });
  if (!ss.getSheetByName(TAB_SET)) {
    const sh = ss.insertSheet(TAB_SET);
    sh.getRange(1, 1, 4, 3).setValues([
      ['보정 (채점 도우미에서 바꿈)', '값', '설명'],
      ['더할 점수 n', 0, '총점에 더하는 기본 점수'],
      ['최저 점수 x', '', '보정한 점수가 x 이하이면 x 점(비우면 제한 없음)'],
      ['최고 점수 y', '', '보정한 점수가 y 이상이면 y 점(비우면 제한 없음)'],
    ]);
    sh.getRange(SET_KEY_ROW - 1, 1, 1, 6).setValues([['형', '칸', '종류', '배점', '칸 이름', '채점 기준']]);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold'); sh.getRange(SET_KEY_ROW - 1, 1, 1, 6).setFontWeight('bold');
    sh.setColumnWidth(1, 170); sh.setColumnWidth(6, 520);
  }
  if (!ss.getSheetByName(TAB_RES)) rebuildResult_(ss);
  return ss;
}
function gradeTab_SetupOnly_(ss, f) {   // 설정 탭이 생기기 전에도 머리글(칸 없이)만 먼저
  const sh = insertBefore_(ss, tabGrade_(f), [TAB_RES, TAB_SET]);
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
