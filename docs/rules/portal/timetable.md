# 시간표 탭 — 재현 명세

> 📌 **구조 개편(2026-09-24) 전에 쓴 문서입니다.** 본문 속 `output/dataN.html`·`data4_1.html` 같은 이름은 지금의 `lessons/<단원>/<차시>/lesson.html` 에 해당하고, 폰트·라이브러리·이미지는 빌드 때 자동으로 인라인됩니다(`npm run build`). 여기 적힌 **디자인·동작 규칙**은 그대로 유효합니다.


`output/data4.html` 의 두 번째 탭(`🕒 시간표`). 다른 AI 에이전트가 이 문서만 보고 동일한 결과를 만들 수 있도록 정리한다.
시각 토큰·컴포넌트의 근거는 `docs/rules/design.md`. 상단 창 껍데기는 `docs/rules/portal/rule.md` §2 참고.

---

## 1. 개요

- **위치**: `<sc-if value="{{ isTime }}">` 블록. `state.tab === 'time'` 일 때 렌더.
- **성격**: 신현중학교(경기도교육청) **실데이터**. NEIS(나이스) 교육정보 개방 포털 `open.neis.go.kr/hub` 를 브라우저에서 직접 호출.
  - 학교 식별자: `ATPT_OFCDC_SC_CODE = J10`, `SD_SCHUL_CODE = 7692151`
  - 엔드포인트: `misTimetable`(중학교시간표), `classInfo`(학급), `schoolInfo`(학교)
- **3가지 보기**: 일간 / 주간 / 월간 (`state.timeView` = `'day'|'week'|'month'`, 기본 `'day'`)
- **학년/반 선택**: `GRADE`(1~3), `CLASS`(학년별 최대 1:9, 2:11, 3:12반). `state.grade`, `state.cls`.

---

## 2. 데이터 파이프라인

### 2.1 두 단계 (스냅샷 → 실시간)

1. **스냅샷(즉시 렌더용)**: `<script type="application/json" id="neis-snapshot">` 안에 미리 받아 둔 JSON.
   - 마커 `/*NEIS_SNAPSHOT_START*/ … /*NEIS_SNAPSHOT_END*/` 사이를 `scripts/build-webapp-data.ps1` 이 채운다. 원본 데이터는 `scripts/fetch-neis.ps1`(인증키 사용, `scripts/neis.local.ps1` 은 gitignore) 이 `data/timetable.json` 등으로 저장.
   - 구조: `{ timetable: { "<학년>": { "<반>": { "YYYY-MM-DD": { "periods": [과목,…] } | { "holiday": "…" } } } }, meal: {…} }`
   - 범위: 이번 주 월요일부터 4주치(주말 제외).
   - `readSnapshot()` 이 `/* */` 주석 제거 후 `JSON.parse`. `snapTimetable(grade,cls)` 가 `{ "YYYY-MM-DD": { 교시(1-based): 과목 } }` 로 변환.
2. **실시간 갱신**: `componentDidMount` 및 학년/반 변경 시 `loadTimetable(grade,cls)` → `neisFetchAll('misTimetable', { GRADE, CLASS_NM, TI_FROM_YMD, TI_TO_YMD })`.
   - 창: `mondayOf(오늘)` ~ `+27일`.
   - 받은 행으로 **스냅샷 위에 덮어씀**(빈 교시만 채움; 이미 값 있으면 유지 = NEIS 가 같은 교시를 빈값+실값으로 중복해서 줄 때 실값 우선).
   - 응답이 오면 요청 당시 학년/반이 아직 화면 학년/반과 같을 때만 `setState`.

### 2.2 무인증 5행/페이지 함정 (중요)

`open.neis.go.kr/hub` 는 CORS 를 허용(`Access-Control-Allow-Origin: *`)해 브라우저 직접 호출이 되지만, **인증키 없이 부르면 `pSize` 를 무시하고 한 페이지에 5행만** 준다(`list_total_count` 는 정확). 그래서:
- `neisPage(endpoint, params, pIndex)` → 1페이지 요청. `window.NEIS_KEY`(gitignore된 `output/neis.config.js` 가 정의) 가 있으면 `KEY` 를 붙여 `pSize=100` 으로 한 번에.
- `neisFetchAll` → `pIndex` 를 1,2,3… 늘려가며 `acc.length < total` 이고 빈 페이지 아닐 때까지 이어 받는다(최대 40페이지).
- 응답 shape: `j[endpoint][0].head[1].RESULT.CODE` 가 `INFO-000`(정상) / `INFO-200`(데이터 없음). 그 외면 빈 배열.

