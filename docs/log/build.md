# build.md — `output/data4.html` 빌드(구현) 노트

> 🗂 **작업 기록(이력) 문서입니다.** 당시의 파일명·에이전트 이름(builder-agent 등)이 나오지만 지금 구조와는 다를 수 있어요. 규칙은 `docs/rules/`, 작업 방법은 `README.md`·`.claude/README.md` 를 보세요.


`docs/rules/design.md` 가 "무엇을 어떻게 보이게 할지"(시각 계약)라면, 이 문서는 그 계약을
**`output/data4.html` 이라는 한 파일에서 실제로 어떻게 구현했는가**를 기록한다.

## 개요 — data4.html 이 어떤 파일인가

- `input/design/project/학교 웹앱.dc.html`(= design.md 의 원본 핸드오프)의 **구현본**.
- 런타임: `output/support.js` + 파일 하단의 `<script type="text/x-dc" data-dc-script>` 안
  `class Component extends DCLogic { state = {…}; renderVals() {…} }`.
- 마크업: `<x-dc>` 안에 `<helmet>`(→ `<head>` 로 이동) + 본문 템플릿.
  바인딩은 `{{ 표현식 }}`, 분기는 `<sc-if value="{{ bool }}">`, 반복은 `<sc-for list="{{ arr }}" as="x">`.
- 최상위 본문 래퍼에 `zoom:1.1` 이 걸려 있고, 그 안에 `max-width:1080px; margin:0 auto` 본문이 있다.
- 탭 4개(`state.tab`): `rules` / `time` / `meal` / `sheet`. 시간표·급식 탭은 NEIS 실데이터
  (인라인 스냅샷 + `scripts/fetch-neis.ps1` → `build-webapp-data.ps1`).
