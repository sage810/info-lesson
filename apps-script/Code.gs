/**
 * 신현중학교 정보 수업 활동지 — 작은 API (Google Apps Script 웹앱)
 *
 * 활동지 페이지(GitHub Pages)는 그대로 두고, "서버가 꼭 필요한 일"만 여기서 한다.
 *   GET  ?action=ping                    → 살아 있는지 확인 (브라우저 주소창에 붙여 넣어 보기)
 *   GET  ?action=neis&endpoint=…&…       → NEIS(나이스) 시간표·급식 조회를 인증키를 붙여 대신 해 줌
 *   POST {"action":"submit", …}          → 학생 PDF 를 드라이브 폴더에 저장 + 시트에 한 줄 기록
 *                                          (수행평가는 학생 정보·칸별 답·저장 시각·그래프 작은 사본도 함께 — 출처 "웹"/"PDF")
 *   선생님 전용(TEACHER_KEY 가 맞을 때만):
 *   POST {"action":"setKey", key, lesson, rows} → "정답 <차시>" 탭 쓰기 (이 PC 의 npm run exam-key 가 보냄. 정답은 이 코드에 없다)
 *   GET  ?action=teacher&key=…            → 채점 도우미 페이지(채점하기 · 반별 그래프 모아보기 · 그래프 점수 입력)
 *
 * 설정: 왼쪽 ⚙ 프로젝트 설정 → 스크립트 속성 (모두 선택 사항)
 *   NEIS_KEY      NEIS 인증키. 넣으면 시간표·급식을 5줄씩 나눠 받지 않고 한 번에 받음
 *   SUBMIT_TOKEN  site.config.json 의 submitToken 과 같은 아무 문자열. 다른 곳에서 마구 보내는 것을 줄여 줌
 *   FOLDER_ID     제출 PDF 를 모을 드라이브 폴더 ID. 비우면 "정보수업 제출" 폴더를 자동으로 만듦
 *   SHEET_ID      제출 기록 시트 ID. 비우면 위 폴더 안에 "정보수업 제출 기록" 시트를 자동으로 만듦
 *   TEACHER_KEY   선생님만 아는 긴 문자열(저장소에 적지 않는다). 정답 보내기·채점 도우미에 필요. 비우면 그 기능은 꺼짐
 *
 * 처음 한 번: 위쪽 함수 목록에서 setup 을 골라 ▶ 실행 → 권한 허용. (폴더·시트가 만들어지고 로그에 주소가 찍힘)
 * 배포 방법은 같은 폴더의 README.md 참고.
 */

const NEIS_ENDPOINTS = ['misTimetable', 'hisTimetable', 'mealServiceDietInfo', 'schoolInfo', 'SchoolSchedule'];
const MAX_PDF_BYTES = 20 * 1024 * 1024;   // 20MB 넘는 PDF 는 거절
const ROOT_FOLDER_NAME = '정보수업 제출';
const SHEET_NAME = '정보수업 제출 기록';
const HEADER = ['제출 시각', '차시', '활동지 제목', '학년', '반', '번호', '이름', '파일 이름', 'PDF 링크', '빈칸 답(JSON)',
  '저장 시각', '출처', '그래프(JSON)'];   // 뒤 3칸은 수행평가 채점용(2026-10-04) — 예전 시트에는 머리글만 덧붙인다
const MAX_GRAPH_BYTES = 2 * 1024 * 1024;   // 그래프 작은 사본 한 장 한도

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'neis') return neis_(p);
  if (p.action === 'teacher') return teacherPage_(p.key);
  return json_({ ok: true, service: 'msi-api', time: new Date().toISOString() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'JSON 형식이 아니에요' }); }
  if (body.action === 'submit') return submit_(body);
  if (body.action === 'setKey') return setKey_(body);
  return json_({ ok: false, error: '알 수 없는 요청이에요' });
}