---

## 3. 상수 (data4.html `<script type="text/x-dc">` 상단)

```js
const PERIODS = [ // [라벨, 시작, 영문, 끝]
  ['1교시','09:00','1ST','09:45'], ['2교시','09:55','2ND','10:40'],
  ['3교시','10:50','3RD','11:35'], ['4교시','11:45','4TH','12:35'],
  ['5교시','13:35','5TH','14:20'], ['6교시','14:30','6TH','15:15'],
  ['7교시','15:25','7TH','16:10'],
];
const DAYS = ['월','화','수','목','금'];          // 주간/월간은 월~금만
```

### 3.1 과목 색 (파스텔)

`subColor(과목명)`:
1. 빈 값 → `#f1edf9`
2. `SUB_COLOR_EXT` 에 있으면 그 색. (`SUB_COLOR` = design.md §4.2 + 아래 확장)
   - 국어 `#f9cade` · 수학 `#c4d8f7` · 영어 `#fbe6a2` · 과학 `#bfe9dd` · 사회 `#e8d9b8` · 역사/한국사 `#f7bfb2` · 도덕 `#eec6ea` · 체육 `#c9e8b8` · 음악 `#d6c4f5` · 미술 `#ffe0cc` · 한문 `#cfeaf5` · 정보 `#a9dce4` · 진로(진로활동/진로와 직업) `#9db2f2` · 보건 `#f5b7c8`
   - `기술·가정`/`기술가정`/`가정`/`기술` `#d8f0c4` · `자율·자치활동`/`자율`/`자치활동` `#e3e0b0` · `동아리활동` `#c9c2ea` · `창의적체험활동` `#c9c2ea` · `학교스포츠클럽`/`스포츠클럽` `#c9e8b8`
3. 없으면 이름 해시로 `SUB_PALETTE`(12색: `#f9cade #c4d8f7 #fbe6a2 #bfe9dd #e8d9b8 #f7bfb2 #eec6ea #d8f0c4 #a9dce4 #d6c4f5 #ffe0cc #cfeaf5`) 중 배정 → 미등록 과목도 항상 색이 나온다.

### 3.2 진행 상태 (색 + 글자, design.md §2.1)

현재 시각(`nowMin()` = 분, `state.now` 는 60초마다 갱신)과 `PERIODS` 종료 시각 비교:
- **완료** (past): `background:#ece9f3; color:#8a82a6`, 그 행/셀 `opacity` 낮춤 + `filter:saturate` 낮춤
- **진행 중** (live, 시작~끝 사이): `background:#7b5cd6; color:#fffdf7; boxShadow:0 2px 6px rgba(123,92,214,.35)`, 행 배경 `#f6f2ff`
- **예정** (upcoming): `background:#fffdf7; color:#7b6ba8; border:2px dashed #cfc6e6`

### 3.3 조회 헬퍼

- `subjectOn(dateObj, p)` — 특정 날짜 `p`(**0-based**) 교시 과목. `state.tt[ymd(dateObj)][p+1] || ''`
- `subjectAt(d, p)` — 이번 주 월요일 기준 `d`(0=월…4=금) 요일의 `p`(0-based) 교시. 내부적으로 `subjectOn`.

---

## 4. 화면 구성

바깥 `display:flex; flexDirection:column; gap:18px`.

### 4.1 헤더 줄 (가운데 정렬)