- **앞으로 data4.html 을 수정할 때마다 이 문서에 절(##)을 이어 붙인다.**

---

## 활동 진행률 플로팅 위젯 (design.md §10)

### 근거
design.md §10 (10.1~10.9). 수업 활동지 탭에서만, 가운데 본문 바깥 오른쪽 여백에
"활동 진행률" 카드를 뷰포트 고정으로 띄운다. §10.9 의 복붙용 CSS/HTML 스니펫을 기준으로 구현.

### 바꾼 위치 (data4.html)

| 부분 | 위치(대략) | 내용 |
|---|---|---|
| `<style>` (helmet) | 27–85행 부근 | `.sheet-progress` 및 하위 클래스(`.sp-head/.sp-body/.sp-title/.sp-count .big/.sub/.track/.fill/.sp-note/.sp-done`) + 3개 `@media`. design.md §2 토큰을 **리터럴 hex**(이 파일은 CSS 변수 미사용)로 바꿔 넣음. |
| 위젯 마크업 | `</x-dc>` **바로 앞**(852–868행 부근) | §10.9 HTML 구조를 클래스 기반으로. `zoom:1.1` 래퍼 **밖**(`<x-dc>` 직속)에 마운트. |
| `renderVals()` | 1410–1420행 부근 | 7항목 진행률 집계 + 반환값 추가. |
| (제거) | 옛 `<sc-if isSheet>` 내부 | 이전 반복에서 인라인 스타일로 넣었던 위젯 마크업을 삭제하고 위 위치로 이설. |

### `<style>` 에 추가한 클래스 (요지)
- `.sheet-progress`: `position:fixed; top:116px; width:120px; z-index:5; left:max(8px, calc((100vw - 1188px)/2 - 120px - 12px)); background:#fffdf7; border:3px solid #4b3b6b; border-radius:12px; box-shadow:5px 5px 0 rgba(75,59,107,.18); overflow:hidden; display:flex; flex-direction:column`.  ← **왼쪽 여백 + 컴팩트(120px)** (아래 "왼쪽 이동·축소" 참고). `.sp-head` `text-align:center`(보조 라벨 `.r` 제거), `.sp-note` 제거, big 20px, 카운트 `n/7`.
- `.sp-head`: `padding:8px 14px; border-bottom:3px solid #4b3b6b; background:#d6c4f5; Silkscreen 11px; space-between`. `.sp-head .r`: `font-size:10px; opacity:.75`.
- `.sp-body`: `padding:14px; flex column; gap:10px` (개별 margin 없음).
- `.sp-title`: CookieRun 700 16px `#4b3b6b` (Silkscreen 금지).
- `.sp-count .big`: CookieRun 700 26px `font-variant-numeric:tabular-nums` `#4b3b6b`.  `.sp-count .sub`: Maplestory 300 13px `#8b7cb8`.
- `.track`: `height:12px; border:2px solid #4b3b6b; border-radius:999px; overflow:hidden; background:#ece9f3`.
- `.fill`: `height:100%; background:#9db2f2`(단색·그라디언트 없음) `transition:width .3s ease`. **`width` 만** 인라인 바인딩.
- `.sp-note`: Maplestory 300 12px `#8b7cb8`.  `.sp-done`: 알약 `background:#ece9f3; color:#8a82a6; border-radius:999px; padding:2px 10px; CookieRun 700 12px`.
- `@media (max-width:820px){ .sheet-progress{ display:none !important } }` — 모바일/태블릿만 숨김 (아래 "가시성 정정" 참고)
- `@media print{ .sheet-progress{ display:none !important } }`
- `@media (prefers-reduced-motion:reduce){ .sheet-progress .fill{ transition:none !important } }`

### `<sc-if isSheet>` 밖 마크업 (요지)
`</x-dc>` 바로 앞에:
```
<div class="sheet-progress" aria-label="활동 진행률" style="display:{{ sheetWidgetDisplay }}">
  <div class="sp-head"><span>PROGRESS</span><span class="r">WORKSHEET</span></div>
  <div class="sp-body">
    <div class="sp-title">활동 진행률</div>
    <div class="sp-count"><span class="big">{{ sheetPct }}%</span><span class="sub">{{ sheetDone }} / {{ sheetTotal }} 완료</span></div>
    <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="{{ sheetTotal }}"
         aria-valuenow="{{ sheetDone }}" aria-valuetext="{{ sheetAria }}">
      <div class="fill" style="{{ sheetFillStyle }}"></div>
    </div>
    <div class="sp-note">입력하면 자동으로 반영돼요</div>
    <sc-if value="{{ sheetSaved }}" hint-placeholder-val="{{ false }}">
      <span class="sp-done">✓ 제출 완료</span>
    </sc-if>
  </div>
</div>
```
- 수치(`{{ sheetPct }}%`, `{{ sheetDone }} / {{ sheetTotal }}`)는 **트랙 밖**에만 표기(§10.8 — 필 위 글자 금지).
- 제출 완료 알약은 `<sc-if sheetSaved>` 로만 노출. `saved` 는 진행률 집계에 미포함.

### `renderVals()` 에 추가한 값과 7항목 공식
```js
const sheetChecklist = [
  !!(s.fName && s.fName.trim()),   // 1. 이름
  !!(s.a1 && s.a1.trim()),         // 2. 활동1 서술답
  !!s.checks[0], !!s.checks[1], !!s.checks[2], !!s.checks[3],   // 3~6. 데이터 분석 4단계 체크
  !!(s.reflect && s.reflect.trim())// 7. 수업 소감
];
const sheetDone  = sheetChecklist.filter(Boolean).length;   // 완료 개수
const sheetTotal = sheetChecklist.length;                   // 7
const sheetPct   = Math.round(sheetDone / sheetTotal * 100);
const sheetFillStyle    = 'width:' + sheetPct + '%';        // 색·높이·transition 은 .fill 클래스
const sheetSaved        = !!s.saved;                        // 완료 알약 표시용(집계 X)
const sheetAria         = sheetTotal + '개 중 ' + sheetDone + '개 완료';
const sheetWidgetDisplay= s.tab === 'sheet' ? 'flex' : 'none';
// return { … sheetDone, sheetTotal, sheetPct, sheetFillStyle, sheetSaved, sheetAria, sheetWidgetDisplay }
```
`checks` 토글·`fName`/`a1`/`reflect` 의 `onChange` 는 이미 `setState`→재렌더 하므로 진행률이 자동 갱신된다.
기존 state·다른 탭·`save`/`reset` 은 건드리지 않았다.

---

## 항목 단위 세분화 진행률 (data5_2.html · design.md §10 항목 집계 (b), 2026-09-10)

### 언제 쓰나
진행률 분모를 고정 7항목 체크리스트가 아니라 **활동지에 실제로 있는 활동 항목 수**로 잡고 싶을 때.
data5 계열은 대부분의 답 칸이 `<textarea class="blank">`(**비제어 DOM**, `renderVals` 의 state 로 안 잡힘)이라
체크리스트 방식으로는 몇 개를 채웠는지 셀 수 없다.

### 집계 대상 (data5_2.html 기준 = 38항목)
| 항목 유형 | 셀렉터 | "완료" 판정 |
|---|---|---|
| 미션 빈칸 33 | `#sheetPrintArea textarea.blank[aria-label]` | `.value.trim().length > 0` |
| 그래프 붙여넣기 칸 2 | `#sheetPrintArea .paste-zone` | `._imgData` 또는 `.is-filled` 클래스 |
| 형성평가 문항 3 | `this.state.fq` | 원소가 truthy |

- `[aria-label]` 로 걸러 **MY_INFO 학번·이름칸(aria-label 없음)은 자동 제외**된다(activity guide §1-1 "식별칸 제외" 원칙과 일치). 굳이 넣으려면 `done/total` 에 따로 더한다.
- OX·짝짓기·순서배열 등 다른 활동을 넣으려면 같은 방식으로 그 개수를 `done`/`total` 에 더하면 된다.

### `renderVals()` 안 헬퍼 + 집계
```js
// 클래스 메서드로 추가 (renderVals 밖)
_progressParts() {
  const root = document.getElementById('sheetPrintArea');
  const blanks = root ? Array.prototype.slice.call(root.querySelectorAll('textarea.blank[aria-label]')) : [];
  const blanksDone = blanks.filter((el) => (el.value || '').trim().length > 0).length;
  const zones = root ? Array.prototype.slice.call(root.querySelectorAll('.paste-zone')) : [];
  const zonesDone = zones.filter((z) => z._imgData || (z.classList && z.classList.contains('is-filled'))).length;
  const fq = this.state.fq || [];
  return { done: blanksDone + zonesDone + fq.filter(Boolean).length,
           total: blanks.length + zones.length + fq.length };
}

// renderVals() 안 — 기존 sheetChecklist 블록을 이걸로 교체
const _p = this._progressParts();
const sheetDone  = _p.done;
const sheetTotal = _p.total || 1;      // 마운트 직후 DOM 아직 없을 때 0-division 방지
const sheetPct   = Math.round(sheetDone / sheetTotal * 100);
const sheetFillStyle = 'width:' + sheetPct + '%';
const sheetSaved = !!s.saved;
const sheetAria  = sheetTotal + '개 항목 중 ' + sheetDone + '개 완료';
```

### 실시간 갱신 (핵심 — 비제어 DOM 이라 감시 필요)
`textarea.blank`·`.paste-zone` 은 값이 바뀌어도 React 재렌더가 안 일어난다 → `componentDidMount()` 에서 이벤트/DOM 변화를 감시해, **진행률 수치가 실제로 달라질 때만** 더미 state(`_tick`)를 올려 재렌더시킨다.
```js
state = { …, _tick: 0 };   // 재렌더 트리거 전용, 화면에는 안 씀

componentDidMount() {
  this._progSig = '';
  const bump = () => {
    let p; try { p = this._progressParts(); } catch (e) { return; }
    const sig = p.done + '/' + p.total;
    if (sig === this._progSig) return;                 // ★ 시그니처 비교 필수 (안 하면 무한 렌더)
    this._progSig = sig;
    this.setState((st) => ({ _tick: (st._tick || 0) + 1 }));
  };
  const schedule = () => { clearTimeout(this._progT); this._progT = setTimeout(bump, 90); };  // 90ms 디바운스
  document.addEventListener('input', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('blank')) schedule();
  }, true);
  document.addEventListener('paste', () => setTimeout(schedule, 60), true);
  document.addEventListener('click', () => setTimeout(schedule, 60), true);   // 붙여넣기 '지우기' 버튼 등
  if (typeof MutationObserver === 'function') {
    this._progMo = new MutationObserver(schedule);
    this._progMo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
  setTimeout(bump, 300); setTimeout(bump, 900);   // 마운트 직후 DOM 준비되면 초기 1회
}
```

### 주의
- **시그니처 비교(`_progSig`)를 빼면** MutationObserver → setState → (DOM 변화) → MutationObserver … 무한 렌더 루프. 반드시 `done/total` 문자열이 바뀐 경우에만 `setState`.
- 형성평가(`s.fq`)는 이미 `setState` 기반이라 감시 대상 아님. 헬퍼에서 **개수만** 합산한다.
- `savePdf` 는 클론에서 `textarea.blank`→`<div>` 로 치환하지만, 집계는 라이브 `#sheetPrintArea` 를 보므로 영향 없음.
- 수치가 `n/38` 처럼 커져도 design.md §10.5 규정대로 `.sub`(트랙 밖)에만 표기. 필 위에 글자 얹지 않음.
- `sheetSaved`(제출 배지)는 여전히 집계 제외.

### 검증 (헤드리스, 2026-09-10)
- 초기 렌더: `0%` · `0/38`.
- 빈칸 5개에 값 입력 + 형성평가 1문항 클릭 → 위젯이 `16%` · `6/38` 로 **실시간 갱신**. 콘솔 에러 0, `renderVals()` 오류 0.

### data4.html 로 역이식할 때
data4 는 대부분 활동이 이미 state 바인딩이라 굳이 필요 없지만, DOM-only 활동(스샷 붙여넣기 등)을 진행률에 넣고 싶으면 위 `_progressParts`/`componentDidMount` 감시 패턴만 떼어다 쓰면 된다.

### zoom 보정 — 택한 방법과 이유
- 문제: 본문 래퍼 `zoom:1.1`. `zoom` 은 Chrome 에서 그 안의 `position:fixed` 요소의 좌표계·`vw`·`px`
  를 1.1배로 부풀려, `right`/`top`/`width` 가 어긋나고 본문과 겹친다.
- 시도 1: `.sheet-progress{ zoom:calc(1/1.1) }` 로 상쇄 → 헤드리스 스크린샷에서 우측이 잘림. 폐기.
- **채택**: 위젯을 **`zoom:1.1` 래퍼 밖**(`<x-dc>` 직속, `</x-dc>` 바로 앞)에 마운트.
  `position:fixed` 가 실제 뷰포트 기준으로 계산된다.
- 추가 보정: 본문(`max-width:1080px`)이 `zoom:1.1` 로 **시각적으로 1188px(=1080×1.1)** 폭이므로,
  `right` 계산의 본문폭 기준을 `1080px` → **`1188px`** 로 바꿈:
  `right:max(16px, calc((100vw - 1188px)/2 - 220px - 20px))`.
  이 값이면 뷰포트가 넓어져도 위젯과 (시각) 본문 우측 끝 사이 간격이 항상 ~20px 로 유지된다.
### 가시성 정정 (2026-09-03)
- 처음엔 "여백 부족하면 숨김" + breakpoint `max-width:1700px` 로 구현 → **1366·1440·1536·1600
  같은 일반 노트북 전부에서 위젯이 안 보임**(사용자 보고 "진행률 안보이는데?"). 폐기.
- **현재**: 숨기지 않고 **본문 오른쪽 끝에 살짝 겹쳐서라도 보여준다**. `right:max(8px, calc(…))`
  가 알아서 처리 — 넓으면 여백에 온전히, 여백 부족하면 `8px` clamp 로 오른쪽 끝에 붙어 본문
  카드 우상단 모서리와 일부 겹침(작은 카드라 허용). 폭도 220→**210px**, 간격 20→**12px**,
  우측 최소 16→**8px** 로 축소해 겹침 최소화.
- `@media` 숨김 breakpoint 는 `max-width:820px`(모바일/태블릿)만. 그 아래에선 활동지 본문
  폼·체크로 상태 확인 가능(§7). 자세한 규칙은 design.md §10.2.

### 왼쪽 이동·축소 (2026-09-03)
- 사용자 요청: "진행바를 **왼쪽 여백**으로, **레이아웃과 겹치지 않게 크기 변경**".
- `right:` → `left:`. 폭 210→**120px**(컴팩트), 헤더 보조 라벨(`.r` "WORKSHEET")과 하단 안내문
  (`.sp-note` "입력하면 자동으로 반영돼요") 제거, big 26→20px, 카운트 `n / 7 완료` → `n/7`, 패딩·gap 축소.
- `left:max(8px, calc((100vw - 1188px)/2 - 120px - 12px))`. 시각 본문폭 1188 기준:
  - **뷰포트 ≈1470px 이상**: 왼쪽 여백에 온전히 들어가 **본문과 겹침 0**.
  - 1300~1470px: 창 왼쪽 테두리 쪽과만 소폭 겹침(내용 카드는 안 가림).
  - ~1280px 이하: 제목/첫 카드 좌상단과 겹침 → 그보다 좁으면 `@media (max-width:820px)` 로 숨김.
- 헤드리스 확인: 1920·1440 겹침 없음 / 1280 제목 일부 겹침 / ≤820 숨김.

### 탭 게이팅
`<sc-if isSheet>` 밖에 있으므로 sc-if 로 못 감싼다. 대신 `renderVals` 의
`sheetWidgetDisplay`(`s.tab==='sheet' ? 'flex' : 'none'`)를 위젯 루트의 인라인 `display` 로 바인딩.
`@media` 의 `display:none !important` 는 인라인보다 우선하므로 좁은 화면·인쇄에서는 그대로 숨는다.

### 재현 체크리스트
1. `output/data4.html` 을 데스크톱/노트북 뷰포트(≥821px)에서 열고 **수업 활동지** 탭 → **왼쪽**에 컴팩트 카드가 뜬다. ≈1470px+ 는 본문과 겹침 0, 그 아래는 창 왼쪽 테두리와 소폭 겹침.
2. 페이지를 아래로 스크롤 → 카드가 뷰포트 좌상단에 그대로 고정(`position:fixed`).
3. 이름/활동1 답/4단계 체크/소감을 채우면 `n%`·`n / 7`·바가 즉시 갱신(최대 7/7 = 100%).
4. "제출하기" 누르면 `✓ 제출 완료` 알약이 추가로 표시(진행률 수치는 그대로).
5. 뷰포트를 820px 이하로 좁히면 카드가 사라진다(본문 폼으로 진행 상태 확인 가능).
6. 다른 탭(이용 규칙/시간표/급식)으로 전환하면 카드가 사라진다.
7. 인쇄 미리보기(Ctrl+P)·`prefers-reduced-motion` 에서 각각 숨김·트랜지션 제거.

---

## 만화 판매량 표 복사 방지 (ACTIVITY_5)

### 목적
수업 활동지 탭 ACTIVITY_5(`속성(feature) 이해하기`)의 표 **"2026년 상반기 일본 만화 판매량 TOP 10"** 을
학생이 드래그로 긁어 복사하지 못하게 한다. (표 자체는 그대로 읽을 수 있고, 가로 스크롤도 유지.)

### 바꾼 위치 (data4.html)
| 부분 | 위치(대략) | 내용 |
|---|---|---|
| `<style>` (helmet) | `.sheet-progress` 미디어쿼리 아래 | `.no-copy { user-select:none; -webkit-user-select:none; -ms-user-select:none; }` 1줄 추가 |
| 표 컨테이너 div | ACTIVITY_5, `minWidth:460px …` 인라인 style div (약 733행) | `id="mangaTable" class="no-copy"` 부여. **인라인 style·`overflowX:auto` 래퍼는 그대로.** |
| `componentDidMount()` | `loadMeal(new Date())` 다음 | `['copy','cut','contextmenu','dragstart']` 를 **`document`** 에 위임 등록, `e.target.closest('#mangaTable')` 인 경우에만 `e.preventDefault()` |

### 방식과 이유
- **선택 자체 차단**: `.no-copy` 의 `user-select:none` → 표 안 텍스트가 드래그로 선택되지 않으므로 복사할 내용이 안 생긴다. (시각 효과 없음.)
- **이벤트 차단(방어선 추가)**: 키보드 Ctrl+C/X, 우클릭 메뉴, 셀을 밖으로 끌어놓기(dragstart)까지 막는다.
- **왜 `document` 위임인가**: 활동지 탭은 `<sc-if value="{{ isSheet }}">` 로 감싸여 있고 support.js 의 `walkIf` 는
  조건이 false면 서브트리를 **아예 렌더하지 않는다**(`v ? <Fragment> : null`). 기본 탭이 `rules` 라
  `componentDidMount` 시점에는 `#mangaTable` DOM 이 없다 → `getElementById('mangaTable')` 는 `null`.
  그래서 요소에 직접 `addEventListener` 하지 않고 `document` 에 한 번만 위임 등록하고
  핸들러에서 `e.target.closest('#mangaTable')` 로 그 표 안에서 발생한 이벤트만 막는다(마운트 타이밍 무관, 다른 표·입력칸엔 영향 없음).
- 인라인 `oncopy=` 속성 대신 `addEventListener`(support.js 런타임 규칙).

### 대상 id / 클래스
- id: `mangaTable` (표 컨테이너 div, `overflowX:auto` 스크롤 래퍼의 자식)
- class: `no-copy` (= `user-select:none`)

### 재현 체크리스트
1. 활동지 탭 → ACTIVITY_5 표에서 텍스트를 드래그해도 선택 안 됨.
2. `getComputedStyle(document.getElementById('mangaTable')).userSelect === 'none'`.
3. 표 안에서 `new Event('copy'|'cut'|'contextmenu'|'dragstart',{cancelable:true})` 를 dispatch → `dispatchEvent` 가 `false`(= preventDefault 됨).
4. 표를 감싼 `overflowX:auto` 래퍼는 좁은 뷰포트에서 여전히 가로 스크롤(`scrollWidth > clientWidth`).
5. 다른 표·입력칸·탭·진행률 위젯은 변화 없음, 표 테두리·색·레이아웃도 동일.

---

## activity accent 색 확장 (salmon·olive 추가)

### 바꾼 위치 (data4.html)
- `SUB_PALETTE` 선언 **바로 다음**(약 993~998행): 새 상수 `SHEET_ACT_ACCENT` 추가.
  ```js
  var SHEET_ACT_ACCENT = ['#a9dce4','#c4d8f7','#fbe6a2','#d6c4f5','#bfe9dd','#eec6ea','#f7bfb2','#e3e0b0'];
  ```
- 기존 activity 카드 헤더 색은 카드마다 인라인 `background:` 로 **하드코딩**되어 있고(1 `#a9dce4` · 2 `#c4d8f7` · 3 `#fbe6a2` · 4 `#d6c4f5` · 5 `#bfe9dd` · 6 `#eec6ea` · 7 `#f7bfb2`), 그대로 **미변경**.
- ACTIVITY_7 카드는 이미 존재하며 헤더·번호 배지가 salmon `#f7bfb2` 로 하드코딩되어 있어 손대지 않음.
- ACTIVITY_8 카드는 없음 — **새로 만들지 않음**(색 등록만).

### 순환 (design.md §4.1 과 일치, 8색 후 루프)
| N | 이름 | hex |
|---|---|---|
| 1 | mint | `#a9dce4` |
| 2 | blue | `#c4d8f7` |
| 3 | yellow | `#fbe6a2` |
| 4 | purple | `#d6c4f5` |
| 5 | mint | `#bfe9dd` |
| 6 | lilac | `#eec6ea` |
| 7 | salmon | `#f7bfb2` |
| 8 | olive | `#e3e0b0` |

`ACTIVITY_N` 헤더 색 = `SHEET_ACT_ACCENT[(N-1) % 8]`. 다음 활동 카드(ACTIVITY_8~) 추가 시 이 상수에서 색을 고른다.

### 안 건드린 것
기존 6색·레이아웃·진행률 위젯 색(`#d6c4f5`/`#9db2f2`/`#ece9f3`), `SUB_PALETTE`, `SUB_COLOR(_EXT)`.

---

## 순서 배열 드래그 활동 (PREVIOUSLY 카드)

### 목적
수업 활동지 탭 PREVIOUSLY 카드에 "데이터로 문제를 해결하는 4단계"의 **순서 자체**를 학생이 복원하는
선행 조직자(advance organizer) 활동을 얹는다. 뒤섞인 칩 4장(문제 정하기 / 데이터 수집·특성 파악 /
데이터 분석하기 / 결과 해석·공유)을 번호 칸 ①~④ 로 끌어다 놓고 `✅ 순서 확인` 으로 채점한다.
spec `spec/data4-4steps-sequencing.activity.md` · brief `brief/data4-4steps-sequencing.build-brief.md` ·
design.md **§11**(순서 배열 / 드래그 슬롯 컴포넌트) 계약을 그대로 구현.

### 바꾼 위치 (data4.html)
| 부분 | 행 범위(수정 후) | 내용 |
|---|---|---|
| `<style>` (helmet) | 93–165 | design.md §11.2 `.seq-*` 스니펫 이식(`.seq-activity/.seq-head/.seq-tag/.seq-title/.seq-hint/.seq-tray/.seq-chip/.seq-rows/.seq-row/.seq-num/.seq-slot/.seq-mark/.seq-controls/.seq-check-btn/.seq-reset-btn/.seq-result` + `:focus-visible` + `prefers-reduced-motion`). 색·px 는 §2 토큰만, 테두리는 모든 상태에서 `#4b3b6b`. |
| `<style>` (helmet) | 166–179 | **전역 `@media print` 신설**(이 파일엔 없던 블록). |
| PREVIOUSLY 카드 본문 | 613–649 (약 36줄 추가) | NOTE 박스(`#fbe6a2`) `</div>` 직후, 카드 본문 래퍼 안. `2px dashed rgba(75,59,107,.28)` 구분선 1줄 + `.seq-activity` 블록(헤더 `ORDER`+제목, 발문 `<p>`, `#seqTrayPrev` 칩 4개, `.seq-rows` 슬롯 4칸, `.seq-controls` 확인/리셋/결과). 기존 복습 불릿 3개·NOTE 는 유지. |
| `</body>` 앞 | 1640–1909 (약 270줄, 새 `<script>` 1개) | 순서 배열 엔진(IIFE). x-dc `<script type="text/x-dc">` 와 별개인 순수 vanilla `<script>`. DClogic 클래스·`renderVals`·`componentDidMount` 는 건드리지 않음. |
| 1074행 `closest('#mangaTable')` | (불변) | dragstart 위임 스코프를 넓히지 않음 — 넓히면 `.seq-chip` 드래그가 `preventDefault` 로 막힌다. |

### 방식과 이유
- **엔진 신규**: data4 에는 data3 계열 dnd 엔진(CSS/JS)이 전혀 없어 CSS·마크업·JS 를 새로 넣었다.
  다음 순서 배열 활동은 `.seq-*` 마크업만 추가하면 이 엔진이 그대로 배선한다(`.seq-activity` 단위로 스코프).
- **document 위임 (activity guide §1-8 패턴)**: PREVIOUSLY 카드는 `<sc-if value="{{ isSheet }}">` 안이라
  다른 탭에선 렌더되지 않고 탭 전환마다 언마운트/재마운트된다. 그래서 칩·슬롯·버튼에 직접
  `addEventListener` 하지 않고 `document` 에 `click`/`keydown`/`dragstart`·`dragover`·`dragenter`·
  `dragleave`·`dragend`·`drop` 을 한 번만 위임 등록하고, 핸들러에서 `e.target.closest('.seq-activity …')`
  로 이 활동 안 이벤트만 처리한다.
- **상태 보관 = DOM-only + 매 마운트 재init (spec §7 대안 B)**: 칩 위치는 DOM(어느 슬롯/트레이의
  자식인가)만으로 표현한다. 새 `.seq-activity` 노드가 나타나면 `MutationObserver` → `scan()` →
  `initActivity()` 가 `data-seq-init="1"` 이 없을 때 1회 배선(슬롯 `aria-label` 동기화, 트레이 `is-empty`).
  칩 초기 뒤섞임 `["step3","step1","step4","step2"]` 는 **정적 마크업**에 그대로 박아 두어 JS 실패·인쇄에도
  순서가 남는다. React(support.js) 재렌더는 정적 서브트리를 건드리지 않으므로 60초 `now` tick 에도
  배치가 유지되고, **탭 전환 시에만** 초기 뒤섞임으로 리셋된다(spec 이 감수한 트레이드오프).
- **마우스 드래그**: HTML5 DnD. 찬 슬롯에 놓으면 두 칩 자리 교환(다른 슬롯에서 온 경우) 또는 기존 칩을
  트레이로 되돌림(트레이에서 온 경우). 슬롯 밖(트레이)에 놓으면 칩은 트레이로 복귀. `zoom:1.1` 대응으로
  좌표 산술 없이 **이벤트 타깃(`closest`)만** 사용.
- **터치/키보드 대체**: 칩(`<button type="button" aria-pressed>`) 클릭 = 선택 토글(`.is-on`), 선택 상태에서
  슬롯 클릭 = 배치, 빈손으로 찬 슬롯 클릭 = 칩 회수, 트레이 클릭 = 선택 칩 회수. 슬롯은
  `role="button" tabindex="0"` 이라 Enter/Space 를 수동 처리, Esc 는 어디서나 선택 해제. 칩은 네이티브
  버튼 클릭 경로를 그대로 쓴다(Space/Enter 이중 처리 방지).
- **채점(`✅ 순서 확인`)**: 슬롯 4칸이 다 안 차면 `incomplete` 문구만. 다 차면 칸별로
  `slot.dataset.answer === chip.dataset.answerKey` 비교 → `.is-correct`(`#d8f0c4`+`.seq-mark ✓`) /
  `.is-wrong`(`#f7bfb2`+`.seq-mark ✗`), `#seqResultPrev`(`role="status"`)에 `"4칸 모두 정답! "` /
  `"4칸 중 {n}칸 정답. "` / `"4칸 중 0칸 정답. "` + spec §4 피드백 문구. 정답 배열은 텍스트로 노출하지 않음.
- **리셋(`🔄 다시 섞기`)**: 모든 슬롯 비우고 칩을 트레이로 복귀, Fisher–Yates 로 **정답과 다른** 순열 재배치,
  채점 클래스·결과 문구·선택 상태 초기화.
- **진행률 비포함**: spec §7-1 / design.md §11.6 대로 `renderVals` 의 `sheetChecklist`(7항목)에 넣지 않음.
  선행 조직자라 완료율 대상 아님. 넣으려면 엔진이 결과를 `state` 에 write + 체크리스트 원소 추가 필요.

### 새 클래스 / id
- 클래스: `.seq-activity` · `.seq-head` · `.seq-tag` · `.seq-title` · `.seq-hint` · `.seq-tray`
  (`.is-over`/`.is-empty`) · `.seq-chip`(`.is-on`/`.is-dragging`) · `.seq-rows` · `.seq-row` · `.seq-num` ·
  `.seq-slot`(`.is-over`/`.is-filled`/`.is-correct`/`.is-wrong`) · `.seq-mark` · `.seq-controls` ·
  `.seq-check-btn` · `.seq-reset-btn` · `.seq-result`
- id: `seqTrayPrev`(트레이) · `seqSlotPrev1`~`seqSlotPrev4`(슬롯) · `seqResultPrev`(결과, `role="status"`)
- data 속성: 칩 `data-value="seq-prev-stepN"` / `data-answer-key="stepN"`, 슬롯 `data-slot` /
  `data-check-group="seqTrayPrev"` / `data-answer="stepN"`, 버튼 `data-target-tray="seqTrayPrev"` /
  `data-result-id="seqResultPrev"`, 활동 노드 런타임 플래그 `data-seq-init="1"`
- 정답(슬롯→칩): `seqSlotPrev1→step1` · `seqSlotPrev2→step2` · `seqSlotPrev3→step3` · `seqSlotPrev4→step4`
  (유일 해, 초기 뒤섞임 `step3, step1, step4, step2`)

### `@media print` 신설 내용 (data4.html 에 전역 print 블록이 없었음)
```css
@media print {
  @page { margin: .5cm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact;
      animation: none !important; transition-duration: 0s !important; }
  * { box-shadow: none !important; }                 /* 잉크 절약 (design.md §6) */
  figure, table, .card, .seq-activity { break-inside: avoid; }
  .seq-tray { display: none; }                        /* 미배치 칩 풀 숨김 */
  .seq-slot { border: 2px solid #4b3b6b; background: #fff; }
  .seq-slot.is-correct, .seq-slot.is-wrong { background: #fff; }   /* 색 → 아이콘/텍스트 */
  .seq-slot.is-correct .seq-mark::after { content: ' ✓ 정답'; }
  .seq-slot.is-wrong .seq-mark::after { content: ' ✗ 다시'; }
  .seq-num { background: #d6c4f5; }                   /* 색 배지 정보위계 유지 */
}
```
- `.sheet-progress` 전용 `@media print`(위젯 숨김, 27~92행)는 그대로 두고 이 전역 블록을 추가로 신설.

### 재현 체크리스트
1. 수업 활동지 탭 → PREVIOUSLY 카드 맨 아래, NOTE 박스 밑에 `2px dashed` 구분선 + `ORDER` 라벨 +
   "오늘 쓸 4단계, 순서부터 맞춰 보기" 제목 + 뒤섞인 칩 4장(첫 칩 = "데이터 분석하기") + ①~④ 빈 칸이 보인다.
2. 칩 클릭 → 보라(`#d6c4f5`) 강조 + `aria-pressed="true"`. 이어서 빈 칸 클릭 → 칩이 그 칸으로 이동,
   칸이 솔리드(`.is-filled`)로 바뀌고 슬롯 `aria-label` 이 "① 자리: 데이터 분석하기" 로 갱신.
3. 마우스로 칩을 칸에 드래그해도 배치됨. 찬 칸끼리 드래그하면 두 칩이 교환됨. 칸의 칩을 트레이로
   드래그하면 복귀. 트레이가 비면 `EMPTY` 표시.
4. 정답 순서(문제 정하기 / 데이터 수집·특성 파악 / 데이터 분석하기 / 결과 해석·공유)로 채운 뒤
   `✅ 순서 확인` → 4칸 모두 `#d8f0c4` + `✓`, `#seqResultPrev` = "4칸 모두 정답! …".
5. 일부만 맞추고 확인 → 맞은 칸 초록+`✓`, 틀린 칸 `#f7bfb2`+`✗`, 결과 = "4칸 중 n칸 정답. …"(정답 배열은
   노출 안 됨). 빈 칸이 있으면 "빈 칸이 있어요…" 만 표시(채점 안 함).
6. `🔄 다시 섞기` → 슬롯 비고 트레이가 정답과 다른 새 순열로 재배치, 채점 색/결과 문구/선택 초기화.
7. 키보드: Tab 으로 칩·슬롯·버튼 이동 시 `:focus-visible` = `outline:3px solid #ee9dbf; outline-offset:2px`.
   칩에서 Enter/Space = 선택, 슬롯에서 Enter/Space = 배치/회수, Esc = 선택 해제.
8. 다른 탭으로 갔다가 활동지 탭으로 복귀 → 활동이 초기 뒤섞임으로 리셋(정적 마크업 재마운트, 의도된 동작).
9. Ctrl+P 인쇄 미리보기 → `.seq-tray` 숨김, 슬롯은 흰 배경 + `2px` 검정 테두리, 채점 칸은
   `✓ 정답` / `✗ 다시` 텍스트, 번호 배지 `#d6c4f5` 유지, `.seq-activity` 가 페이지 경계에서 안 쪼개짐.
10. ACTIVITY_5 `#mangaTable` 복사 방지·시간표·급식·진행률 위젯 등 기존 기능은 변화 없음.

### 검증 결과 (조립 시점)
- 새 `<script>` 블록: 중괄호 72/72 · 소괄호 250/250 · 대괄호 10/10 · 백틱 0, 구문 오류 없음
  (Microsoft.JScript 컴파일: `document`/`MutationObserver` 미정의 경고만 — 브라우저 전역이라 정상).
- 태그 델타: `<div>`/`</div>` 426/426 균형. `<script>`/`</script>` 새로 1쌍 추가.


---

## 구글 사이트 임베드용 자체완결화 (data4_1.html)

`output/data4_1.html` = `data4.html` 의 **구글 사이트 "삽입 → 코드 삽입"(HTML 붙여넣기)** 용 파생본.
URL 호스팅(GitHub Pages)은 원본으로 충분하지만, 코드 붙여넣기는 임베드 iframe 샌드박스 CSP가
외부 `<script src>` · 웹폰트 요청을 막아 폰트·런타임이 깨진다. 그래서 외부 의존을 인라인한다.
(**`data4.html` 은 수정하지 않는다.** data4_1.html 만.)

### 인라인한 것 (`<head>`, dc-runtime `<script>` 앞)
1. **React 18.3.1 UMD production** (`react.production.min.js`, ~10.8KB) — `<script>` 인라인.
2. **ReactDOM 18.3.1 UMD production** (`react-dom.production.min.js`, ~132KB) — `<script>` 인라인 (React 다음).
   - UMD 래퍼가 `self`(=iframe window) 에 `window.React` / `window.ReactDOM` 를 세팅 → dc-runtime 의
     `loadReactUmd()` 가 `if (w.React && w.ReactDOM) return Promise.resolve();` 로 unpkg fetch 를 **스킵**.
   - `src/cdn.ts` 의 `REACT_URL` / `REACT_DOM_URL` / `BABEL_URL` 상수는 `""` 로 비우고 원본 URL 은 `/* was … */` 주석으로 보존(실행 경로에서 안 쓰임, Babel 은 이 문서에서 미사용).
3. **디자인 실서체 7종 woff2 → base64 `@font-face` 로 `<head>` 인라인 `<style>` 에 전부 인라인** (`@import` 없음, 외부참조 0):

   | family | weight | 파일 (출처: `cdn.jsdelivr.net/gh/fonts-archive/…`) | 용도 |
   |---|---|---|---|
   | `GangwonEdu` | 400 | `GangwonEduPower/GangwonEduPower.woff2` (~180KB) | 페이지·섹션 큰 제목 |
   | `CookieRun` | 400 | `CookieRun/CookieRun-Regular.woff2` (~338KB) | (드묾) |
   | `CookieRun` | 700 | `CookieRun/CookieRun-Bold.woff2` (~339KB) | 소제목·버튼·칩·표헤더·강조 |
   | `Maplestory` | 300 | `Maplestory/Maplestory-Light.woff2` (~234KB) | body 기본·본문·폼 |
   | `Maplestory` | 700 | `Maplestory/Maplestory-Bold.woff2` (~245KB) | 본문 강조 |
   | `Silkscreen` | 400 / 700 | Google Fonts gstatic woff2 (latin 서브셋, ~16KB) | 픽셀 영문 라벨 |

   - `data4.html` 과 **동일 서체**: data4.html 은 GangwonEdu 를 jsdelivr `GangwonEduPower.woff2` 로, CookieRun/Maplestory 를 로컬 `output/fonts/*.ttf` 로 쓴다. jsdelivr woff2 는 그 TTF 와 같은 폰트(용량만 1/10). `output/fonts/GangwonEduTteunTteun.ttf` 는 **다른 변형**이라 안 씀 — 기준은 `GangwonEduPower`.
   - **CookieRun-Black 은 포함 안 함**(디자인에서 미사용). Silkscreen 은 latin 서브셋만(한글 라벨 없음).

### 폰트 전략 — 왜 이렇게 하나
- 예전엔 `@import url(fonts.googleapis.com…Do+Hyeon,Jua,Gowun+Dodum,Silkscreen)` + 시스템 폴백으로 뒀으나,
  구글 사이트 임베드에서 `@import` 가 막히면 디자인 서체가 통째로 시스템 폰트로 떨어져 **원본과 안 맞았다**.
- 이제 **실서체 5종을 base64 로 인라인**해 `data4.html` 과 픽셀 동일. woff2 라 5종 합쳐도 ~1.34MB(base64 ~1.78MB).
  글리프 서브셋은 안 한다 — NEIS 실시간 데이터(급식·과목명)의 글리프를 빌드시 알 수 없어 누락(두부) 위험. woff2 풀셋이면 안전.
- **font 이름 치환**(이전 `@import` 대체본 → 실서체): 파일 전체에서
  `'Do Hyeon'`→`'GangwonEdu'` (×7), `'Jua'`→`'CookieRun'` (×74 + `\'…\'` 이스케이프형 ×2), `'Gowun Dodum'`→`'Maplestory'` (×7). `'Silkscreen'` (×86) 은 유지.
- **각 스택 뒤 한글 시스템 폴백은 그대로 유지**(최후 폴백): `…, Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif` / 픽셀은 `…, Apple SD Gothic Neo, Malgun Gothic, monospace`. (따옴표 없는 CSS 식별자 시퀀스 — JS 문자열 이스케이프 충돌 회피.)
- `<helmet>` 의 google-fonts `<link>`/`preconnect` 는 이미 없음. `@import` 줄도 삭제.

### 최종 상태
- 파일 크기: **약 2.33MB** (원본 ~381KB + React/ReactDOM ~143KB + 실서체 7종 base64 ~1.8MB).
- **실행되는 외부 참조: 0.**
  - `@import` 삭제, 폰트 7종 전부 base64 인라인.
  - `unpkg` ×3 은 `var …_URL = "";` (원본 URL 은 `/* was … */` 주석). fetch 안 함(React 인라인).
  - `open.neis.go.kr` 는 원래부터 무인증 fetch + 인라인 스냅샷 폴백(임베드에서 막혀도 시간표·급식은 스냅샷 표시). 그대로 둠.
  - `reactjs.org`(에러 디코더 URL), `w3.org`(SVG ns) 는 React/SVG 내부 문자열 — 네트워크 요청 아님.
- 기존 동작 100% 유지: 4탭 / NEIS fetch+스냅샷 폴백 / 시간표 자동선택·지난날 흐림·일간 절삭 / 급식 이름정리 / 진행률 위젯 / 만화표 복사방지 / 인쇄 CSS.
- `hideRawTemplate()`(`x-dc{display:none!important}`) 그대로 → 하이드레이션 전 raw 템플릿 안 보임.

### data4.html 이 바뀌면 data4_1.html 재생성하는 법
1. 바뀐 `data4.html` 을 base 로 시작.
2. `<helmet>` 의 google-fonts `<link>`/`preconnect` 삭제.
3. 폰트 이름 치환: `'GangwonEdu'`/`'CookieRun'`/`'Maplestory'`/`'Silkscreen'` 스택 끝에 한글 폴백 추가
   (`'CookieRun', sans-serif` → `'CookieRun', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif` 등, JS `\'…\'` 형태 포함). 픽셀은 `…, monospace`.
   (data4.html 이 이미 GangwonEdu/CookieRun/Maplestory 를 쓰면 이름 치환은 불필요, 폴백만 추가.)
4. woff2 7종 curl → `base64 -w0`:
   ```
   cdn.jsdelivr.net/gh/fonts-archive/GangwonEduPower/GangwonEduPower.woff2
   cdn.jsdelivr.net/gh/fonts-archive/CookieRun/CookieRun-Regular.woff2
   cdn.jsdelivr.net/gh/fonts-archive/CookieRun/CookieRun-Bold.woff2
   cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Light.woff2
   cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Bold.woff2
   # Silkscreen 400/700: fonts.googleapis.com/css2?family=Silkscreen:wght@400;700 → latin 서브셋 woff2 URL
   ```
5. `<head>` 의 dc-runtime `<script>` **앞**에: `<style>`(GangwonEdu 400 + CookieRun 400/700 + Maplestory 300/700 + Silkscreen 400/700 `@font-face`, `font-display:swap`) → React UMD `<script>` → ReactDOM UMD `<script>` 순으로 삽입.
6. `src/cdn.ts` 의 `REACT_URL`/`REACT_DOM_URL`/`BABEL_URL` 을 `""` 로.
7. 헤드리스로 **완전 오프라인**(`--host-resolver-rules="MAP * ~NOTFOUND"`) 렌더 → data4.html 로컬본(fonts 폴더 포함)과 폰트 픽셀 동일 확인.

### 검증 결과 (2026-09-04, 폰트 실서체화 후)
- **완전 오프라인(`MAP * ~NOTFOUND`)**: 앱 정상 부팅(React 인라인). 4탭 모두 렌더.
  제목 = **GangwonEduPower**, 소제목/칩/버튼/표헤더/진행률 = **CookieRun Bold**, 본문/폼 = **Maplestory Light**, 픽셀 라벨 = **Silkscreen**.
- **data4.html 로컬본(네트워크 허용, GangwonEdu 는 jsdelivr) 대비**: rules·sheet 탭 스크린샷 비교 시 **글자꼴·굵기·줄바꿈 위치까지 픽셀 동일**. 두부(□) 없음.

---

## "PDF로 저장하기" 버튼 — 클릭 한 번에 다운로드 (data4_1.html 전용)

`docs/rules/pdf.md` 가 기술하는 방식(html2canvas 캡처 → jsPDF `pdf.save()` 즉시 다운로드)을
data4_1.html 에 이식. **`data4.html` 은 건드리지 않는다** — data4_1.html 만.
(data4.html 은 GitHub Pages URL 임베드용이라 외부 CDN `<script src>` 로 html2canvas/jsPDF 를
불러오면 되지만, data4_1.html 은 "실행되는 외부 참조 0" 계약이라 라이브러리도 인라인해야 한다.)

### 인라인한 것 (`<head>`, ReactDOM `<script>` 바로 뒤 · dc-runtime `<script>` 앞)
1. **html2canvas 1.4.1** (`cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`, ~194KB) — `<script>` 인라인. `window.html2canvas` 노출.
2. **jsPDF 2.5.1 UMD** (`cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`, ~356KB) — `<script>` 인라인. `window.jspdf.jsPDF` 노출.
   - 둘 다 원본 파일에 `</script>`·`<!--` 리터럴 없음(그대로 인라인해도 파싱 안 깨짐).

### `savePdf` 재작성 (renderVals 안, `<sc-if isSheet>` 컴포넌트 `<script>`)
- 라이브러리(`window.html2canvas`·`window.jspdf.jsPDF`) 또는 `#sheetPrintArea` 가 없으면
  **기존 폴백 유지**: `document.body.classList.add('print-sheet-only')` + `window.print()`
  (오프라인·CSP 차단 환경). 이 경로용 `@media print body.print-sheet-only` CSS 는 그대로 둠.
- 정상 경로:
  1. `#sheetPrintArea` 를 `cloneNode(true)` → 화면 밖(`position:fixed; left:-10000px`) `width:820px` 흰 배경 holder 에 넣음. **원본 화면은 안 건드림**(zoom:1.1 래퍼 밖이라 좌표 왜곡도 없음).
  2. 복제본에서: `#pdfBtn` 묶음(버튼+SAVED 배지) `display:none`, `.seq-tray`/`.ca-tray` `display:none`,
     **모든 `textarea.blank` → `<div>`**(원본 `liveEl.value` 를 읽어 같은 모양 상자로; html2canvas 가 textarea 내부 글자를 못 그림), 중복 `id` 전부 제거.
  3. `document.fonts.ready` (1.5s 상한 `Promise.race`) → 80ms → `html2canvas(clone, {scale:2, backgroundColor:'#ffffff', useCORS:true})`.
  4. jsPDF `'p','pt','a4'` 문서에 캔버스를 페이지 높이(`canvas.width * ph/pw`)만큼 잘라 여러 장으로 삽입.
     각 조각은 **JPEG(품질 0.9)** — PNG 로 하면 페이지당 십수 MB(전체 ~79MB)라 반드시 JPEG.
  5. `pdf.save(fname + '.pdf')` — 브라우저 표준 다운로드(대개 "다운로드" 폴더). 파일명 규칙은 기존과 동일(`학년+반(2)+번호(2) 이름 활동지.pdf`, 하나라도 비면 `활동지.pdf`).
  6. `finally`: holder 제거, 버튼 문구/활성 복구. 성공 시 `setState({saved:true})` 로 SAVED 배지 + 진행률 위젯 갱신.
- 페이지 나누기는 **기계적 균등 분할**(data3.html 의 `findSafeBreak` 금지구간 회피 로직은 이식 안 함).
  표/활동 카드가 페이지 경계서 갈릴 수 있으나 활동지 특성상 허용 범위로 판단. 필요해지면 그때 이식.

### 파일 크기
- 약 2.33MB → **약 2.89MB** (html2canvas ~194KB + jsPDF ~356KB 인라인분).

### 검증 (2026-09-04, 헤드리스 Chrome `--virtual-time-budget`)
- 인라인 후 앱 정상 부팅(React/dc-runtime 와 html2canvas/jsPDF 충돌 없음). 4탭 렌더 정상. 콘솔 에러 0.
- `window.html2canvas`=function, `window.jspdf.jsPDF`=function 노출 확인.
- 수업 활동지 탭 → 이름칸 입력 → `#pdfBtn` 클릭: 복제본 캡처 canvas **1544×12856(scale 2)**,
  **6페이지 A4 PDF** 생성 성공. JPEG 0.9 기준 blob 크기 정상(수 MB 대). holder 정리·버튼 복구 확인.
- `data4.html 이 바뀌면 재생성` 절차에 추가할 것: 위 `<head>` 인라인 2종 + `savePdf` 재작성.

---

## 스크린샷 그리드 정규화 (여러 장 이미지 균일화)

### 목적
`.shot-grid`(특히 `--2x2`) 안에 캡처 이미지가 2장 이상인데 비율·크기·포맷이 제각각이면
칸 높이가 들쭉날쭉하고, 일부만 `.shot-ph style="max-width:66.67%"` 같은 개별 스타일이 붙어
그리드가 깨져 보인다. → **모두 같은 규격의 흰 정사각 캔버스로 다시 그린다.**
규격 정의는 `design.md` §3.15. (2026-09-10 `data5_2.html` MISSION 3 비교 분석 그리드에 최초 적용.)

### 절차
1. **대상 그리드 특정** — 해당 미션 마커에서 `class="shot-grid shot-grid--2x2"` 를 찾고,
   그 여는 `<div` 부터 `<div>`/`</div>` 깊이 카운트로 닫는 `</div>` 까지가 블록.
   (다른 미션이 같은 이미지(예: `그래프1.png` ① 단계)를 공유하므로 **블록 범위 안에서만** 치환.)
2. **각 `<img>` 의 base64 추출** → 아래 스크립트로 정규화 → 새 PNG base64 로 교체.
   `data:image/jpeg` 였던 것도 `data:image/png` 로 바꾼다.
3. **`.shot-ph` 래퍼의 인라인 style 제거** — `style="max-width:66.67%; margin:0 auto"` 등 삭제,
   `data-shot="…"` 식별자는 유지. (블록 범위로 한정 — 다른 미션 그리드 건드리지 말 것.)
4. 원래 줄바꿈(LF/CRLF) 유지해 다시 저장.

### 정규화 스크립트 (PowerShell + System.Drawing)
```powershell
Add-Type -AssemblyName System.Drawing
$CANVAS = 600; $SAFE = 560        # 정사각 크기 / 안전영역(가장자리 20px 여백)
foreach ($src in $paths) {
  $o = [System.Drawing.Image]::FromFile($src); $ow=$o.Width; $oh=$o.Height
  $sx=[double]$SAFE/[double]$ow; $sy=[double]$SAFE/[double]$oh          # ★ 반드시 [double] 캐스팅
  $scale = [double][Math]::Min([double][Math]::Min($sx,$sy), [double]1.6)   # 축소 무제한 · 확대 최대 1.6x
  $nw=[int][Math]::Round($ow*$scale); $nh=[int][Math]::Round($oh*$scale)
  $bmp = New-Object System.Drawing.Bitmap($CANVAS,$CANVAS); $bmp.SetResolution(96,96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($o, (New-Object System.Drawing.Rectangle([int](($CANVAS-$nw)/2),[int](($CANVAS-$nh)/2),$nw,$nh)))
  $g.Dispose()
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); $o.Dispose()
}
```
- **`[Math]::Min(정수1, 0.9…)` 함정**: PowerShell이 `0.9…` 를 `[int]` 로 반올림(→1)해 축소가 안 먹는다.
  피연산자를 모두 `[double]` 로 캐스팅할 것.
- **스크린샷 픽셀은 손대지 않음** — contain 배치·여백만. 굽힌 캡션 텍스트 crop 등은 하지 않는다(별도 요청 시만).
- 작은 이미지(예: 툴바 띠)는 1.6x 확대해도 약간 흐릿 — 허용. 그 이상 확대 금지.

### 파일 크기
- 정사각 PNG 4장이면 원본 대비 **+0.4~0.5MB** 정도 증가 가능(내장형 파일이라 base64 33% 포함).
  크기가 부담되면 `$CANVAS` 를 520~560 으로 낮추거나 확대 배율을 1.3x 로 줄인다.

### 검증
- 헤드리스로 해당 탭(또는 그리드만 담은 임시 HTML) 렌더 → **콘솔 에러 0**, `.shot-ph` 칸 수 유지.
- 그리드 스크린샷 육안: 4칸이 **동일 크기·정렬**, 테두리·모서리·배경 균일한지.
- 다른 미션 그리드의 `max-width:66.67%` 가 실수로 지워지지 않았는지 파일 전체 카운트로 확인.
