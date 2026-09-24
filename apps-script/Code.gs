/**
 * 신현중학교 정보 수업 활동지 — 작은 API (Google Apps Script 웹앱)
 *
 * 활동지 페이지(GitHub Pages)는 그대로 두고, "서버가 꼭 필요한 일"만 여기서 한다.
 *   GET  ?action=ping                    → 살아 있는지 확인 (브라우저 주소창에 붙여 넣어 보기)
 *   GET  ?action=neis&endpoint=…&…       → NEIS(나이스) 시간표·급식 조회를 인증키를 붙여 대신 해 줌
 *   POST {"action":"submit", …}          → 학생 PDF 를 드라이브 폴더에 저장 + 시트에 한 줄 기록
 *
 * 설정: 왼쪽 ⚙ 프로젝트 설정 → 스크립트 속성 (모두 선택 사항)
 *   NEIS_KEY      NEIS 인증키. 넣으면 시간표·급식을 5줄씩 나눠 받지 않고 한 번에 받음
 *   SUBMIT_TOKEN  site.config.json 의 submitToken 과 같은 아무 문자열. 다른 곳에서 마구 보내는 것을 줄여 줌
 *   FOLDER_ID     제출 PDF 를 모을 드라이브 폴더 ID. 비우면 "정보수업 제출" 폴더를 자동으로 만듦
 *   SHEET_ID      제출 기록 시트 ID. 비우면 위 폴더 안에 "정보수업 제출 기록" 시트를 자동으로 만듦
 *
 * 처음 한 번: 위쪽 함수 목록에서 setup 을 골라 ▶ 실행 → 권한 허용. (폴더·시트가 만들어지고 로그에 주소가 찍힘)
 * 배포 방법은 같은 폴더의 README.md 참고.
 */

const NEIS_ENDPOINTS = ['misTimetable', 'hisTimetable', 'mealServiceDietInfo', 'schoolInfo', 'SchoolSchedule'];
const MAX_PDF_BYTES = 20 * 1024 * 1024;   // 20MB 넘는 PDF 는 거절
const ROOT_FOLDER_NAME = '정보수업 제출';
const SHEET_NAME = '정보수업 제출 기록';
const HEADER = ['제출 시각', '차시', '활동지 제목', '학년', '반', '번호', '이름', '파일 이름', 'PDF 링크', '빈칸 답(JSON)'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'neis') return neis_(p);
  return json_({ ok: true, service: 'msi-api', time: new Date().toISOString() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'JSON 형식이 아니에요' }); }
  if (body.action === 'submit') return submit_(body);
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

  // 파일 이름 규칙: "20108 홍길동 활동지.pdf" (학년 1자리 + 반 2자리 + 번호 2자리) — 활동지의 PDF 버튼이 만드는 이름
  const m = filename.match(/^(?:(\d)(\d{2})(\d{2})\s+)?(.+?)\s*활동지/) || [];
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    sheet_(root).appendRow([
      new Date(), lesson, clean_(b.title || '', 80),
      m[1] || '', m[2] ? Number(m[2]) : '', m[3] ? Number(m[3]) : '', m[4] || '',
      filename, file.getUrl(), JSON.stringify(b.answers || {}).slice(0, 45000),
    ]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, file: file.getName() });
}

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
  return sh;
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function clean_(s, n) { return String(s).replace(/[\u0000-\u001f\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function text_(s) { return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON); }