- 첫 줄: `시간표`(`GangwonEdu 30px`) + 픽셀 태그 `TIMETABLE`(`Silkscreen 11px; background:#c4d8f7; border:3px solid #4b3b6b; borderRadius:6px`)
- **다음 줄**(2026-09-30): 오늘 날짜 배지 `{{ todayLabel }}` → `"2026년 9월 3일 (목)"` 형식.
  `border:3px solid #4b3b6b; borderRadius:10px; background:#fffdf7; CookieRun 700 16px; boxShadow:3px 3px 0 …; alignSelf:center; marginTop:-8px`
  (제목 줄 `div` 가 닫힌 **뒤**에 둔다. 옛 모양(제목 옆)은 `npm run portal-upgrade` 가 옮긴다)
- 월간 보기의 `monthGrid(fn)` 는 달을 안 주면 예전처럼 2026년 9월이다(급식 월간만 `monthGrid(fn, 연, 월)` 로 달을 넘김 — lunch.md §5.5).

### 4.2 학년/반 선택 박스

- 박스: `border:3px solid #4b3b6b; borderRadius:14px; background:#f7f4fd; padding:12px 22px; display:flex; gap:18px; justifyContent:center; boxShadow:5px 5px 0 …; alignSelf:center`
- `GRADE`(Silkscreen 11px) + `<select value="{{ gradeVal }}" onChange="{{ setGrade }}">` → `gradeOpts` = `[{value:'1',label:'1학년'}, …3]`
- `CLASS` + `<select value="{{ classVal }}" onChange="{{ setCls }}">` → `classOpts` = `CLASS_MAX[grade]` 개수만큼 `{value, label:'N반'}`. `CLASS_MAX = {1:9, 2:11, 3:12}`
- select 스타일: `appearance:none` + 커스텀 삼각형(겹친 `linear-gradient`), `CookieRun 700 16px`, `border:3px solid #4b3b6b; borderRadius:10px; boxShadow:3px 3px 0 …`
- `setGrade` 는 학년 바꾸면 `cls` 를 새 학년 최대 반으로 clamp 후 `loadTimetable` 재호출. `setCls` 도 `loadTimetable` 재호출.

### 4.3 보기 전환 칩 (일간/주간/월간)

`timeViews` = `[['day','일간'],['week','주간'],['month','월간']]` 을 `chip(active, pal)`(design.md §3.7) 로. `pal` = `props.accent ?? '#f7a8c4'`. 클릭 시 `setState({ timeView })`.

### 4.4 일간 보기 (`timeIsDay`)

- 컨테이너: `maxWidth:560px; border:3px solid #4b3b6b; borderRadius:12px; overflow:hidden; background:#fffdf7; boxShadow:5px 5px 0 …`
- `dayRows` 를 행으로. 각 행 `rowStyle` = `display:grid; gridTemplateColumns:88px 1fr; borderBottom:2px dashed …`
  - 왼쪽 셀(`88px`, `background:#f7f4fd`, `borderRight:3px solid #4b3b6b`): `period`(CookieRun 700 15px) / `time`(Silkscreen 8px `#8b7cb8`) / `endTime`(Silkscreen 8px `#a89cc4`, 값에 `~` 접두 포함)
  - 오른쪽 셀: 과목 태그(`tagStyle`, `border:2px solid #4b3b6b; borderRadius:8px; CookieRun 700 17px; background:subColor`) + 여백 + 상태 배지(`statusStyle` / `statusLabel`)
- **데이터**: `renderVals` 가 `todayObj = 오늘` 로 `PERIODS` 를 map 하며 `subjectOn(todayObj, i)` 조회. 과목 없으면 `subject` = `'—'`.

### 4.5 주간 보기 (`timeIsWeek`)

- 래퍼: `border:3px solid #4b3b6b; borderRadius:12px; overflow:hidden; boxShadow:5px 5px 0 …`
- 헤더 행: `display:grid; gridTemplateColumns:78px repeat(5,1fr); background:#d6c4f5; borderBottom:3px solid #4b3b6b`
  - 첫 칸 `TIME`(Silkscreen 10px), 이후 `weekHeads` 5개 → `label`(`"월요일"`, CookieRun 700 16px) + `date`(`"8월 31일"`, Maplestory 700 12px `#5a4a86`)