// ---------------------------------------------------------------- NEIS 프록시
function neis_(p) {
  const endpoint = String(p.endpoint || '');
  if (NEIS_ENDPOINTS.indexOf(endpoint) < 0) return json_({ ok: false, error: '허용되지 않은 NEIS 항목이에요' });
  const q = [];
  Object.keys(p).forEach(function (k) {
    if (['action', 'endpoint', 'KEY'].indexOf(k) < 0) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(p[k]));
  });
  const key = prop_('NEIS_KEY');
  if (key) q.push('KEY=' + encodeURIComponent(key));
  const url = 'https://open.neis.go.kr/hub/' + endpoint + '?' + q.join('&');

  const cache = CacheService.getScriptCache();
  const ck = 'neis:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, url));
  const hit = cache.get(ck);
  if (hit) return text_(hit);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const txt = res.getContentText('UTF-8');
  if (res.getResponseCode() === 200 && txt.length < 90000) cache.put(ck, txt, 600); // 10분 캐시(항목당 100KB 한도)
  return text_(txt);
}

// ---------------------------------------------------------------- 제출
function submit_(b) {
  const token = prop_('SUBMIT_TOKEN');
  if (token && b.token !== token) return json_({ ok: false, error: '제출 토큰이 맞지 않아요' });
  if (!b.pdf) return json_({ ok: false, error: 'PDF 가 비어 있어요' });
  const bytes = Utilities.base64Decode(b.pdf);
  if (bytes.length > MAX_PDF_BYTES) return json_({ ok: false, error: '파일이 너무 커요' });

  const lesson = clean_(String(b.lesson || '기타').replace(/\//g, '-'), 60);   // "data-analysis/06" → "data-analysis-06"
  const filename = clean_(b.filename || '활동지.pdf', 120);
  const root = rootFolder_();
  const folder = subFolder_(root, lesson);
  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd-HHmmss');
  const file = folder.createFile(Utilities.newBlob(bytes, 'application/pdf', stamp + ' ' + filename));

  // 학생 정보: 활동지가 보낸 student 를 먼저, 없으면 파일 이름 규칙 "20108 홍길동 활동지.pdf"(학년 1 + 반 2 + 번호 2)에서
  const m = filename.match(/^(?:(\d)(\d{2})(\d{2})\s+)?(.+?)\s*활동지/) || [];
  const st = b.student || {};
  const num = (v) => { const d = String(v == null ? '' : v).replace(/[^0-9]/g, ''); return d ? Number(d) : ''; };
  const grade = st.grade != null && String(st.grade).trim() ? num(st.grade) : (m[1] || '');
  const cls = st.cls != null && String(st.cls).trim() ? num(st.cls) : (m[2] ? Number(m[2]) : '');
  const no = st.no != null && String(st.no).trim() ? num(st.no) : (m[3] ? Number(m[3]) : '');
  const name = st.name ? clean_(st.name, 40) : (m[4] || '');

  // 그래프 작은 사본(채점 도우미의 반별 모아보기용) → <차시>/그래프/ 폴더
  const graphIds = {};
  const graphs = b.graphs || {};
  const gUnits = Object.keys(graphs).slice(0, 6);
  if (gUnits.length) {
    const gFolder = subFolder_(folder, '그래프');
    gUnits.forEach((u) => {
      const g = String(graphs[u] || '').match(/^data:image\/(jpeg|png);base64,(.+)$/);
      if (!g) return;
      const gBytes = Utilities.base64Decode(g[2]);
      if (gBytes.length > MAX_GRAPH_BYTES) return;
      const gName = stamp + ' ' + clean_(u, 20) + ' ' + filename.replace(/\.pdf$/i, '') + (g[1] === 'png' ? '.png' : '.jpg');
      graphIds[u] = gFolder.createFile(Utilities.newBlob(gBytes, 'image/' + g[1], gName)).getId();
    });
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    sheet_(root).appendRow([
      new Date(), lesson, clean_(b.title || '', 80),
      grade, cls, no, name,
      filename, file.getUrl(), JSON.stringify(b.answers || {}).slice(0, 45000),
      b.savedAt ? String(b.savedAt).slice(0, 40) : '', b.source === 'pdf' ? 'PDF' : '웹',
      Object.keys(graphIds).length ? JSON.stringify(graphIds) : '',
    ]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, file: file.getName() });
}

// ---------------------------------------------------------------- 수행평가 채점 (선생님 전용 — TEACHER_KEY)
// 탭 이름: "정답 <차시>"(npm run exam-key 가 씀) · "채점 <차시>" · "그래프 점수 <차시>" · "문항 분석 <차시>"
// <차시> 는 제출 시트의 "차시" 칸과 같은 모양(data-analysis-09).
// 칸 종류(kind): one 하나 고르기 · set 여러 개 고르기(순서 무관) · order 순서 · text 글자(앞뒤 공백·대소문자 무시, 허용 답 목록) · graph 직접 채점

function teacherOk_(key) { const k = prop_('TEACHER_KEY'); return !!k && String(key || '') === k; }
function lessonName_(s) { return clean_(String(s || '').replace(/\//g, '-'), 60); }
function book_() { return sheet_(rootFolder_()).getParent(); }
function tab_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name, ss.getNumSheets()); }   // 맨 뒤에 — 첫 탭은 늘 "제출 기록"

function setKey_(b) {
  if (!teacherOk_(b.key)) return json_({ ok: false, error: '선생님 열쇠(TEACHER_KEY)가 맞지 않아요' });
  const lesson = lessonName_(b.lesson);
  const rows = (b.rows || []).map((r) => [String(r.unit), String(r.kind), String(r.answer == null ? '' : r.answer),
    (r.accept || []).join(' | '), Number(r.points) || 0, String(r.label || '')]);
  if (!rows.length) return json_({ ok: false, error: '정답 줄이 비어 있어요' });
  const sh = tab_(book_(), '정답 ' + lesson);
  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues([['칸', '종류', '정답', '허용 답(| 로 구분)', '배점', '칸 이름']]).setFontWeight('bold');
  sh.getRange(2, 1, rows.length, 6).setNumberFormat('@').setValues(rows);
  sh.setFrozenRows(1);
  return json_({ ok: true, lesson: lesson, rows: rows.length, points: rows.reduce((s, r) => s + r[4], 0) });
}

// ---- 순수 함수(시트·드라이브를 쓰지 않음) ----
function norm_(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
function digits_(s) { return String(s == null ? '' : s).replace(/[^0-9]/g, ''); }
function studentKey_(s) { return [digits_(s.grade), digits_(s.cls), digits_(s.no), String(s.name || '').trim()].join('|'); }

/** 한 칸 채점: true 맞음 · false 틀림/빈칸 · null 직접 채점(graph) */
function scoreUnit_(k, value) {
  if (k.kind === 'graph') return null;
  const v = norm_(value);
  if (!v) return false;
  if (k.kind === 'set') {
    const sort = (s) => norm_(s).split(',').map((x) => x.trim()).filter(Boolean).sort().join(',');
    return sort(value) === sort(k.answer);
  }
  if (k.kind === 'text') return [k.answer].concat(k.accept || []).map(norm_).filter(Boolean).indexOf(v) >= 0;
  return v === norm_(k.answer);   // one · order
}

/** 같은 학생(학년·반·번호·이름)은 저장 시각이 가장 늦은 것 하나만 */
function pickLatest_(subs) {
  const best = {};
  subs.forEach((s) => {
    const key = studentKey_(s);
    const t = Date.parse(s.savedAt) || Date.parse(s.submittedAt) || 0;
    if (!best[key] || t >= best[key]._t) { s._t = t; best[key] = s; }
  });
  return Object.keys(best).map((k) => best[k]);
}

/** 채점 표 만들기 — keyRows: [{unit,kind,answer,accept,points,label}], subs: pickLatest_ 결과 */
function buildGrade_(keyRows, subs) {
  const sorted = subs.slice().sort((a, b) =>
    (Number(digits_(a.grade)) || 999) - (Number(digits_(b.grade)) || 999) ||   // 학년 → 반 → 번호 → 이름 순
    (Number(digits_(a.cls)) || 999) - (Number(digits_(b.cls)) || 999) ||
    (Number(digits_(a.no)) || 999) - (Number(digits_(b.no)) || 999) ||
    String(a.name).localeCompare(String(b.name), 'ko'));
  const nameCount = {};
  sorted.forEach((s) => { const n = String(s.name || '').trim(); nameCount[n] = (nameCount[n] || 0) + 1; });
  const auto = keyRows.filter((k) => k.kind !== 'graph');
  const stats = keyRows.map(() => ({ right: 0, tried: 0 }));
  const students = sorted.map((s) => {
    const marks = keyRows.map((k, i) => {
      const value = String((s.answers || {})[k.unit] == null ? '' : s.answers[k.unit]).trim();
      const ok = scoreUnit_(k, value);
      if (ok !== null) { if (value) stats[i].tried++; if (ok) stats[i].right++; }
      return { unit: k.unit, value: value, ok: ok, points: Number(k.points) || 0 };
    });
    const score = marks.reduce((t, m) => t + (m.ok ? m.points : 0), 0);
    const flags = [];
    if (!digits_(s.cls) || !digits_(s.no)) flags.push('반·번호 없음');
    if (nameCount[String(s.name || '').trim()] > 1) flags.push('같은 이름');
    return { key: studentKey_(s), sub: s, marks: marks, score: score, flags: flags };
  });
  const analysis = keyRows.map((k, i) => ({ unit: k.unit, kind: k.kind, points: Number(k.points) || 0,
    right: stats[i].right, tried: stats[i].tried, total: students.length,
    rate: k.kind === 'graph' || !students.length ? '' : Math.round(stats[i].right / students.length * 100) }));
  return { students: students, analysis: analysis, autoMax: auto.reduce((t, k) => t + (Number(k.points) || 0), 0) };
}

// ---- 시트 읽기·쓰기 ----
function readKey_(ss, lesson) {
  const sh = ss.getSheetByName('정답 ' + lesson);
  if (!sh || sh.getLastRow() < 2) throw new Error('"정답 ' + lesson + '" 탭이 없어요. 이 PC 에서 npm run exam-key 를 --send 로 먼저 보내 주세요.');
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getDisplayValues().filter((r) => r[0]).map((r) => ({
    unit: r[0], kind: r[1], answer: r[2], accept: r[3] ? r[3].split('|').map((x) => x.trim()).filter(Boolean) : [], points: Number(r[4]) || 0, label: r[5],
  }));
}
function readSubs_(ss, lesson) {
  const sh = ss.getSheets()[0];
  const v = sh.getDataRange().getValues();
  const h = v[0].map(String), col = (n) => h.indexOf(n);
  const at = { t: col('제출 시각'), l: col('차시'), g: col('학년'), c: col('반'), n: col('번호'), nm: col('이름'), pdf: col('PDF 링크'),
    a: col('빈칸 답(JSON)'), s: col('저장 시각'), src: col('출처'), gr: col('그래프(JSON)') };
  const parse = (x) => { try { return JSON.parse(x || '{}') || {}; } catch (e) { return {}; } };
  return v.slice(1).filter((r) => String(r[at.l]) === lesson).map((r) => ({
    submittedAt: r[at.t] instanceof Date ? r[at.t].toISOString() : String(r[at.t]),
    grade: r[at.g], cls: r[at.c], no: r[at.n], name: String(r[at.nm] || ''), pdf: r[at.pdf], answers: parse(r[at.a]),
    savedAt: at.s >= 0 ? String(r[at.s] || '') : '', source: at.src >= 0 ? String(r[at.src] || '') : '', graphs: at.gr >= 0 ? parse(r[at.gr]) : {},
  }));
}
function scoreTab_(ss, lesson, graphUnits) {
  const sh = tab_(ss, '그래프 점수 ' + lesson);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 5 + graphUnits.length).setValues([['학생 키', '학년', '반', '번호', '이름'].concat(graphUnits)]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function grade_(lesson) {
  const ss = book_();
  const keyRows = readKey_(ss, lesson);
  const g = buildGrade_(keyRows, pickLatest_(readSubs_(ss, lesson)));
  const graphUnits = keyRows.filter((k) => k.kind === 'graph').map((k) => k.unit);
  scoreTab_(ss, lesson, graphUnits);
  const sName = "'그래프 점수 " + lesson + "'";

  const sh = tab_(ss, '채점 ' + lesson);
  sh.clear();
  // 총점은 이름 바로 옆(E열)에 — 칸별 ○/✕ 를 넘겨 보지 않아도 점수가 한눈에 보이게(2026-10-12)
  const head = ['학년', '반', '번호', '이름', '총점', '저장 시각', '출처', 'PDF']
    .concat(keyRows.map((k) => k.kind === 'graph' ? k.unit + ' (직접)' : k.unit))
    .concat(['자동 점수(' + g.autoMax + ')', '직접 점수', '확인', '학생 키']);
  const nU = keyRows.length, cAuto = 9 + nU, cKey = cAuto + 3;
  const colA1 = (c) => { let s = ''; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
  const rows = [], bgs = [];
  g.students.forEach((st, i) => {
    const r = i + 2, s = st.sub;
    const manualCells = [];
    const cells = st.marks.map((m, j) => {
      if (m.ok === null) {
        manualCells.push(colA1(9 + j) + r);
        const gi = graphUnits.indexOf(m.unit);
        return '=IFERROR(INDEX(' + sName + '!' + colA1(6 + gi) + ':' + colA1(6 + gi) + ',MATCH($' + colA1(cKey) + r + ',' + sName + '!A:A,0)),"")';
      }
      return (m.ok ? '○ ' : '✕ ') + (m.value || '(안 씀)');
    });
    const pdf = s.pdf ? '=HYPERLINK("' + String(s.pdf).replace(/"/g, '') + '","PDF")' : '';
    rows.push([s.grade, s.cls, s.no, s.name, '=' + colA1(cAuto) + r + '+N(' + colA1(cAuto + 1) + r + ')',
      s.savedAt || s.submittedAt, s.source || '웹', pdf].concat(cells).concat([
      st.score, manualCells.length ? '=SUM(' + manualCells.join(',') + ')' : 0,
      st.flags.join(', '), st.key]));
    bgs.push(new Array(8).fill(st.flags.length ? '#fff4c2' : null)
      .concat(st.marks.map((m) => m.ok === null ? '#eef0fb' : m.ok ? '#e3f4e1' : '#fbe3e3'))
      .concat([null, null, st.flags.length ? '#fff4c2' : null, null]));
  });
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (rows.length) {
    sh.getRange(2, 1, rows.length, head.length).setValues(rows);
    sh.getRange(2, 1, rows.length, head.length).setBackgrounds(bgs);
  }
  if (rows.length) sh.getRange(2, 5, rows.length, 1).setFontWeight('bold');   // 총점
  sh.setFrozenRows(1); sh.setFrozenColumns(5);
  sh.hideColumns(cKey);

  const an = tab_(ss, '문항 분석 ' + lesson);
  an.clear();
  an.getRange(1, 1, 1, 6).setValues([['칸', '종류', '배점', '맞은 학생', '학생 수', '정답률(%)']]).setFontWeight('bold');
  if (g.analysis.length) an.getRange(2, 1, g.analysis.length, 6).setValues(g.analysis.map((a) =>
    [a.unit, a.kind === 'graph' ? '직접' : a.kind, a.points, a.kind === 'graph' ? '' : a.right, a.total, a.rate]));

  const n = g.students.length;
  return { lesson: lesson, students: n, autoMax: g.autoMax,
    autoAvg: n ? Math.round(g.students.reduce((t, s) => t + s.score, 0) / n * 10) / 10 : 0,
    flagged: g.students.filter((s) => s.flags.length).length, url: ss.getUrl() + '#gid=' + sh.getSheetId() };
}

// ---- 채점 도우미 페이지(google.script.run 으로 부르는 함수 — 모두 열쇠 확인) ----
function teacherPage_(key) {
  if (!teacherOk_(key)) return HtmlService.createHtmlOutput('<p style="font:16px sans-serif">선생님 열쇠가 맞지 않거나 TEACHER_KEY 가 설정되지 않았어요.</p>');
  return HtmlService.createHtmlOutput(TEACHER_HTML.replace('__KEY__', () => JSON.stringify(String(key))))
    .setTitle('수행평가 채점 도우미').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function guard_(key) { if (!teacherOk_(key)) throw new Error('선생님 열쇠가 맞지 않아요'); }
function teacherLessons(key) {
  guard_(key);
  return book_().getSheets().map((s) => s.getName()).filter((n) => n.indexOf('정답 ') === 0).map((n) => n.slice(3));
}
function teacherGrade(key, lesson) { guard_(key); return grade_(lessonName_(lesson)); }
function teacherGallery(key, lesson, cls) {
  guard_(key);
  lesson = lessonName_(lesson);
  const ss = book_();
  const keyRows = readKey_(ss, lesson);
  const manual = keyRows.filter((k) => k.kind === 'graph').map((k) => ({ unit: k.unit, points: k.points }));
  const latest = pickLatest_(readSubs_(ss, lesson));
  const classes = Array.from(new Set(latest.map((s) => digits_(s.cls) || '?'))).sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  const sh = scoreTab_(ss, lesson, manual.map((m) => m.unit));
  const sv = sh.getDataRange().getValues(), sh0 = sv[0].map(String), scores = {};
  sv.slice(1).forEach((r) => { const o = {}; manual.forEach((m) => { const c = sh0.indexOf(m.unit); if (c >= 0 && r[c] !== '') o[m.unit] = r[c]; }); scores[r[0]] = o; });
  const want = String(cls || classes[0] || '');
  const list = latest.filter((s) => (digits_(s.cls) || '?') === want)
    .sort((a, b) => (Number(digits_(a.no)) || 999) - (Number(digits_(b.no)) || 999) || String(a.name).localeCompare(String(b.name), 'ko'))
    .map((s) => ({ key: studentKey_(s), grade: s.grade, cls: s.cls, no: s.no, name: s.name, pdf: s.pdf, graphs: s.graphs || {}, scores: scores[studentKey_(s)] || {} }));
  return { lesson: lesson, manual: manual, classes: classes, cls: want, students: list };
}
function teacherImage(key, id) {
  guard_(key);
  const blob = DriveApp.getFileById(id).getBlob();
  return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
}
function teacherScore(key, lesson, skey, unit, score, info) {
  guard_(key);
  lesson = lessonName_(lesson);
  const ss = book_();
  const manual = readKey_(ss, lesson).filter((k) => k.kind === 'graph').map((k) => k.unit);
  const sh = scoreTab_(ss, lesson, manual);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const c = head.indexOf(unit);
  if (c < 0) throw new Error('그래프 점수 탭에 "' + unit + '" 칸이 없어요');
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const keys = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map((r) => String(r[0])) : [];
    let r = keys.indexOf(String(skey)) + 2;
    if (r < 2) { r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, 5).setValues([[skey, info.grade || '', info.cls || '', info.no || '', info.name || '']]); }
    sh.getRange(r, c + 1).setValue(score === '' || score == null ? '' : Number(score));
  } finally { lock.releaseLock(); }
  return true;
}

const TEACHER_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
body{margin:0;padding:16px;font:15px/1.6 'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#4b3b6b;background:#f4f2fa}
h1{margin:0 0 12px;font-size:20px} .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
select,button{font:inherit;padding:6px 12px;border:2px solid #4b3b6b;border-radius:8px;background:#fff;color:#4b3b6b;cursor:pointer}
button.main{background:#c4cce8;font-weight:700} button:disabled{opacity:.5;cursor:wait}
#msg{margin:0 0 12px;padding:10px 12px;border:2px solid #4b3b6b;border-radius:10px;background:#fff}
#msg:empty{display:none} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
.card{padding:10px;border:2px solid #4b3b6b;border-radius:12px;background:#fff}
.card h3{margin:0 0 6px;font-size:15px} .g{margin-top:8px} .g b{display:block;font-size:13px}
.g img{display:block;width:100%;min-height:60px;border:1px solid #d8d2ee;border-radius:6px;background:#faf9fd}
.none{padding:12px;border:1px dashed #b9b0d3;border-radius:6px;font-size:13px;color:#6b5b93}
.sc{display:flex;gap:6px;margin-top:6px} .sc button{min-width:40px;padding:4px 10px}
.sc button.on{background:#4b3b6b;color:#fff} a{color:#6b5b93}
</style></head><body>
<h1>수행평가 채점 도우미</h1>
<div class="bar"><label>차시 <select id="lesson"></select></label>
<button class="main" id="gradeBtn">채점하기</button>
<label>반 <select id="cls"></select></label> <button id="loadBtn">그래프 보기</button></div>
<p id="msg"></p><div class="grid" id="grid"></div>
<script>
var KEY = __KEY__, $ = function (id) { return document.getElementById(id); };
function run(fn, args, ok) {
  var r = google.script.run.withSuccessHandler(ok).withFailureHandler(function (e) { say('⚠ ' + (e && e.message || e)); busy(false); });
  r[fn].apply(r, [KEY].concat(args));
}
function say(t, html) { if (html) $('msg').innerHTML = t; else $('msg').textContent = t; }
function busy(b) { ['gradeBtn', 'loadBtn'].forEach(function (id) { $(id).disabled = b; }); }
function opt(sel, list, cur) { sel.innerHTML = ''; list.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v === '?' ? '반 없음' : v; if (v === cur) o.selected = true; sel.appendChild(o); }); }
run('teacherLessons', [], function (list) {
  if (!list.length) { say('정답 탭이 없어요. 이 PC 에서 npm run exam-key -- <차시> --send 로 정답을 먼저 보내 주세요.'); return; }
  opt($('lesson'), list, list[0]); load('');
});
$('lesson').onchange = function () { load(''); };
$('gradeBtn').onclick = function () {
  busy(true); say('채점하는 중…');
  run('teacherGrade', [$('lesson').value], function (r) {
    busy(false);
    say('✔ ' + r.students + '명 채점 · 자동 점수 평균 ' + r.autoAvg + ' / ' + r.autoMax + (r.flagged ? ' · 확인 필요 ' + r.flagged + '명(노란 줄)' : '')
      + ' · <a href="' + r.url + '" target="_blank">채점 시트 열기</a>', true);
  });
};
$('loadBtn').onclick = function () { load($('cls').value); };
function load(cls) {
  busy(true); $('grid').innerHTML = '';
  run('teacherGallery', [$('lesson').value, cls], function (d) {
    busy(false); opt($('cls'), d.classes, d.cls);
    if (!d.students.length) { say('이 반에 제출한 학생이 없어요.'); return; }
    say(d.cls + '반 ' + d.students.length + '명 · 점수를 누르면 바로 시트에 저장돼요(채점 탭 총점에 바로 반영).');
    d.students.forEach(function (s) { $('grid').appendChild(card(d, s)); });
  });
}
function card(d, s) {
  var c = document.createElement('div'); c.className = 'card';
  var h = document.createElement('h3'); h.textContent = (s.cls || '?') + '반 ' + (s.no || '?') + '번 ' + s.name; c.appendChild(h);
  d.manual.forEach(function (m) {
    var g = document.createElement('div'); g.className = 'g';
    var b = document.createElement('b'); b.textContent = m.unit + ' (' + m.points + '점)'; g.appendChild(b);
    var id = s.graphs[m.unit];
    if (id) { var im = document.createElement('img'); im.alt = s.name + ' ' + m.unit + ' 그래프'; g.appendChild(im);
      run('teacherImage', [id], function (url) { im.src = url; }); }
    else { var n = document.createElement('div'); n.className = 'none'; n.innerHTML = '그래프 사본 없음' + (s.pdf ? ' · <a target="_blank" href="' + s.pdf + '">PDF 열기</a>' : ''); g.appendChild(n); }
    var sc = document.createElement('div'); sc.className = 'sc';
    for (var p = 0; p <= m.points; p++) (function (p) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = p + '점';
      if (String(s.scores[m.unit]) === String(p)) bt.className = 'on';
      bt.onclick = function () {
        Array.prototype.forEach.call(sc.children, function (x) { x.className = ''; }); bt.className = 'on';
        run('teacherScore', [d.lesson, s.key, m.unit, p, { grade: s.grade, cls: s.cls, no: s.no, name: s.name }], function () {});
      };
      sc.appendChild(bt);
    })(p);
    g.appendChild(sc); c.appendChild(g);
  });
  return c;
}
</script></body></html>`;

// ---------------------------------------------------------------- 처음 한 번 실행
function setup() {
  const root = rootFolder_();
  const sh = sheet_(root);
  Logger.log('제출 폴더: ' + root.getUrl());
  Logger.log('제출 기록 시트: ' + sh.getParent().getUrl());
  Logger.log('이제 배포 → 새 배포 → 웹 앱 으로 배포하세요.');
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

function subFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function sheet_(root) {
  let id = prop_('SHEET_ID');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  }
  const sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) { sh.appendRow(HEADER); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < HEADER.length) {   // 예전 시트: 새 머리글(저장 시각·출처·그래프)만 뒤에 덧붙임
    sh.getRange(1, sh.getLastColumn() + 1, 1, HEADER.length - sh.getLastColumn()).setValues([HEADER.slice(sh.getLastColumn())]);
  }
  return sh;
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function clean_(s, n) { return String(s).replace(/[\u0000-\u001f\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function text_(s) { return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON); }