- 본문 행: `weekRows` = `PERIODS` map. 각 행 `gridTemplateColumns:78px repeat(5,1fr); borderBottom:2px dashed rgba(75,59,107,.3)`
  - 왼쪽 시간 칸(위 일간과 동일 구성, `~{{ row.endTime }}`)
  - `cells` 5개(월~금) — `subjectAt(d, i)`. 각 셀 `style` = `border:3px solid #4b3b6b; borderRadius:9px; CookieRun 700 16px; background:subColor; color:#4b3b6b`(과목 없으면 `·` + `color:#b9aedb`)

### 4.6 월간 보기 (`timeIsMonth`)

- `monthGrid(fn)` 이 **2026년 9월** 달력(7열 × 최대 5주, 앞 요일 패딩)을 만든다. 주말·달력 밖 칸은 `fn` 미호출.
  - 오늘 칸: `boxShadow:inset 0 0 0 4px #ee9dbf` + 날짜 알약 강조(`background:#ee9dbf; color:#fffdf7`)
  - 주말 칸: `background:#f7f4fd`, 내용 `휴무`
- 요일 헤더: `SUN…SAT`(`dowHeads`), 배경 `#c4d8f7`
- 각 날짜 칸: `minHeight:120px`. `fn(day)` 이 그날 `chips` 배열 반환 → 각 chip `"N교시"`(Silkscreen 8px) + 과목 스와치(`border:1px solid #4b3b6b; borderRadius:4px; background:subColor`)

### 4.7 NOTE 박스 (항상 표시)

design.md §3.13 NOTE. `background:#fbe6a2; border:3px solid #4b3b6b; borderRadius:12px; padding:12px 16px; boxShadow:4px 4px 0 …`
문구(고정): `동아리 활동` 은 `동아리 시간`(배경 `#a9dce4`)일 수도 있고, `학스 시간`(배경 `#f7bfb2`)일 수도 있어요. — 강조어들은 `border:2px solid #4b3b6b; borderRadius:7px; CookieRun 700 14px`.

---

## 5. 특수 동작 규칙 (반드시 그대로 재현)

### R1. 첫 로드 기본 선택 = "지금 정보 수업하는 2학년 반"

`componentDidMount` 에서 **1회만** `pickInfoClass()` 로 `{grade, cls}` 를 정해 시드·`loadTimetable`.
- 스냅샷 `_snap.tt["2"]`(2학년 1~11반)에서 **오늘 및 이후** 날짜를 오름차순으로 훑는다.
- 한 날짜에 `periods[i] === '정보'` 인 반들을 모으고, 각 반의 정보 교시 시작/끝(`PERIODS`)을 계산.
- **오늘**이면: (a) 지금 진행 중인 정보 교시가 있으면 그 반 → (b) 없으면 아직 안 지난(다음) 정보 교시 중 가장 이른 반 → (c) 다 지났으면 오늘 가장 늦은 정보 교시의 반.
- **미래 날짜**면: 그날 가장 이른 정보 교시의 반.
- 아무 날에도 정보가 없으면 `{grade:2, cls:1}`.
- 예) 신현중 스냅샷에서 11:xx(3교시경)에 열면 9/3 의 다음 정보 교시가 2학년 2반 4교시 → **2학년 2반** 자동 선택.
- 사용자가 드롭다운을 직접 바꾸면 그 값 유지(자동 선택은 마운트 시 1회뿐, 매 렌더마다 되돌리지 않음).

### R2. 일간 표는 "그날 수업 있는 마지막 교시"까지만

`renderVals` 에서 `lastP` = `subjectOn(오늘, i)` 가 있는 가장 큰 `i+1`. `PERIODS.slice(0, lastP)` 로만 행 생성. `lastP === 0`(주말·데이터 없음)이면 7교시 전부 폴백. **주간·월간은 이 규칙 적용 안 함.**

### R3. 주간 표에서 "오늘 이전 날짜" 열 전체 흐리게

`weekRows` 셀에서 `dayMid(d) < todayMid`(자정 기준 날짜 비교)면 그 요일 셀 전부 `opacity:.4; filter:saturate(.35)`. **오늘** 열은 기존대로 지난 교시만(`isPast`) 흐리게, 미래 요일은 선명. `weekHeads` 도 지난 요일이면 `opacity:.55`.
- 요일 인덱스 비교가 아니라 **실제 날짜** 비교라, 오늘이 토/일이어도 월~금 전부 지난 날로 처리됨.

### R4. 일간 표 — 같은 과목 4교시 이상 "연속"이면 한 줄로 병합

`dayRows` 생성 후 후처리(`dayRowsMerged`). 빈값/`'—'` 아닌 같은 `subject` 가 4개 이상 연속인 구간 → 한 행으로:
- `period='' periodEn='' time='' endTime=''` (왼쪽 "N교시"·시각 텍스트 제거)
- `subject` = 과목명 1회, `tagStyle`/`color` = 구간 첫 행 것
- 상태 배지 = 구간 첫 교시 시작 ~ 마지막 교시 끝 기준(완료/진행 중/예정)
- 행 세로 패딩 `18px`로 키움
- 2~3연속·비연속은 그대로.
- 예) 9/24 `추석연휴` ×7 → `추석연휴` 한 줄. (템플릿 왼쪽 셀은 `{{ r.endTime }}` 만 찍으므로 `~` 는 데이터에 포함되어 있고 병합 행은 완전 공백)

### R5. 주간·월간 표 — 같은 과목 4교시 이상 연속이면 이름 1번만

- **주간**: 요일 `d` 별로 세로 스캔. `subjectAt(d,i)` 가 같은 값 4개 이상 연속이면 **첫 셀만 과목명 유지**, 나머지 셀 `subject=''` + `style='display:none'`(태그 박스 숨김; 열 배경은 `cellStyle` 이라 유지). 왼쪽 TIME 열(5일 공용)은 못 지우므로 유지.
- **월간**: 그날 `chips`(빈 교시 제외한 배열)에서 같은 `sub` 4개 이상 연속이면 chip 하나로 합치고 `label:''`(→ "N교시" 텍스트 사라짐, 과목 스와치·이름만).

---

## 6. 엣지 케이스

- **휴업일**: 스냅샷에서 토/일은 `{ holiday: "…" }`. 평일 공휴일(추석 등)은 `periods:["추석연휴", …]` 로 들어옴 → R4/R5 병합 대상.
- **데이터 없는 반/기간**: `subjectOn` 이 `''` → 일간 `'—'`, 주간 `'·'`, 월간 chip 없음.
- **주간이 두 달 걸침**(예: 8/31~9/4): 8월 칸은 스냅샷/조회 범위에 있으면 정상. 월간은 항상 9월 고정.
- **NEIS 중복 교시**: 같은 (날짜,교시)를 빈값+실값으로 두 번 주면 실값 우선(`if (!tt[d][p]) tt[d][p] = sub`).
- **네트워크/CORS 실패**: `neisPage` 가 `catch` 로 빈 결과 → 스냅샷만 보인다(앱은 계속 동작).

---

## 7. 재현 체크리스트

- [ ] `misTimetable` 무인증 호출 시 5행/페이지 → `neisFetchAll` 로 페이지네이션. `window.NEIS_KEY` 있으면 키 사용
- [ ] 인라인 스냅샷으로 첫 페인트, 이후 실시간으로 덮어씀. 스냅샷 마커 `/*NEIS_SNAPSHOT_START/END*/`
- [ ] 학년(1~3)·반(1:9/2:11/3:12) 셀렉트, 변경 시 재조회
- [ ] 일간/주간/월간 3보기, `PERIODS` 종소리 시각, 완료/진행 중/예정 상태색(색+글자)
- [ ] `subColor`: 등록 과목 고정색 + 미등록 과목 해시 팔레트
- [ ] R1 첫 로드 = 지금 정보 수업하는 2학년 반(드롭다운도), 이후 수동 선택 유지
- [ ] R2 일간 = 그날 마지막 수업 교시까지만(주말이면 7교시 폴백)
- [ ] R3 주간 = 오늘 이전 요일 열 전체 흐림(날짜 비교), 오늘은 지난 교시만, 헤더도 흐림
- [ ] R4 일간 4연속 병합(교시/시각 텍스트 제거, 이름 1회)
- [ ] R5 주간(첫 칸만, 나머지 display:none)·월간(chip 1개, label 제거) 4연속 병합
- [ ] NOTE 박스 문구 고정
